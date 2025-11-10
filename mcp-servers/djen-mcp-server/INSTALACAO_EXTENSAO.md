# 🎯 Instalação da Extensão DJEN MCP

## ✅ Arquivo Criado com Sucesso!

**Arquivo:** `djen-mcp-server.mcpb` (90MB)
**Localização:** `E:\projetos\djen-mcp-server\`

Este arquivo é uma **extensão completa** pronta para instalar no Claude Desktop com apenas **um clique**!

---

## 📦 O que está incluído no .mcpb?

O pacote `.mcpb` contém:

- ✅ Todo o código compilado (`dist/`)
- ✅ Todas as dependências (`node_modules/`)
- ✅ Configuração completa (manifest.json)
- ✅ Zero necessidade de npm install ou build

---

## 🚀 Como Instalar no Claude Desktop

### Opção 1: Instalação via Duplo Clique (Mais Fácil)

1. **Localize o arquivo:**
   ```
   E:\projetos\djen-mcp-server\djen-mcp-server.mcpb
   ```

2. **Dê duplo clique** no arquivo `.mcpb`

3. **O Claude Desktop deve abrir automaticamente** e perguntar se você deseja instalar a extensão

4. **Clique em "Instalar"**

5. **Pronto!** A extensão está instalada e funcionando

---

### Opção 2: Instalação Manual via Claude Desktop

1. **Abra o Claude Desktop**

2. **Vá em: Configurações → Extensions** (ou equivalente no menu)

3. **Clique em "Install Extension" ou "Adicionar Extensão"**

4. **Navegue até:**
   ```
   E:\projetos\djen-mcp-server\djen-mcp-server.mcpb
   ```

5. **Selecione o arquivo e clique em "Abrir"**

6. **Confirme a instalação**

---

## 🧪 Como Testar a Extensão

Após instalar, teste se está funcionando:

### Teste 1: Listar Ferramentas

No Claude Desktop, pergunte:

```
Liste as ferramentas do servidor DJEN disponíveis
```

**Resposta esperada:** Lista de 10 ferramentas MCP

### Teste 2: Listar Tribunais

```
Use a ferramenta listar_tribunais do DJEN
```

**Resposta esperada:** Lista de todos os tribunais brasileiros (28 UFs)

### Teste 3: Buscar Comunicações

```
Busque 3 comunicações do TJSP de hoje usando o servidor DJEN
```

**Resposta esperada:** Até 3 publicações reais do TJSP

---

## ⚙️ Configuração Personalizada

### Variáveis de Ambiente Configuráveis

Após instalar, você pode configurar:

1. **EXTERNAL_DRIVE_VOLUME** - Nome do seu HD externo
   Padrão: `HD_PEDRO`

2. **LOG_LEVEL** - Nível de detalhes dos logs
   Opções: `debug`, `info`, `warn`, `error`
   Padrão: `info`

**Como configurar:**
- No Claude Desktop, vá em Configurações → Extensions → DJEN
- Edite as variáveis conforme necessário

---

## 🔧 Localização dos Dados

A extensão criará automaticamente:

```
E:\djen-data\djen.db          <- Banco de dados SQLite
E:\djen-data\logs\            <- Logs do servidor
E:\djen-data\embeddings-cache\ <- Cache de IA
```

Se o HD `E:` não estiver disponível, o sistema tentará usar `D:` ou criará em `%LOCALAPPDATA%\DJEN`.

---

## 📊 Recursos Disponíveis

### 10 Ferramentas MCP:

1. **buscar_publicacoes** - Buscar comunicações por filtros
2. **buscar_por_processo** - Buscar por número de processo
3. **download_lote** - Baixar múltiplas publicações
4. **busca_semantica** - Busca inteligente com IA
5. **gerar_contexto_rag** - Gerar contexto para perguntas
6. **indexar_publicacoes** - Indexar com embeddings de IA
7. **adicionar_processo_monitorado** - Monitorar processos
8. **listar_processos_monitorados** - Ver processos monitorados
9. **estatisticas** - Estatísticas do banco de dados
10. **historico_processo** - Histórico completo de um processo

---

## 🎯 Exemplos de Uso

### Construir Biblioteca Local

```
Baixe todas as comunicações do TJSP dos últimos 7 dias
e salve no banco de dados local usando o servidor DJEN
```

### Busca Semântica (após indexar)

```
Primeiro, indexe 100 publicações do banco usando o servidor DJEN

Depois, busque semanticamente sobre "responsabilidade civil
em acidentes de trânsito"
```

### Monitorar Processo

```
Adicione o processo 1234567-89.2024.8.26.0100 ao
monitoramento com descrição "Ação XYZ - Cliente ABC"
```

---

## ❌ Solução de Problemas

### Extensão não aparece no Claude Desktop

**Verificar:**
- Claude Desktop está na versão mais recente?
- O arquivo `.mcpb` não está corrompido? (deve ter ~90MB)
- Tente reinstalar: desinstale e instale novamente

### "HD_PEDRO não encontrado"

**Solução:** Configure a variável `EXTERNAL_DRIVE_VOLUME` com o nome correto do seu HD externo

**Como verificar o nome:**
```bash
wmic logicaldisk get caption,volumename
```

### Ferramentas não respondem

**Verificar:**
- Internet está funcionando? (API DJEN é online)
- Logs do servidor em `E:\djen-data\logs\`
- Mude `LOG_LEVEL` para `debug` para mais detalhes

---

## 🔄 Atualizar a Extensão

Para atualizar para uma nova versão:

1. Desinstale a versão atual no Claude Desktop
2. Instale o novo arquivo `.mcpb`
3. Seus dados em `E:\djen-data\` serão preservados

---

## 📚 Documentação Completa

- **COMECE_AQUI.md** - Guia inicial completo
- **IMPORTANTE_API_PUBLICA.md** - Sobre a API DJEN
- **RESUMO_EXECUTIVO_FINAL.md** - Visão geral do projeto
- **PROXIMOS_PASSOS_PRATICOS.md** - Após instalação

---

## 🎉 Pronto para Usar!

Agora você tem um servidor MCP completo para:

- ✅ Buscar publicações do DJEN em todos os tribunais
- ✅ Construir biblioteca jurisprudencial local
- ✅ Fazer buscas semânticas com IA
- ✅ Monitorar processos específicos
- ✅ Análise jurimetríca e estatísticas
- ✅ Integração total com Claude Desktop

---

**Desenvolvido por:** CMR Advogados
**API:** https://comunicaapi.pje.jus.br (pública - CNJ)
**Versão:** 0.1.0
**Data de criação:** 2025-10-25
