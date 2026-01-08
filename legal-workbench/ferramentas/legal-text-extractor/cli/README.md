# Legal Text Extractor - CLI Unificada

CLI unificada para o pipeline de extracao de texto juridico de documentos processuais brasileiros.

## Instalacao

### Via pip (recomendado)

```bash
cd legal-workbench/ferramentas/legal-text-extractor
source .venv/bin/activate  # ou crie: python3 -m venv .venv && source .venv/bin/activate

# Instalacao basica
pip install -e .

# Com suporte a Marker OCR (requer ~10GB RAM)
pip install -e ".[marker]"

# Com suporte a Tesseract OCR
pip install -e ".[tesseract]"

# Instalacao completa (todos os engines)
pip install -e ".[all]"

# Com ferramentas de desenvolvimento
pip install -e ".[dev]"
```

### Via requirements.txt

```bash
pip install -r requirements.txt
```

## Comandos Disponiveis

Apos instalacao, o comando `lte` estara disponivel globalmente:

```bash
lte --help              # Ajuda geral
lte process --help      # Ajuda do comando process
lte stats --help        # Ajuda do comando stats
lte batch --help        # Ajuda do comando batch
lte version             # Informacoes de versao e engines
```

---

## lte process

Processa um documento PDF e extrai texto limpo.

```bash
lte process <arquivo> [OPTIONS]
```

### Opcoes

| Opcao | Descricao | Default |
|-------|-----------|---------|
| `--engine`, `-e` | Engine de extracao: auto, marker, pdfplumber, tesseract | auto |
| `--output`, `-o` | Diretorio de saida | mesmo do arquivo |
| `--format`, `-f` | Formato de saida: text, markdown, json | text |
| `--force-ocr` | Forcar OCR em todas as paginas | False |
| `--low-memory` | Modo de baixa memoria | False |
| `--context-db`, `-c` | Banco Context Store para aprendizado | None |
| `--cnj` | Numero CNJ do processo | None |
| `--sistema` | Sistema judicial (pje, eproc, etc) | None |
| `--verbose`, `-v` | Modo verbose | False |

### Exemplos

```bash
# Processamento basico
lte process documento.pdf

# Com engine especifica e OCR forcado
lte process scanned.pdf --engine marker --force-ocr

# Saida em JSON
lte process processo.pdf --output ./results --format json

# Com aprendizado no Context Store
lte process processo.pdf --context-db data/context.db --cnj "0000000-00.0000.0.00.0000" --sistema pje

# Modo verbose
lte process documento.pdf -v
```

---

## lte stats

Exibe estatisticas do Context Store.

```bash
lte stats [OPTIONS]
```

### Opcoes

| Opcao | Descricao | Default |
|-------|-----------|---------|
| `--db`, `-d` | Caminho para o banco SQLite | data/context.db |
| `--engine`, `-e` | Filtrar por engine | None |
| `--since`, `-s` | Filtrar desde data (YYYY-MM-DD) | None |
| `--limit`, `-n` | Numero de itens nas listas | 10 |
| `--section` | Secao especifica: summary, engines, patterns, recent, casos | todas |
| `--export` | Exportar: json, csv | None |
| `--output`, `-o` | Arquivo de saida para export | stdout |

### Exemplos

```bash
# Dashboard completo
lte stats --db data/context.db

# Filtrar por engine e data
lte stats --since 2025-01-01 --engine marker

# Apenas estatisticas de engines
lte stats --section engines --limit 5

# Exportar para JSON
lte stats --export json --output stats.json

# Exportar para CSV
lte stats --export csv > stats.csv
```

### Output de Exemplo

```
+---------------------- Resumo do Context Store ----------------------+
| Casos: 20                                                           |
| Padroes: 303 (266 ativos, 37 deprecados)                           |
| Ocorrencias: 3153                                                   |
| Divergencias: 45                                                    |
| Confianca Media: 79.4%                                              |
+---------------------------------------------------------------------+

                      Estatisticas por Engine
+------------+---------+--------+------------+------------+-----------+
| Engine     | Padroes | Ativos | Deprecados | Ocorrencia | Confianca |
+------------+---------+--------+------------+------------+-----------+
| marker     |     166 |    141 |         25 |       1748 |     85.0% |
| pdfplumber |     115 |    108 |          7 |       1234 |     74.8% |
| tesseract  |      22 |     17 |          5 |        171 |     61.5% |
+------------+---------+--------+------------+------------+-----------+
```

---

## lte batch

Processamento em lote de multiplos documentos PDF.

```bash
lte batch <diretorio> [OPTIONS]
```

### Opcoes

| Opcao | Descricao | Default |
|-------|-----------|---------|
| `--engine`, `-e` | Engine de extracao | auto |
| `--output`, `-o` | Diretorio de saida | mesmo da entrada |
| `--format`, `-f` | Formato de saida | text |
| `--parallel`, `-p` | Numero de processos paralelos | 1 |
| `--recursive`, `-r` | Buscar PDFs recursivamente | False |
| `--pattern` | Padrao glob para filtrar arquivos | *.pdf |
| `--context-db`, `-c` | Banco Context Store | None |
| `--force-ocr` | Forcar OCR | False |
| `--low-memory` | Modo de baixa memoria | False |
| `--verbose`, `-v` | Modo verbose | False |
| `--dry-run` | Apenas listar arquivos | False |

### Exemplos

```bash
# Processar todos os PDFs no diretorio
lte batch ./documentos

# Processamento paralelo
lte batch ./documentos --parallel 4 --engine marker

# Busca recursiva com filtro
lte batch ./documentos --recursive --pattern "processo_*.pdf"

# Saida em diretorio separado
lte batch ./documentos --output ./resultados --format json

# Apenas listar arquivos (dry run)
lte batch ./documentos --dry-run
```

---

## lte version

Mostra informacoes de versao e status dos engines.

```bash
lte version
```

### Output de Exemplo

```
+----------------------- Informacoes do Sistema -----------------------+
| Legal Text Extractor                                                  |
| Versao: 1.0.0                                                         |
| Author: Legal Workbench Team                                          |
| Python: 3.11.4                                                        |
|                                                                       |
| Engines disponiveis:                                                  |
|   - marker (OK)                                                       |
|   - pdfplumber (OK)                                                   |
|   - tesseract (NOT INSTALLED)                                         |
+-----------------------------------------------------------------------+
```

---

## Engines Disponiveis

| Engine | Qualidade | Uso | Requisitos |
|--------|-----------|-----|------------|
| `marker` | Alta | OCR avancado para PDFs escaneados | ~10GB RAM, pip install marker-pdf |
| `pdfplumber` | Alta | Extracao direta de texto nativo | Leve, instalado por padrao |
| `tesseract` | Media | OCR basico (fallback) | Tesseract instalado no sistema |
| `auto` | - | Seleciona automaticamente o melhor | - |

---

## Gerando Dados de Teste

Para testar o comando `stats`, gere dados de exemplo:

```bash
python -m cli.generate_sample_data --db data/sample_context.db --casos 20 --patterns 15
```

---

## Troubleshooting

### Database nao encontrado

```
Erro: Database nao encontrado: data/context.db
```

**Solucao:** Verifique o caminho ou processe documentos primeiro para criar o banco.

### Engine invalida

```
Erro: Engine invalida: ocr
Engines validas: auto, marker, pdfplumber, tesseract
```

**Solucao:** Use uma das engines suportadas.

### Marker nao disponivel (RAM)

```
Erro: Marker nao disponivel: RAM check failed
```

**Solucao:** Use `--low-memory` para ignorar verificacao de RAM, ou use outro engine.

### Formato de data invalido

```
Erro: Invalid date format: 01/2025. Use YYYY-MM-DD
```

**Solucao:** Use o formato ISO: `2025-01-15`

---

## Uso Programatico

Alem da CLI, os comandos podem ser usados programaticamente:

```python
from cli.main import app
from typer.testing import CliRunner

runner = CliRunner()
result = runner.invoke(app, ["process", "documento.pdf"])
print(result.stdout)
```

---

## Context Store Statistics (Legado)

O comando legado `python -m cli.context_stats` ainda funciona, mas o recomendado e usar `lte stats`:

```bash
# Legado
python -m cli.context_stats dashboard --db data/context.db

# Novo (recomendado)
lte stats --db data/context.db
```

---

*Ultima atualizacao: 2026-01-07*
