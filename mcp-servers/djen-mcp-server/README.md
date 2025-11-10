# DJEN MCP Server

Servidor MCP (Model Context Protocol) para integração com a API DJEN (Diário de Justiça Eletrônico Nacional) do CNJ. Desenvolvido para automatizar consultas jurídicas, construir bibliotecas jurisprudenciais e aplicar técnicas de RAG (Retrieval-Augmented Generation) para análise processual.

## 🎯 Funcionalidades

### Consulta e Download
- ✅ Busca de publicações com múltiplos filtros (data, tribunal, processo, tema)
- ✅ Download em lote com paginação automática
- ✅ Consulta de publicações por número de processo específico
- ✅ Histórico processual completo e formatado

### Armazenamento Inteligente
- ✅ Banco de dados SQLite otimizado com índices
- ✅ Armazenamento de embeddings para busca semântica
- ✅ Sistema de processos monitorados
- ✅ Histórico de downloads e estatísticas

### RAG e Busca Semântica
- ✅ Geração de embeddings multilíngue (português)
- ✅ Busca semântica por similaridade
- ✅ Geração automática de contexto para o Claude
- ✅ Indexação em lote de publicações

## 📋 Pré-requisitos

- Node.js 18+ ou 20+ (⚠️ Node 25 requer build tools adicionais)
- Credenciais de acesso à API DJEN (CNJ)
- ~1GB de espaço em disco (para cache de modelos)
- HD externo recomendado para armazenamento de longo prazo

### ⚠️ Requisitos de Compilação (Windows)

O pacote `better-sqlite3` requer compilação nativa. No Windows, você precisa:

**Opção A - Instalação Completa (Recomendado):**
1. Instale [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. Durante a instalação, marque:
   - ✅ "Desktop development with C++"
   - ✅ "Windows 10/11 SDK" (mais recente)

**Opção B - Instalação Rápida via Chocolatey:**
```bash
# Execute como Administrador
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive"
choco install windows-sdk-10-version-2004-all
```

**Opção C - Usar Node.js 18 ou 20 (Mais Simples):**
- Node 18/20 têm melhor suporte para builds nativos
- Recomendado se você não precisa de Node 25

**Verificar instalação:**
```bash
npm config get msvs_version  # Deve mostrar a versão do VS
```

## 🚀 Instalação

### 1. Clone/Navegue até o projeto
```bash
cd djen-mcp-server
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
DJEN_API_URL=https://comunicaapi.pje.jus.br
DJEN_USERNAME=seu_usuario
DJEN_PASSWORD=sua_senha
DATABASE_PATH=./data/djen.db
```

### 4. Build do projeto
```bash
npm run build
```

### 5. Configure no Claude Desktop

Edite o arquivo de configuração do Claude Desktop:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

Adicione:
```json
{
  "mcpServers": {
    "djen": {
      "command": "node",
      "args": ["C:/Users/CMR Advogados/djen-mcp-server/dist/index.js"],
      "env": {
        "DJEN_API_URL": "https://comunicaapi.pje.jus.br",
        "DJEN_USERNAME": "seu_usuario",
        "DJEN_PASSWORD": "sua_senha",
        "DATABASE_PATH": "E:/djen-data/djen.db"
      }
    }
  }
}
```

## 💻 Desenvolvimento

### Modo desenvolvimento (com hot reload)
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Testes
```bash
npm test
```

### Lint
```bash
npm run lint
```

## 🛠️ Ferramentas Disponíveis

O servidor expõe as seguintes ferramentas para o Claude:

### `buscar_publicacoes`
Busca publicações com filtros diversos (data, tribunal, processo, tema).
```json
{
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "dataInicio": "2024-01-01",
  "dataFim": "2024-12-31",
  "tribunal": "TJSP",
  "limite": 100
}
```

### `buscar_por_processo`
Busca todas as publicações de processos específicos.
```json
{
  "numerosProcesso": ["0001234-56.2024.8.26.0100", "0007890-12.2024.8.26.0100"],
  "limite": 1000
}
```

### `download_lote`
Download em lote com paginação automática.
```json
{
  "dataInicio": "2024-10-01",
  "dataFim": "2024-10-31",
  "tribunal": "TJSP",
  "salvarNoBanco": true
}
```

### `busca_semantica`
Busca semântica usando RAG.
```json
{
  "consulta": "decisões sobre danos morais em relações de consumo",
  "tribunal": "TJSP",
  "limite": 10
}
```

### `gerar_contexto_rag`
Gera contexto formatado para análise do Claude.
```json
{
  "consulta": "jurisprudência sobre indenização por danos morais",
  "limite": 5
}
```

### `indexar_publicacoes`
Gera embeddings para publicações não indexadas.
```json
{
  "limite": 100
}
```

### `adicionar_processo_monitorado`
Adiciona processo ao monitoramento.
```json
{
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "descricao": "Ação de indenização - Cliente XYZ"
}
```

### `listar_processos_monitorados`
Lista processos monitorados.

### `estatisticas`
Estatísticas da base de dados.

### `historico_processo`
Gera histórico processual formatado.
```json
{
  "numeroProcesso": "0001234-56.2024.8.26.0100"
}
```

## 📁 Estrutura do Projeto

```
djen-mcp-server/
├── src/
│   ├── api/              # Cliente da API DJEN
│   │   └── client.ts
│   ├── database/         # Gerenciamento SQLite
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── mcp/              # Servidor MCP
│   │   ├── server.ts
│   │   └── tools.ts
│   ├── rag/              # Sistema RAG e embeddings
│   │   ├── index.ts
│   │   └── embeddings.ts
│   ├── types/            # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/            # Utilitários
│   │   ├── config.ts
│   │   └── logger.ts
│   └── index.ts          # Ponto de entrada
├── data/                 # Banco de dados SQLite
├── embeddings-cache/     # Cache de modelos
├── logs/                 # Logs da aplicação
├── package.json
├── tsconfig.json
└── .env
```

## 🔧 Configurações Avançadas

### Rate Limiting
```env
MAX_REQUESTS_PER_MINUTE=60
MAX_CONCURRENT_REQUESTS=5
```

### Embeddings
```env
EMBEDDINGS_MODEL=Xenova/multilingual-e5-small
SIMILARITY_THRESHOLD=0.7
```

### Logs
```env
LOG_LEVEL=info  # debug | info | warn | error
```

## 📖 Casos de Uso

### 1. Construir Biblioteca Jurisprudencial
```
1. Download semanal/diário com download_lote
2. Indexação automática com indexar_publicacoes
3. Busca semântica para fundamentação de peças
```

### 2. Acompanhamento Processual
```
1. Adicionar processos com adicionar_processo_monitorado
2. Consulta regular com buscar_por_processo
3. Geração de histórico com historico_processo
```

### 3. Pesquisa Temática
```
1. Busca semântica por tema específico
2. Geração de contexto para análise
3. Fundamentação de teses jurídicas
```

## 🐛 Troubleshooting

### Erro de autenticação
- Verifique credenciais no `.env`
- Confirme acesso à API DJEN

### Embeddings não funcionam
- Primeira execução baixa o modelo (~200MB)
- Verifique espaço em disco
- Cheque conexão com internet

### Banco de dados corrompido
```bash
# Backup e recriação
cp data/djen.db data/djen.db.backup
rm data/djen.db
# Servidor recria automaticamente no próximo início
```

## 🔔 Agente de Monitoramento OAB

O projeto inclui um agente contínuo para monitoramento de publicações DJEN específicas de OABs.

**Localização:** `../agents/monitoramento-oab/main.ts`

**Como iniciar:**
```bash
cd djen-mcp-server
npx tsx ../agents/monitoramento-oab/main.ts
```

**Funcionamento:**
- ⏰ Realiza verificação a cada 5 minutos
- 📅 Executa busca completa diariamente às 18:30
- 📄 Gera relatório automático: `Publicacoes-OAB-{numero}-{data}.txt`
- 📊 Mantém estatísticas de publicações encontradas

**⚠️ Observação:** O agente realiza buscas **manualmente agendadas** (verificações periódicas e busca programada), não é totalmente autônomo. As buscas dependem da execução contínua do processo.

### TODO - Próximos Ajustes
- [ ] **Separar relatórios por DATA DE PUBLICAÇÃO** (não por data de coleta/busca): Reorganizar o agente para agrupar as publicações pela `data_disponibilizacao` (quando foram efetivamente publicadas no DJEN), não pela data em que o agente realizou a busca. Isso melhora a organização do relatório e facilita o acompanhamento processual.

## 📝 Licença

MIT

## 🤝 Contribuições

Contribuições são bem-vindas! Este é um projeto voltado para advocacia e jurimetria.

## 📞 Suporte

Para questões sobre a API DJEN: sistemasnacionais@cnj.jus.br ou (61) 2326-5353
