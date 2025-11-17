#!/usr/bin/env python3
"""
TDD End-to-End Test: Download → Extract → Filter → Export

Testa o fluxo COMPLETO:
1. Download de caderno DJEN (PDF real)
2. Extração de texto
3. Filtro por OAB 129021/SP
4. Exportação de resultados
5. Métricas de performance
"""

import pytest
import time
from pathlib import Path
from datetime import datetime
import tempfile
import shutil

# Imports do sistema
from src import PDFTextExtractor, OABFilter
from src.oab_matcher import OABMatcher
from src.cache_manager import CacheManager
from src.result_exporter import ResultExporter


class TestEndToEndOAB129021:
    """Suite TDD para teste end-to-end com OAB 129021/SP"""

    @pytest.fixture
    def temp_dir(self):
        """Diretório temporário para testes"""
        tmpdir = tempfile.mkdtemp()
        yield Path(tmpdir)
        shutil.rmtree(tmpdir)

    @pytest.fixture
    def download_dir(self, temp_dir):
        """Diretório para downloads"""
        dl_dir = temp_dir / "downloads"
        dl_dir.mkdir(parents=True, exist_ok=True)
        return dl_dir

    @pytest.fixture
    def cache_dir(self, temp_dir):
        """Diretório para cache"""
        cache_dir = temp_dir / "cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir

    def test_1_download_caderno_real(self, download_dir):
        """
        TDD TEST 1: Download de caderno DJEN real

        Expected behavior:
        - Baixa PDF de tribunal (STF - menor)
        - Valida que é PDF válido
        - Salva em download_dir
        - Retorna path do arquivo
        """
        import requests

        # Arrange
        tribunal = "STF"
        # Usar data fixa para teste (não hoje - pode não ter publicação)
        data = "2025-11-15"
        url = f"https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/E/download"
        output_file = download_dir / f"{tribunal}_{data}.pdf"

        print(f"\n🔍 TEST 1: Tentando download de {url}")

        # Act
        start_time = time.time()

        try:
            response = requests.get(url, timeout=30, stream=True)

            # Assert - Validações
            print(f"   Status Code: {response.status_code}")

            if response.status_code == 403:
                pytest.skip("❌ API bloqueou IP (403 - esperado fora do Brasil)")

            assert response.status_code == 200, f"Expected 200, got {response.status_code}"

            # Salvar PDF
            with open(output_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            download_time = time.time() - start_time
            file_size = output_file.stat().st_size

            # Validações do PDF
            assert output_file.exists(), "PDF não foi salvo"
            assert file_size > 1000, f"PDF muito pequeno ({file_size} bytes)"

            # Validar magic bytes PDF
            with open(output_file, 'rb') as f:
                header = f.read(4)
                assert header == b'%PDF', f"Não é PDF válido (header: {header})"

            # Métricas
            print(f"   ✅ Download OK: {file_size/1024:.1f} KB em {download_time:.2f}s")
            print(f"   Throughput: {(file_size/1024)/download_time:.1f} KB/s")

            # Performance expectations
            assert download_time < 30, f"Download muito lento: {download_time:.2f}s"

        except requests.exceptions.Timeout:
            pytest.fail("❌ Timeout ao baixar caderno (>30s)")
        except requests.exceptions.ConnectionError as e:
            pytest.fail(f"❌ Erro de conexão: {e}")

    def test_2_extract_text_from_pdf(self, download_dir, cache_dir):
        """
        TDD TEST 2: Extração de texto do PDF

        Expected behavior:
        - Lê PDF baixado no test_1
        - Extrai texto completo
        - Usa cache se disponível
        - Retorna string com texto
        - Valida que tem conteúdo
        """
        # Arrange
        pdf_file = list(download_dir.glob("*.pdf"))[0] if list(download_dir.glob("*.pdf")) else None

        if not pdf_file:
            pytest.skip("Sem PDF para testar (test_1 falhou?)")

        print(f"\n🔍 TEST 2: Extraindo texto de {pdf_file.name}")

        extractor = PDFTextExtractor()  # Cache gerenciado por OABFilter, não por PDFTextExtractor

        # Act
        start_time = time.time()
        text = extractor.extract(pdf_file)
        extraction_time = time.time() - start_time

        # Assert
        assert text is not None, "Extração retornou None"
        assert isinstance(text, str), f"Esperava string, recebeu {type(text)}"
        assert len(text) > 100, f"Texto muito curto: {len(text)} chars"

        # Validar que tem conteúdo legal típico
        legal_keywords = ["processo", "intimação", "sentença", "advogado", "juiz", "tribunal"]
        found_keywords = [kw for kw in legal_keywords if kw.lower() in text.lower()]

        assert len(found_keywords) > 0, f"Texto não parece ser jurídico. Amostra: {text[:200]}"

        # Métricas
        chars_per_sec = len(text) / extraction_time
        print(f"   ✅ Extração OK: {len(text):,} chars em {extraction_time:.2f}s")
        print(f"   Throughput: {chars_per_sec:,.0f} chars/s")
        print(f"   Keywords encontradas: {found_keywords}")

        # Performance expectations
        assert extraction_time < 10, f"Extração muito lenta: {extraction_time:.2f}s"

        # Testar cache
        start_cache = time.time()
        text_cached = extractor.extract(pdf_file)
        cache_time = time.time() - start_cache

        assert text == text_cached, "Cache retornou texto diferente"
        print(f"   ✅ Cache hit: {cache_time:.4f}s (speedup: {extraction_time/cache_time:.1f}x)")

    def test_3_filter_by_oab_129021(self, download_dir, cache_dir):
        """
        TDD TEST 3: Filtrar publicações por OAB 129021/SP

        Expected behavior:
        - Lê PDF e texto extraído
        - Aplica filtro OAB 129021/SP
        - Retorna matches (pode ser 0 se não tem essa OAB)
        - Cada match tem score, contexto, posição
        """
        # Arrange
        pdf_file = list(download_dir.glob("*.pdf"))[0] if list(download_dir.glob("*.pdf")) else None

        if not pdf_file:
            pytest.skip("Sem PDF para testar")

        print(f"\n🔍 TEST 3: Filtrando por OAB 129021/SP")

        oab_filter = OABFilter(cache_dir=cache_dir)
        target_oabs = [("129021", "SP")]

        # Act
        start_time = time.time()
        matches = oab_filter.filter_by_oabs(
            pdf_paths=[pdf_file],
            target_oabs=target_oabs,
            min_score=0.3  # Score baixo para pegar tudo
        )
        filter_time = time.time() - start_time

        # Assert
        assert isinstance(matches, list), f"Expected list, got {type(matches)}"

        print(f"   Matches encontrados: {len(matches)}")
        print(f"   Tempo de filtro: {filter_time:.2f}s")

        if len(matches) > 0:
            # Validar estrutura do primeiro match
            match = matches[0]
            assert hasattr(match, 'oab_numero'), "Match sem atributo oab_numero"
            assert hasattr(match, 'oab_uf'), "Match sem atributo oab_uf"
            assert hasattr(match, 'score_relevancia'), "Match sem score"
            assert hasattr(match, 'texto_contexto'), "Match sem contexto"

            print(f"\n   Primeiro match:")
            print(f"   - OAB: {match.oab_numero}/{match.oab_uf}")
            print(f"   - Score: {match.score_relevancia:.2f}")
            print(f"   - Contexto: {match.texto_contexto[:100]}...")

            # Validar que encontrou a OAB certa
            assert match.oab_numero == "129021", f"Expected 129021, got {match.oab_numero}"
            assert match.oab_uf == "SP", f"Expected SP, got {match.oab_uf}"

            print(f"   ✅ OAB 129021/SP encontrada!")
        else:
            print(f"   ℹ️  Nenhum match (OAB 129021/SP não está neste caderno)")
            # Não é falha - pode não ter essa OAB neste dia

        # Performance
        assert filter_time < 30, f"Filtro muito lento: {filter_time:.2f}s"

    def test_4_export_results(self, download_dir, cache_dir, temp_dir):
        """
        TDD TEST 4: Exportar resultados

        Expected behavior:
        - Pega matches do test_3
        - Exporta para JSON e Markdown
        - Valida arquivos criados
        - Valida conteúdo
        """
        # Arrange
        pdf_file = list(download_dir.glob("*.pdf"))[0] if list(download_dir.glob("*.pdf")) else None

        if not pdf_file:
            pytest.skip("Sem PDF para testar")

        print(f"\n🔍 TEST 4: Exportando resultados")

        oab_filter = OABFilter(cache_dir=cache_dir)
        matches = oab_filter.filter_by_oabs(
            pdf_paths=[pdf_file],
            target_oabs=[("129021", "SP")],
            min_score=0.3
        )

        exporter = ResultExporter()
        output_json = temp_dir / "results.json"
        output_md = temp_dir / "results.md"

        # Act
        start_time = time.time()
        exporter.export_json(matches, output_json)
        exporter.export_markdown(matches, output_md)
        export_time = time.time() - start_time

        # Assert
        assert output_json.exists(), "JSON não foi criado"
        assert output_md.exists(), "Markdown não foi criado"

        json_size = output_json.stat().st_size
        md_size = output_md.stat().st_size

        assert json_size > 10, f"JSON muito pequeno: {json_size} bytes"
        assert md_size > 10, f"Markdown muito pequeno: {md_size} bytes"

        print(f"   ✅ Exportação OK em {export_time:.2f}s")
        print(f"   - JSON: {json_size} bytes")
        print(f"   - Markdown: {md_size} bytes")

        # Validar conteúdo JSON
        import json
        with open(output_json) as f:
            data = json.load(f)

        assert isinstance(data, (list, dict)), "JSON inválido"
        print(f"   ✅ JSON válido")

    def test_5_end_to_end_metrics(self, download_dir, cache_dir, temp_dir):
        """
        TDD TEST 5: Métricas end-to-end completas

        Mede tempo total do fluxo:
        Download → Extract → Filter → Export
        """
        print(f"\n🔍 TEST 5: Métricas End-to-End Completas")
        print("=" * 60)

        # Esse teste roda tudo de novo para medir o fluxo completo
        # Pode pular se testes anteriores já mediram

        total_start = time.time()

        # Stats
        stats = {
            "download_time": 0,
            "extraction_time": 0,
            "filter_time": 0,
            "export_time": 0,
            "total_time": 0,
            "pdf_size_kb": 0,
            "text_chars": 0,
            "matches_found": 0
        }

        # Se já temos PDF do test_1, usar ele
        pdf_file = list(download_dir.glob("*.pdf"))[0] if list(download_dir.glob("*.pdf")) else None

        if pdf_file:
            stats["pdf_size_kb"] = pdf_file.stat().st_size / 1024
            print(f"Usando PDF existente: {pdf_file.name} ({stats['pdf_size_kb']:.1f} KB)")
        else:
            pytest.skip("Sem PDF para métricas")

        # Extract (com cache)
        extractor = PDFTextExtractor()  # Cache gerenciado por OABFilter, não por PDFTextExtractor
        start = time.time()
        text = extractor.extract(pdf_file)
        stats["extraction_time"] = time.time() - start
        stats["text_chars"] = len(text)

        # Filter
        oab_filter = OABFilter(cache_dir=cache_dir)
        start = time.time()
        matches = oab_filter.filter_by_oabs(
            pdf_paths=[pdf_file],
            target_oabs=[("129021", "SP")],
            min_score=0.3
        )
        stats["filter_time"] = time.time() - start
        stats["matches_found"] = len(matches)

        # Export
        exporter = ResultExporter()
        start = time.time()
        exporter.export_json(matches, temp_dir / "final_results.json")
        stats["export_time"] = time.time() - start

        stats["total_time"] = time.time() - total_start

        # Print metrics
        print(f"\n📊 MÉTRICAS FINAIS:")
        print(f"   PDF Size: {stats['pdf_size_kb']:.1f} KB")
        print(f"   Text Extracted: {stats['text_chars']:,} chars")
        print(f"   Matches Found: {stats['matches_found']}")
        print(f"\n⏱️  TEMPOS:")
        print(f"   Extraction: {stats['extraction_time']:.2f}s")
        print(f"   Filter: {stats['filter_time']:.2f}s")
        print(f"   Export: {stats['export_time']:.2f}s")
        print(f"   TOTAL: {stats['total_time']:.2f}s")

        print(f"\n🚀 THROUGHPUT:")
        if stats['total_time'] > 0:
            print(f"   {stats['pdf_size_kb']/stats['total_time']:.1f} KB/s")
            print(f"   {stats['text_chars']/stats['total_time']:,.0f} chars/s")

        # Assertions para performance
        assert stats['total_time'] < 60, f"Processo muito lento: {stats['total_time']:.2f}s"

        print(f"\n✅ Sistema operacional end-to-end!")


if __name__ == "__main__":
    # Rodar testes com pytest
    pytest.main([__file__, "-v", "-s"])
