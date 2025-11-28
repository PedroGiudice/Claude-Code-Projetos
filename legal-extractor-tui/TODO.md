# Legal Extractor TUI - Backlog

## Futuras Melhorias

### Windows Integration (Prioridade: Media)
- [ ] Criar `.bat` wrapper para abrir PDFs do Windows Explorer direto no WSL
- [ ] Adicionar entrada no menu de contexto do Windows ("Abrir com Legal Extractor")
- [ ] Converter path Windows (C:\...) para path WSL (/mnt/c/...) automaticamente

**Referência técnica:**
```bat
@echo off
wsl -e bash -c "source ~/.bashrc && legal '%~dp0%~nx1'"
```

**Registry para menu de contexto:**
```
HKEY_CLASSES_ROOT\.pdf\shell\LegalExtractor\command
```

---
*Criado: 2025-11-28*
