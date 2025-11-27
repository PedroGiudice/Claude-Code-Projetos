# Legal Extractor TUI

Terminal User Interface (TUI) for Brazilian Legal Document Text Extraction.

## Features

- Extract text from Brazilian legal PDFs (PJe, ESAJ, eProc, Projudi, STF, STJ)
- Automatic judicial system detection
- Intelligent text cleaning and noise removal
- Optional section analysis using Claude AI
- Export to multiple formats (TXT, Markdown, JSON)
- Real-time progress tracking

## Installation

```bash
pip install -e ".[dev]"
```

## Usage

```bash
legal-extractor-tui
```

Or run directly with Python:

```bash
python -m legal_extractor_tui
```

## Requirements

- Python 3.11+
- Textual (TUI framework)
- pdfplumber (PDF extraction)
- Claude API key (optional, for section analysis)

## Development

Install with development dependencies:

```bash
pip install -e ".[dev]"
```

Run tests:

```bash
pytest
```

Run linter:

```bash
ruff check .
```

## License

MIT
