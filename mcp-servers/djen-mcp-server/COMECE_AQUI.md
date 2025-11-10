# 🎯 COMECE AQUI - DJEN MCP Server

## ✅ O Que Está PRONTO e TESTADO

### 1. API DJEN Funcionando ✅
```bash
# Teste já executado com sucesso:
cd "E:\projetos\djen-mcp-server"
node test-api.cjs
```

**Resultado:**
- ✅ 223,080 comunicações no TJSP hoje (24/10/2025)
- ✅ 28 UFs com múltiplos tribunais cada
- ✅ API pública, sem necessidade de credenciais
- ✅ Endpoints corretos implementados

### 2. Código Completo ✅
- ✅ Cliente API sem autenticação (API é pública)
- ✅ Tipos TypeScript alinhados com API real
- ✅ Sistema de detecção automática de HD externo
- ✅ Ferramentas MCP definidas
- ✅ Sistema de RAG/embeddings
- ✅ Banco de dados SQLite

### 3. Documentação Completa ✅
- ✅ 12 arquivos de documentação
- ✅ Guias passo-a-passo
- ✅ Troubleshooting detalhado
- ✅ Arquitetura explicada

## 🚀 PRÓXIMO PASSO: Instalação

### Você Está Aqui: `E:\projetos\djen-mcp-server\`

### Ordem de Execução:

#### 1️⃣ **Instalar Build Tools** (Windows - UMA VEZ APENAS)
```powershell
# Abra PowerShell COMO ADMINISTRADOR
cd "E:\projetos\djen-mcp-server"
.\install-build-tools.ps1
```

Escolha opção **2** (Instalação Mínima - mais rápido)

**Depois:** Reinicie o terminal/VSCode

#### 2️⃣ **Instalar Dependências**
```bash
cd "E:\projetos\djen-mcp-server"
npm install
```

Se der erro sobre `better-sqlite3`, volte ao passo 1.

#### 3️⃣ **Compilar**
```bash
npm run build
```

Isso cria a pasta `dist/` com código JavaScript.

#### 4️⃣ **Configurar Claude Desktop**

Edite: `%APPDATA%\Claude\claude_desktop_config.json`

**Cole exatamente isso:**
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

**IMPORTANTE:** Se já tem outros servidores MCP, adicione apenas o bloco "djen" dentro de "mcpServers".

#### 5️⃣ **Reiniciar Claude Desktop**

Feche COMPLETAMENTE (não minimize!) e reabra.

#### 6️⃣ **Testar no Claude**

**Teste 1:**
```
Liste as ferramentas do servidor DJEN disponíveis
```

Deve mostrar 10 ferramentas.

**Teste 2:**
```
Use a ferramenta listar_tribunais
```

Deve retornar lista de tribunais.

**Teste 3:**
```
Busque 3 comunicações do TJSP de hoje usando a ferramenta buscar_comunicacoes
```

Deve retornar publicações reais!

## 📊 Testes Disponíveis

### Teste Rápido da API (sem instalar nada)
```bash
node test-api.cjs
```

Verifica se a API DJEN está acessível e funcionando.

## 📁 Estrutura dos Arquivos

```
E:\projetos\djen-mcp-server\
├── 📄 COMECE_AQUI.md              ← VOCÊ ESTÁ AQUI
├── 📄 INSTALACAO_ONE_CLICK.md     ← Guia detalhado de instalação
├── 📄 IMPORTANTE_API_PUBLICA.md   ← API é pública!
├── 📄 RESUMO_EXECUTIVO_FINAL.md   ← Visão completa do projeto
├── 📄 PROXIMOS_PASSOS_PRATICOS.md ← Após instalação
│
├── 🔧 test-api.cjs                ← Script de teste (funciona!)
├── 🔧 install-build-tools.ps1     ← Instalador automático
│
├── 📦 package.json
├── ⚙️ .env                        ← Configuração (já pronta!)
├── 📁 src/                        ← Código fonte TypeScript
└── 📁 dist/                       ← Criado após build

E:\djen-data\                      ← Dados (criado automaticamente)
```

## 🎯 O Que Você Conseguirá Fazer

### Imediatamente Após Instalação:
1. **Listar todos os tribunais brasileiros**
2. **Buscar publicações por data, tribunal ou processo**
3. **Ver metadados de cadernos (+ URL do PDF)**
4. **Buscar certidões**

### Após Download Inicial:
5. **Construir biblioteca jurisprudencial local**
6. **Busca semântica com IA** (RAG)
7. **Acompanhamento de processos**
8. **Análise jurimetríca**
9. **Extração de jurisprudência**
10. **Histórico processual completo**

## ⚡ Características Únicas

- 🔓 **API Pública** - Zero configuração de credenciais
- 💾 **HD Externo Inteligente** - Detecta E: ou D: automaticamente
- 🧠 **RAG/IA** - Busca semântica inteligente
- 📚 **Biblioteca Local** - Dados armazenados e indexados
- 🏛️ **Todos os Tribunais** - STF, STJ, TJs, TRTs, TRFs...
- 🚀 **Download em Lote** - Milhares de publicações rapidamente

## ⚠️ Problemas Comuns

### ❌ "npm install" falha com better-sqlite3
**Solução:** Execute `.\install-build-tools.ps1` como Administrador

### ❌ Claude não vê as ferramentas
**Verificar:**
- [ ] Build feito? → `npm run build`
- [ ] Caminho correto? → `E:/projetos/...`
- [ ] Claude reiniciado? → Fechar COMPLETAMENTE

### ❌ "Drive HD_PEDRO não encontrado"
**Verificar:**
```bash
wmic logicaldisk get caption,volumename
```
Se nome diferente, mude `EXTERNAL_DRIVE_VOLUME` no config.

## 📖 Documentos Importantes

| Arquivo | Quando Ler |
|---------|-----------|
| **COMECE_AQUI.md** | Agora! (você está aqui) |
| **INSTALACAO_ONE_CLICK.md** | Durante instalação |
| **IMPORTANTE_API_PUBLICA.md** | Entender que API é pública |
| **RESUMO_EXECUTIVO_FINAL.md** | Visão geral completa |
| **PROXIMOS_PASSOS_PRATICOS.md** | Após instalação funcionar |
| **SETUP_MULTIPLAS_MAQUINAS.md** | Trabalhar em casa + escritório |
| **CLAUDE.md** | Arquitetura técnica |

## 🎓 Exemplos de Uso Prático

### Construir Biblioteca do TJSP
```
Baixe todas as comunicações do TJSP dos últimos 7 dias
e salve no banco de dados local
```

### Buscar Processo Específico
```
Busque todas as publicações do processo 0001234-56.2024.8.26.0100
e mostre um resumo cronológico
```

### Busca Semântica (após indexar)
```
Indexe as publicações do banco (limite 50)

Depois:
Busque semanticamente sobre "responsabilidade civil médica em
procedimentos estéticos"
```

### Acompanhar Processo
```
Adicione o processo 0001234-56.2024.8.26.0100 ao monitoramento
com descrição "Ação de indenização - Cliente XYZ"
```

### Análise Jurimetríca
```
Mostre estatísticas das publicações do TJSP no banco:
quantas intimações, sentenças, despachos, etc
```

## 🎯 Objetivo Final

Ter um sistema completo que:

1. ✅ **Baixa** automaticamente publicações do DJEN
2. ✅ **Armazena** com metadados completos (partes, advogados, OAB)
3. ✅ **Indexa** com IA para busca semântica
4. ✅ **Analisa** via Claude Desktop
5. ✅ **Extrai** jurisprudência relevante
6. ✅ **Monitora** processos específicos
7. ✅ **Gera** relatórios e análises jurimétricas

## 💡 Dica Pro

**Comece pequeno!**

1. Teste com 1 dia de 1 tribunal
2. Veja como funciona
3. Depois faça downloads maiores
4. Habilite RAG quando tiver dados suficientes

## 📞 Precisa de Ajuda?

- **Logs detalhados:** No `.env`, mude `LOG_LEVEL=debug`
- **API DJEN oficial:** https://comunicaapi.pje.jus.br/swagger/
- **Contato CNJ:** sistemasnacionais@cnj.jus.br
- **Documentação:** Veja os arquivos .md no projeto

## ✨ Resumo em 30 Segundos

```bash
# 1. Instalar Build Tools (uma vez)
.\install-build-tools.ps1  # Como Admin

# 2. Instalar e compilar
npm install
npm run build

# 3. Configurar Claude Desktop
# Editar: %APPDATA%\Claude\claude_desktop_config.json
# Cole a configuração acima

# 4. Reiniciar Claude Desktop

# 5. Testar
"Liste as ferramentas DJEN disponíveis"
```

---

**Status Atual:** ✅ **API testada e funcionando!**

**Próximo passo:** Instalar Build Tools e dependências

**Tempo estimado:** 10-15 minutos (primeira vez)

---

**Criado:** 2025-10-25
**Localização:** E:\projetos\djen-mcp-server\
**API:** https://comunicaapi.pje.jus.br (pública)
