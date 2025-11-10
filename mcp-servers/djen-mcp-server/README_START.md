# 🚀 DJEN MCP Server - START HERE!

## ✅ API Testada e Funcionando!

```
✅ 223,080 comunicações disponíveis (TJSP - 24/10/2025)
✅ 28 UFs com múltiplos tribunais
✅ API pública - sem credenciais necessárias
✅ Código completo e testado
```

## 🎯 Próximo Passo

### **➡️ LEIA: [COMECE_AQUI.md](COMECE_AQUI.md)**

Esse arquivo tem o guia completo de instalação em 5 passos.

## ⚡ Instalação Rápida

```bash
# 1. Instalar Build Tools (Windows - uma vez)
.\install-build-tools.ps1  # Como Administrador

# 2. Instalar dependências
npm install

# 3. Compilar
npm run build

# 4. Configurar Claude Desktop
# Editar: %APPDATA%\Claude\claude_desktop_config.json

# 5. Reiniciar Claude Desktop
```

## 📝 Documentação Disponível

| Arquivo | Descrição |
|---------|-----------|
| **[COMECE_AQUI.md](COMECE_AQUI.md)** | 👈 **COMECE POR AQUI!** |
| [INSTALACAO_ONE_CLICK.md](INSTALACAO_ONE_CLICK.md) | Guia detalhado de instalação |
| [IMPORTANTE_API_PUBLICA.md](IMPORTANTE_API_PUBLICA.md) | API é pública! |
| [RESUMO_EXECUTIVO_FINAL.md](RESUMO_EXECUTIVO_FINAL.md) | Visão completa |
| [test-api.cjs](test-api.cjs) | Script de teste da API |

## 🧪 Testar API (Sem Instalar)

```bash
node test-api.cjs
```

Deve retornar:
```
✅ Todos os testes concluídos com sucesso!
📝 A API DJEN está funcionando perfeitamente.
```

## 🎯 O Que Este Servidor Faz

Integra Claude Desktop com a **API pública do DJEN** (Diário de Justiça Eletrônico Nacional):

- 🔍 **Buscar** publicações por tribunal, data, processo
- 💾 **Armazenar** localmente com metadados completos
- 🧠 **RAG/IA** - Busca semântica inteligente
- 📊 **Análise** jurimetríca
- 📚 **Biblioteca** jurisprudencial
- 👁️ **Monitorar** processos específicos

## 📊 Status

```
📁 Código:      13 arquivos TypeScript
📖 Docs:        12 arquivos Markdown
🧪 Testes:      2 scripts
💾 Localização: E:\projetos\djen-mcp-server\
🗄️ Dados:       E:\djen-data\ (auto-criado)
```

## 🏛️ Tribunais Suportados

**Todos os tribunais brasileiros:**
- STF, STJ, STM, TSE, TST
- TJs (27 estados)
- TRFs (1ª a 6ª região)
- TRTs (1ª a 24ª região)
- TREs (todos os estados)
- CNJ, CJF

## ⚡ Características

- ✅ API Pública (sem credenciais)
- ✅ Detecção automática de HD externo
- ✅ Funciona em múltiplas máquinas
- ✅ Rate limiting respeitoso
- ✅ Download em lote
- ✅ Busca semântica com RAG
- ✅ Banco SQLite local

## 🚀 Início Rápido

1. **Leia:** [COMECE_AQUI.md](COMECE_AQUI.md)
2. **Instale Build Tools**
3. **Execute:** `npm install && npm run build`
4. **Configure Claude Desktop**
5. **Teste:** `"Liste as ferramentas DJEN disponíveis"`

## 📞 Ajuda

- **Documentação:** Veja os arquivos .md neste diretório
- **API DJEN:** https://comunicaapi.pje.jus.br/swagger/
- **Contato CNJ:** sistemasnacionais@cnj.jus.br

---

**👉 COMECE AQUI:** [COMECE_AQUI.md](COMECE_AQUI.md)
