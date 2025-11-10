# 🚀 QUICK START - DJEN MCP Server

## ⚡ OPÇÃO 1: Usar Node Integrado do Claude (RECOMENDADO)

**Já está configurado!** Apenas:

1. **Reinicie o Claude Desktop**
2. **Teste:** "Liste as ferramentas do servidor DJEN"
3. **Pronto!** ✅

O Claude Desktop usará automaticamente seu Node 22.19.0 integrado.

---

## ⚡ OPÇÃO 2: Trocar seu Node para v22.x

Se quiser testar fora do Claude Desktop:

### Windows (PowerShell como Administrador)

```powershell
cd E:\projetos\djen-mcp-server
.\trocar-node-v22.ps1
```

**Escolha:**
- **Opção 1:** Instalar NVM + Node 22 (melhor)
- **Opção 2:** Instalar Node 22 direto (MSI)
- **Opção 3:** Reinstalar dependências com Node atual

---

## 🧪 Testar Servidor Manualmente

Após instalar Node 22.x:

```bash
cd E:\projetos\djen-mcp-server
node dist/index.js
```

**Deve iniciar sem erros!** (ficará aguardando conexão MCP)

Pressione `Ctrl+C` para parar.

---

## 📋 Versões Compatíveis

- ✅ **Node 22.x** (Claude Desktop usa 22.19.0)
- ✅ **Node 20.x** (LTS)
- ✅ **Node 18.x** (LTS)
- ❌ **Node 25.x** (módulo sharp incompatível)

---

## 🔧 Arquivos Importantes

```
E:\projetos\djen-mcp-server\
├── trocar-node-v22.ps1           ← Script para trocar Node
├── QUICK_START.md                ← Este arquivo
├── CONFIGURACAO_FINAL.md         ← Guia completo
├── dist/index.js                 ← Servidor MCP compilado
└── ...

C:\Users\CMR Advogados\AppData\Roaming\Claude\
└── claude_desktop_config.json    ← Config do Claude Desktop
```

---

## ✅ Status Atual

- [x] Código compilado
- [x] API testada (223k comunicações TJSP)
- [x] Servidor MCP configurado
- [x] Node integrado habilitado no Claude
- [ ] **Claude Desktop reiniciado** ← FAZER!
- [ ] **Ferramentas testadas** ← TESTAR!

---

## 🎯 Teste Rápido (No Claude Desktop)

```
Quais servidores MCP estão ativos?
```

```
Liste as ferramentas do servidor DJEN
```

```
Busque 3 comunicações do TJSP de hoje
```

---

**💡 Dica:** Se preferir não trocar seu Node global, o Claude Desktop funcionará perfeitamente com seu Node integrado (22.19.0)!
