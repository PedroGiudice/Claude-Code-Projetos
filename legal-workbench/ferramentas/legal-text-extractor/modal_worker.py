"""
Modal Worker - GPU-accelerated PDF extraction using Marker.

This module provides serverless GPU processing for PDF extraction.
Deploy to Modal and call via API or CLI.

Setup:
    pip install modal
    modal token new
    modal deploy modal_worker.py

Usage (CLI):
    modal run modal_worker.py --pdf-path /path/to/document.pdf

Usage (API - simple):
    from modal_worker import extract_pdf
    result = extract_pdf.remote(pdf_bytes)

Usage (API - chunked with progress):
    from modal_worker import extract_pdf_chunked
    for progress in extract_pdf_chunked.remote_gen(pdf_bytes, chunk_size=100):
        if progress["type"] == "progress":
            print(f"Chunk {progress['chunk']}/{progress['total_chunks']} ({progress['percent']}%)")
        elif progress["type"] == "result":
            final_result = progress["data"]

Cost: ~$3.50/hour (A100 80GB GPU), billed per second
Performance: 3-5x faster than A10G for Marker extraction
"""

import modal
from typing import Generator

# Define the Modal app
app = modal.App("lw-marker-extractor")

# Define container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "tesseract-ocr",
        "tesseract-ocr-por",
        "poppler-utils",
        "libgl1",
        "libglib2.0-0",
    )
    .pip_install(
        "marker-pdf>=1.0.0",
        "torch>=2.0.0",
        "pdfplumber>=0.10.0",
    )
)

# Volume for caching Hugging Face models (persist between runs)
model_cache = modal.Volume.from_name("marker-model-cache", create_if_missing=True)

# Constants
DEFAULT_CHUNK_SIZE = 100  # Pages per chunk for large PDFs


@app.function(
    image=image,
    gpu="A100-80GB",  # 80GB VRAM - max performance for Marker
    timeout=7200,  # 2 hours max (large scanned PDFs can take 1h+)
    volumes={"/cache": model_cache},
    secrets=[],  # Add secrets here if needed
)
def extract_pdf(pdf_bytes: bytes, force_ocr: bool = False, page_range: list = None) -> dict:
    """
    Extract text from PDF using Marker with GPU acceleration.

    Args:
        pdf_bytes: Raw PDF file content
        force_ocr: Force OCR on all pages (default: auto-detect)
        page_range: Optional list of page indices to process (0-indexed)

    Returns:
        dict with keys:
            - text: Extracted text content
            - pages: Number of pages processed
            - native_pages: Pages with native text
            - ocr_pages: Pages that required OCR
            - processing_time: Time in seconds
    """
    import os
    import time
    import tempfile

    # Set cache directories
    os.environ["HF_HOME"] = "/cache/huggingface"
    os.environ["TORCH_HOME"] = "/cache/torch"
    os.environ["MARKER_CACHE_DIR"] = "/cache/marker"

    # Import after setting env vars
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict
    from marker.output import text_from_rendered

    start_time = time.time()

    # Save PDF to temp file
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        pdf_path = f.name

    try:
        # Load models (cached after first run)
        print("Loading Marker models...")
        models = create_model_dict()
        print(f"Models loaded in {time.time() - start_time:.1f}s")

        # Configure converter
        # DOCUMENTAÇÃO DAS CONFIGURAÇÕES:
        # - force_ocr: False = Marker detecta automaticamente se OCR é necessário
        # - disable_image_extraction: True = não inclui imagens no output (só texto)
        # - common_element_threshold: 0.4 = ignora elementos em >40% das páginas (assinaturas, headers)
        # - drop_repeated_text: True = remove texto duplicado
        # - OcrBuilder_recognition_batch_size: 32 = batch maior = OCR mais rápido em GPU
        config = {
            "output_format": "markdown",
            "paginate_output": True,
            "disable_image_extraction": True,
            "force_ocr": force_ocr,  # False = auto-detect, True = força OCR em tudo
            # Otimizações para PDFs jurídicos (assinaturas repetidas, headers/footers)
            "common_element_threshold": 0.4,
            "common_element_min_blocks": 5,
            "drop_repeated_text": True,
            # Performance OCR
            "OcrBuilder_recognition_batch_size": 32,
        }
        if page_range:
            config["page_range"] = page_range
            print(f"Processing pages: {page_range}")

        converter = PdfConverter(
            artifact_dict=models,
            config=config,
        )

        # Process PDF
        print(f"Processing PDF...")
        convert_start = time.time()
        rendered = converter(pdf_path)
        text, images, metadata = text_from_rendered(rendered)
        convert_time = time.time() - convert_start

        total_time = time.time() - start_time

        # Extract page counts from metadata
        pages = metadata.get("pages", 0)
        native_pages = metadata.get("native_pages", pages)
        ocr_pages = metadata.get("ocr_pages", 0)

        print(f"Extraction complete: {len(text):,} chars, {pages} pages in {convert_time:.1f}s")

        return {
            "text": text,
            "pages": pages,
            "native_pages": native_pages,
            "ocr_pages": ocr_pages,
            "chars": len(text),
            "processing_time": round(total_time, 2),
            "convert_time": round(convert_time, 2),
        }

    finally:
        # Cleanup temp file
        os.unlink(pdf_path)


@app.function(
    image=image,
    gpu=None,  # CPU only - just counting pages
    timeout=60,
)
def get_pdf_page_count(pdf_bytes: bytes) -> int:
    """
    Get the total number of pages in a PDF.

    Args:
        pdf_bytes: Raw PDF file content

    Returns:
        Total number of pages
    """
    import tempfile
    import pdfplumber

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        pdf_path = f.name

    try:
        with pdfplumber.open(pdf_path) as pdf:
            return len(pdf.pages)
    finally:
        import os
        os.unlink(pdf_path)


@app.function(
    image=image,
    gpu="A100-80GB",
    timeout=14400,  # 4 hours max for very large PDFs with multiple chunks
    volumes={"/cache": model_cache},
)
def extract_pdf_chunked(
    pdf_bytes: bytes,
    force_ocr: bool = False,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    auto_chunk: bool = True,
) -> Generator[dict, None, None]:
    """
    Extract text from PDF with automatic chunking and progress updates.

    For PDFs larger than chunk_size pages, processes in chunks and yields
    progress updates. Use with .remote_gen() for streaming.

    Args:
        pdf_bytes: Raw PDF file content
        force_ocr: Force OCR on all pages (default: auto-detect)
        chunk_size: Number of pages per chunk (default: 100)
        auto_chunk: If False, process entire PDF at once regardless of size

    Yields:
        Progress updates: {"type": "progress", "chunk": 1, "total_chunks": 7, "percent": 14, ...}
        Final result: {"type": "result", "data": {...}}

    Example:
        for update in extract_pdf_chunked.remote_gen(pdf_bytes):
            if update["type"] == "progress":
                print(f"{update['percent']}% complete")
            elif update["type"] == "result":
                text = update["data"]["text"]
    """
    import os
    import time
    import tempfile

    # Set cache directories
    os.environ["HF_HOME"] = "/cache/huggingface"
    os.environ["TORCH_HOME"] = "/cache/torch"
    os.environ["MARKER_CACHE_DIR"] = "/cache/marker"

    # Import after setting env vars
    import pdfplumber
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict
    from marker.output import text_from_rendered

    start_time = time.time()

    # Save PDF to temp file
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        pdf_path = f.name

    try:
        # Get page count
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)

        print(f"PDF has {total_pages} pages")

        # Determine if chunking is needed
        if not auto_chunk or total_pages <= chunk_size:
            # Process entire PDF at once (delegate to original function logic)
            print("Processing entire PDF (no chunking needed)")

            yield {
                "type": "progress",
                "chunk": 1,
                "total_chunks": 1,
                "percent": 0,
                "pages_processed": 0,
                "total_pages": total_pages,
                "message": "Loading models...",
            }

            # Load models
            models = create_model_dict()

            yield {
                "type": "progress",
                "chunk": 1,
                "total_chunks": 1,
                "percent": 10,
                "pages_processed": 0,
                "total_pages": total_pages,
                "message": "Processing PDF...",
            }

            # Configure and run
            config = {
                "output_format": "markdown",
                "paginate_output": True,
                "disable_image_extraction": True,
                "force_ocr": force_ocr,
                "common_element_threshold": 0.4,
                "common_element_min_blocks": 5,
                "drop_repeated_text": True,
                "OcrBuilder_recognition_batch_size": 32,
            }

            converter = PdfConverter(artifact_dict=models, config=config)
            rendered = converter(pdf_path)
            text, images, metadata = text_from_rendered(rendered)

            total_time = time.time() - start_time
            pages = metadata.get("pages", total_pages)

            yield {
                "type": "result",
                "data": {
                    "text": text,
                    "pages": pages,
                    "native_pages": metadata.get("native_pages", pages),
                    "ocr_pages": metadata.get("ocr_pages", 0),
                    "chars": len(text),
                    "processing_time": round(total_time, 2),
                    "chunked": False,
                    "total_chunks": 1,
                },
            }
            return

        # Chunked processing
        chunks = []
        for i in range(0, total_pages, chunk_size):
            chunk_end = min(i + chunk_size, total_pages)
            chunks.append(list(range(i, chunk_end)))

        total_chunks = len(chunks)
        print(f"Processing {total_pages} pages in {total_chunks} chunks of ~{chunk_size} pages")

        # Load models once
        yield {
            "type": "progress",
            "chunk": 0,
            "total_chunks": total_chunks,
            "percent": 0,
            "pages_processed": 0,
            "total_pages": total_pages,
            "message": "Loading models...",
        }

        models = create_model_dict()
        model_load_time = time.time() - start_time
        print(f"Models loaded in {model_load_time:.1f}s")

        # Process each chunk
        all_texts = []
        total_native_pages = 0
        total_ocr_pages = 0

        for chunk_idx, page_range in enumerate(chunks):
            chunk_num = chunk_idx + 1
            pages_so_far = sum(len(c) for c in chunks[:chunk_idx])
            percent = int((pages_so_far / total_pages) * 90) + 5  # 5-95% range

            yield {
                "type": "progress",
                "chunk": chunk_num,
                "total_chunks": total_chunks,
                "percent": percent,
                "pages_processed": pages_so_far,
                "total_pages": total_pages,
                "message": f"Processing chunk {chunk_num}/{total_chunks} (pages {page_range[0]+1}-{page_range[-1]+1})...",
            }

            print(f"Processing chunk {chunk_num}/{total_chunks}: pages {page_range[0]+1}-{page_range[-1]+1}")

            config = {
                "output_format": "markdown",
                "paginate_output": True,
                "disable_image_extraction": True,
                "force_ocr": force_ocr,
                "common_element_threshold": 0.4,
                "common_element_min_blocks": 5,
                "drop_repeated_text": True,
                "OcrBuilder_recognition_batch_size": 32,
                "page_range": page_range,
            }

            converter = PdfConverter(artifact_dict=models, config=config)
            chunk_start = time.time()
            rendered = converter(pdf_path)
            text, images, metadata = text_from_rendered(rendered)
            chunk_time = time.time() - chunk_start

            all_texts.append(text)
            total_native_pages += metadata.get("native_pages", len(page_range))
            total_ocr_pages += metadata.get("ocr_pages", 0)

            print(f"Chunk {chunk_num} done: {len(text):,} chars in {chunk_time:.1f}s")

        # Combine results
        combined_text = "\n\n".join(all_texts)
        total_time = time.time() - start_time

        print(f"All chunks complete: {len(combined_text):,} chars total in {total_time:.1f}s")

        yield {
            "type": "result",
            "data": {
                "text": combined_text,
                "pages": total_pages,
                "native_pages": total_native_pages,
                "ocr_pages": total_ocr_pages,
                "chars": len(combined_text),
                "processing_time": round(total_time, 2),
                "chunked": True,
                "total_chunks": total_chunks,
                "chunk_size": chunk_size,
            },
        }

    finally:
        # Cleanup temp file
        os.unlink(pdf_path)


@app.function(
    image=image,
    gpu="A100-80GB",  # 80GB VRAM - full performance
    timeout=600,  # 10 minutes for initial model download (~1.5GB)
    volumes={"/cache": model_cache},
)
def warmup_models():
    """
    Pre-load models to cache. Run once after deploy to speed up first extraction.

    Usage:
        modal run modal_worker.py::warmup_models
    """
    import os
    os.environ["HF_HOME"] = "/cache/huggingface"
    os.environ["TORCH_HOME"] = "/cache/torch"
    os.environ["MARKER_CACHE_DIR"] = "/cache/marker"

    from marker.models import create_model_dict

    print("Warming up Marker models...")
    models = create_model_dict()
    print("Models cached successfully!")
    return {"status": "ok", "models_loaded": len(models)}


@app.function(image=image, gpu="A100-80GB", timeout=30)
def health_check():
    """
    Verify GPU is available and working.

    Usage:
        modal run modal_worker.py::health_check
    """
    import torch

    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else None
    vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9 if cuda_available else 0

    return {
        "cuda_available": cuda_available,
        "device_name": device_name,
        "vram_gb": round(vram_gb, 1),
    }


@app.local_entrypoint()
def main(
    pdf_path: str = None,
    warmup: bool = False,
    health: bool = False,
    chunked: bool = False,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    count_pages: bool = False,
):
    """
    CLI entrypoint for testing.

    Examples:
        modal run modal_worker.py --health
        modal run modal_worker.py --warmup
        modal run modal_worker.py --pdf-path /path/to/doc.pdf
        modal run modal_worker.py --pdf-path /path/to/doc.pdf --chunked
        modal run modal_worker.py --pdf-path /path/to/doc.pdf --chunked --chunk-size 50
        modal run modal_worker.py --pdf-path /path/to/doc.pdf --count-pages
    """
    if health:
        result = health_check.remote()
        print(f"Health check: {result}")
        return

    if warmup:
        result = warmup_models.remote()
        print(f"Warmup complete: {result}")
        return

    if pdf_path:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        print(f"Sending {len(pdf_bytes):,} bytes to Modal...")

        if count_pages:
            page_count = get_pdf_page_count.remote(pdf_bytes)
            print(f"PDF has {page_count} pages")
            return

        if chunked:
            # Use chunked extraction with progress
            print(f"Using chunked extraction (chunk_size={chunk_size})")
            final_result = None

            for update in extract_pdf_chunked.remote_gen(
                pdf_bytes, chunk_size=chunk_size
            ):
                if update["type"] == "progress":
                    print(
                        f"[{update['percent']:3d}%] {update['message']} "
                        f"(chunk {update['chunk']}/{update['total_chunks']})"
                    )
                elif update["type"] == "result":
                    final_result = update["data"]

            result = final_result
            print("\n" + "=" * 60)
            print("RESULT (chunked)")
            print("=" * 60)
            print(f"Pages: {result['pages']} ({result['native_pages']} native, {result['ocr_pages']} OCR)")
            print(f"Chars: {result['chars']:,}")
            print(f"Time: {result['processing_time']}s")
            print(f"Chunks: {result['total_chunks']}")
        else:
            # Use simple extraction
            result = extract_pdf.remote(pdf_bytes)

            print("\n" + "=" * 60)
            print("RESULT")
            print("=" * 60)
            print(f"Pages: {result['pages']} ({result['native_pages']} native, {result['ocr_pages']} OCR)")
            print(f"Chars: {result['chars']:,}")
            print(f"Time: {result['processing_time']}s (convert: {result['convert_time']}s)")

        print("\nText preview:")
        print(result['text'][:500] + "..." if len(result['text']) > 500 else result['text'])
    else:
        print("Usage:")
        print("  modal run modal_worker.py --health")
        print("  modal run modal_worker.py --warmup")
        print("  modal run modal_worker.py --pdf-path /path/to/document.pdf")
        print("  modal run modal_worker.py --pdf-path /path/to/document.pdf --chunked")
        print("  modal run modal_worker.py --pdf-path /path/to/document.pdf --count-pages")
