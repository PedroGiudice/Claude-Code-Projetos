# Legal Text Extractor

Agente de extração inteligente de texto de documentos jurídicos processuais brasileiros.

## Instalação

```bash
cd agentes/legal-text-extractor
python -m venv .venv
source .venv/bin/activate  # Linux/WSL
# .venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Uso

```python
from main import LegalTextExtractor

extractor = LegalTextExtractor()
result = extractor.process_pdf("processo.pdf", separate_sections=True)

print(f"Sistema: {result.system_name}")
print(f"Redução: {result.reduction_pct:.1f}%")
```

## Testes

```bash
pytest tests/
```

## Status

- ✅ Fase 1: Core de limpeza (75+ padrões)
- 🚧 Fase 2: OCR + Separação de seções (em andamento)
