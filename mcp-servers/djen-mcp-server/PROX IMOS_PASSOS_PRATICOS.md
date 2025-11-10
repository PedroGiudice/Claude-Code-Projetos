# 🚀 Próximos Passos Práticos

## ✅ O Que Já Está Pronto

1. ✅ **API DJEN corretamente implementada** (pública, sem credenciais)
2. ✅ **Projeto copiado para HD externo** (E:/projetos/djen-mcp-server)
3. ✅ **Sistema de detecção automática de drives** configurado
4. ✅ **Pasta de dados criada** (E:/djen-data)
5. ✅ **Tipos TypeScript** alinhados com API real

## 🔧 O Que Você Precisa Fazer Agora

### 1️⃣ Instalar Build Tools (CRÍTICO!)

O `npm install` vai falhar sem as Build Tools.

```powershell
# Abra PowerShell como Administrador
cd "E:\projetos\djen-mcp-server"
.\install-build-tools.ps1
```

**Após instalação:**
- Reinicie o terminal/VSCode
- Se necessário, reinicie o computador

### 2️⃣ Instalar Dependências

```bash
cd "E:\projetos\djen-mcp-server"
npm install
```

Se der erro, volte ao passo 1.

### 3️⃣ Compilar o Projeto

```bash
npm run build
```

Isso vai criar a pasta `dist/` com o código compilado.

### 4️⃣ Testar a API Diretamente (Opcional mas Recomendado)

Antes de integrar com Claude, teste se a API funciona:

```bash
# Listar tribunais
curl "https://comunicaapi.pje.jus.br/api/v1/comunicacao/tribunal" | head -50

# Buscar 2 comunicações do TJSP
curl "https://comunicaapi.pje.jus.br/api/v1/comunicacao?tribunal=TJSP&dataInicio=2024-10-23&dataFim=2024-10-23&limit=2"
```

### 5️⃣ Configurar Claude Desktop

Edite: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "djen": {
      "command": "node",
      "args": ["E:/projetos/djen-mcp-server/dist/index.js"],
      "env": {
        "DJEN_API_URL": "https://comunicaapi.pje.jus.br",
        "DATABASE_PATH": "AUTO_DETECT_DRIVE/djen-data/djen.db",
        "EXTERNAL_DRIVE_VOLUME": "HD_PEDRO",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 6️⃣ Reiniciar Claude Desktop

Feche COMPLETAMENTE e reabra.

### 7️⃣ Testar no Claude

```
Liste as ferramentas do servidor DJEN disponíveis
```

Deveria listar as ferramentas.

```
Use a ferramenta listar_tribunais para listar todos os tribunais
```

Deveria retornar a lista de tribunais.

```
Busque 5 comunicações do TJSP de hoje
```

Deveria buscar e retornar comunicações.

## 🐛 Problemas Comuns

### "npm install" falha com better-sqlite3

**Solução:** Instale Build Tools (passo 1)

### Claude não vê as ferramentas

**Verificar:**
1. Caminho no config está correto? (`E:/projetos/...`)
2. Build foi feito? (existe `dist/index.js`?)
3. Claude foi reiniciado completamente?

### "Drive HD_PEDRO não encontrado"

**Verificar:**
```bash
wmic logicaldisk get caption,volumename
```

Confirme que o HD aparece com nome "HD_PEDRO".

### Erro ao criar banco de dados

**Verificar:**
```bash
ls E:/djen-data
```

A pasta deve existir e ter permissões de escrita.

## 📝 Próximas Funcionalidades a Implementar

### Fase 1 - Testar API Real
- [ ] Testar todos os endpoints
- [ ] Ajustar schemas conforme respostas reais
- [ ] Validar rate limiting

### Fase 2 - Ajustar Tools do MCP
- [ ] Atualizar ferramentas para usar novos tipos
- [ ] Adicionar ferramenta `baixar_caderno_pdf`
- [ ] Adicionar ferramenta `buscar_certidao`
- [ ] Testar integração completa

### Fase 3 - Melhorar Armazenamento
- [ ] Ajustar schema do banco para estrutura real
- [ ] Adicionar campos de destinatários e advogados
- [ ] Implementar busca por advogado/OAB

### Fase 4 - Features Avançadas
- [ ] Download automático de PDFs dos cadernos
- [ ] Extração de texto dos PDFs
- [ ] Análise jurimetríca
- [ ] Dashboard web

## 📖 Documentos Importantes

1. **IMPORTANTE_API_PUBLICA.md** - Entenda que a API é pública
2. **SETUP_MULTIPLAS_MAQUINAS.md** - Como trabalhar em casa e escritório
3. **CLAUDE.md** - Arquitetura completa
4. **README.md** - Documentação geral

## 🎯 Objetivo Final

Ter um sistema funcionando que:

1. **Baixa publicações** do DJEN diariamente/semanalmente
2. **Armazena localmente** com metadados completos
3. **Indexa com RAG** para busca semântica
4. **Permite análise** via Claude Desktop
5. **Extrai jurisprudência** relevante automaticamente
6. **Gera relatórios** de acompanhamento processual

## 💡 Dicas

- Comece pequeno: teste com 1 dia de publicações de 1 tribunal
- Use `LOG_LEVEL=debug` no `.env` para ver mais detalhes
- O primeiro download de embeddings demora (200MB)
- Faça backup do banco regularmente

## 📞 Ajuda

Se encontrar problemas:
1. Verifique os logs em `logs/`
2. Use `LOG_LEVEL=debug` para mais informações
3. Consulte API oficial: https://comunicaapi.pje.jus.br/swagger/
4. Contato CNJ: sistemasnacionais@cnj.jus.br

---

**Status Atual:** ✅ Código pronto, aguardando instalação de dependências!
