# 🚀 Instalação One-Click - DJEN MCP Server

## ⚡ Instalação Rápida via Claude Desktop

### Método 1: Instalação Automática (Recomendado)

1. **Baixe o projeto para o HD externo**
   - Já está em: `E:\projetos\djen-mcp-server`

2. **Instale Build Tools (APENAS NO WINDOWS - UMA VEZ)**
   ```powershell
   # Como Administrador
   cd "E:\projetos\djen-mcp-server"
   .\install-build-tools.ps1
   ```
   **Importante:** Reinicie o terminal/VSCode após instalação

3. **Instale dependências**
   ```bash
   cd "E:\projetos\djen-mcp-server"
   npm install
   ```

4. **Compile o projeto**
   ```bash
   npm run build
   ```

5. **Configure no Claude Desktop**

   Abra: `%APPDATA%\Claude\claude_desktop_config.json`

   Adicione:
   ```json
   {
     "mcpServers": {
       "djen": {
         "command": "node",
         "args": ["E:/projetos/djen-mcp-server/dist/index.js"],
         "env": {
           "DJEN_API_URL": "https://comunicaapi.pje.jus.br",
           "DATABASE_PATH": "AUTO_DETECT_DRIVE/djen-data/djen.db",
           "EXTERNAL_DRIVE_VOLUME": "HD_PEDRO"
         }
       }
     }
   }
   ```

6. **Reinicie Claude Desktop** (feche completamente e reabra)

7. **Teste**
   ```
   Liste as ferramentas DJEN disponíveis
   ```

## ✅ Verificar se Está Funcionando

### Teste 1: API está acessível?
```bash
cd "E:\projetos\djen-mcp-server"
node test-api.cjs
```

Deve mostrar:
```
✅ Todos os testes concluídos com sucesso!
📝 A API DJEN está funcionando perfeitamente.
```

### Teste 2: Claude vê as ferramentas?

No Claude Desktop:
```
Liste as ferramentas do servidor DJEN
```

Deve listar 10 ferramentas:
- listar_tribunais
- buscar_comunicacoes
- buscar_por_processos
- buscar_certidao
- buscar_caderno_metadata
- download_lote
- busca_semantica
- indexar_publicacoes
- estatisticas
- historico_processo

### Teste 3: Buscar comunicações reais

```
Use a ferramenta listar_tribunais
```

Deve retornar lista de todos os tribunais brasileiros.

```
Busque 5 comunicações do TJSP de hoje
```

Deve retornar publicações reais do DJEN.

## 🎯 Uso Prático - Primeiros Comandos

### 1. Ver Tribunais Disponíveis
```
Liste todos os tribunais disponíveis usando a ferramenta listar_tribunais
```

### 2. Buscar Publicações de Hoje
```
Busque as últimas 10 comunicações do TJSP de hoje
```

### 3. Buscar por Processo Específico
```
Busque todas as publicações do processo 0001234-56.2024.8.26.0100
```

### 4. Download em Lote (Construir Biblioteca)
```
Baixe todas as comunicações do STJ dos últimos 7 dias e salve no banco
```

### 5. Ver Estatísticas do Banco
```
Mostre as estatísticas da base de dados local
```

## 🏗️ Estrutura Instalada

```
E:\projetos\djen-mcp-server\    # Projeto
  ├── dist/                      # Código compilado
  ├── src/                       # Código fonte
  ├── test-api.cjs               # Script de teste
  ├── package.json
  └── ...

E:\djen-data\                    # Dados
  └── djen.db                    # Banco SQLite (criado automaticamente)
```

## 📝 Comandos Úteis

```bash
# Testar API
node test-api.cjs

# Recompilar após mudanças
npm run build

# Ver logs detalhados
# No .env, mude: LOG_LEVEL=debug

# Limpar e reinstalar
rm -rf node_modules dist
npm install
npm run build
```

## ⚠️ Troubleshooting

### "npm install" falha

**Problema:** `better-sqlite3` precisa compilação nativa

**Solução:**
```powershell
# Como Administrador
.\install-build-tools.ps1
# Reinicie terminal
npm install
```

### Claude não vê as ferramentas

**Verificar:**
1. Build foi feito? → `npm run build`
2. Caminho correto no config? → `E:/projetos/...`
3. Claude foi reiniciado? → Feche COMPLETAMENTE

### "Drive HD_PEDRO não encontrado"

**Verificar nome do volume:**
```bash
wmic logicaldisk get caption,volumename
```

Se nome diferente, ajuste no config:
```json
"EXTERNAL_DRIVE_VOLUME": "SEU_NOME_DO_HD"
```

### Banco de dados não criado

**Criar pasta manualmente:**
```bash
mkdir E:\djen-data
```

## 🎓 Próximos Passos

Após instalação bem-sucedida:

1. **Construa biblioteca jurisprudencial**
   ```
   Baixe publicações do TJSP dos últimos 30 dias
   ```

2. **Habilite busca semântica**
   ```
   Indexe as publicações que estão no banco (limite 100)
   ```

3. **Faça buscas inteligentes**
   ```
   Busque semanticamente sobre "danos morais por acidente de trânsito"
   ```

4. **Acompanhe processos**
   ```
   Adicione o processo X ao monitoramento
   ```

## 📞 Ajuda

- **Documentos:** Veja os arquivos .md no projeto
- **API DJEN:** https://comunicaapi.pje.jus.br/swagger/
- **Contato CNJ:** sistemasnacionais@cnj.jus.br

## ✨ Características Especiais

- ✅ **API Pública** - Sem necessidade de credenciais
- ✅ **Detecção automática de HD** - Funciona em casa (E:) e escritório (D:)
- ✅ **Busca semântica com RAG** - IA para encontrar jurisprudência
- ✅ **Download em lote** - Construa biblioteca completa
- ✅ **Banco local** - Dados armazenados e indexados
- ✅ **Rate limiting** - Respeita limites da API
- ✅ **Multi-tribunal** - Todos os tribunais brasileiros

---

**Status:** ✅ Sistema testado e funcionando!

**Última atualização:** 2025-10-25
