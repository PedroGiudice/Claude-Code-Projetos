# 🚀 Início Rápido - DJEN MCP Server

## Pré-requisitos

- ✅ Node.js instalado (v18+ ou v20+)
- ✅ Credenciais da API DJEN (CNJ)
- ✅ ~1GB espaço em disco
- ⚠️ **Windows:** Build Tools (veja abaixo)

### ⚙️ Instalar Build Tools (Apenas Windows - PRIMEIRO PASSO!)

O projeto usa `better-sqlite3` que requer compilação nativa.

**Opção Rápida - Script Automático:**
```powershell
# Execute como Administrador
.\install-build-tools.ps1
```

**Opção Manual:**
1. Baixe [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. Instale com "Desktop development with C++" + Windows SDK

**Já tem Visual Studio?** Pule esta etapa!

## Instalação em 5 Minutos

### 1️⃣ Instalar Dependências
```bash
cd djen-mcp-server
npm install
```

**Se der erro:** Execute o script de build tools acima e tente novamente.

### 2️⃣ Configurar Credenciais
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
# (use Notepad, VSCode, ou qualquer editor)
notepad .env
```

**Importante:** Substitua `seu_usuario_aqui` e `sua_senha_aqui` com suas credenciais reais!

### 3️⃣ Compilar Projeto
```bash
npm run build
```

### 4️⃣ Configurar no Claude Desktop

**Windows:**
1. Abra: `%APPDATA%\Claude\claude_desktop_config.json`
2. Se não existir, crie o arquivo
3. Adicione (ajuste o caminho!):

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
        "DATABASE_PATH": "C:/Users/CMR Advogados/djen-mcp-server/data/djen.db"
      }
    }
  }
}
```

### 5️⃣ Reiniciar Claude Desktop

Feche completamente e abra novamente.

## ✅ Testar se Funcionou

Abra o chat do Claude Desktop e pergunte:

```
Você tem acesso às ferramentas do servidor DJEN?
Liste as ferramentas disponíveis.
```

O Claude deve responder listando as 10 ferramentas (buscar_publicacoes, etc.).

## 🎯 Primeira Busca

Teste com uma busca real:

```
Use a ferramenta buscar_publicacoes para buscar
10 publicações do TJSP de outubro de 2024
```

Se funcionar, você verá publicações em JSON!

## 📊 Ver Estatísticas

```
Use a ferramenta estatisticas para ver o estado atual do banco de dados
```

## 🧠 Habilitar Busca Semântica

Para usar RAG (busca inteligente):

```
Indexe as publicações que já estão no banco de dados.
Use a ferramenta indexar_publicacoes com limite de 50.
```

Depois:

```
Faça uma busca semântica sobre "danos morais em relações de consumo"
usando a ferramenta busca_semantica
```

## 🐛 Problemas?

### "Ferramenta não encontrada"
- Reiniciou o Claude Desktop?
- Caminho em `claude_desktop_config.json` está correto?
- Executou `npm run build`?

### "Erro de autenticação"
- Credenciais corretas no `.env` ou no config?
- API DJEN está acessível?

### "Modelo de embedding não encontrado"
- Primeira vez demora ~5min (download de 200MB)
- Verifique conexão com internet

## 📖 Próximos Passos

1. Leia `PROXIMOS_PASSOS.md` para guia completo
2. Consulte `CLAUDE.md` para arquitetura detalhada
3. Veja `README.md` para documentação completa

## 💾 Configuração para HD Externo (Recomendado!)

### Detecção Automática - Funciona em Casa e no Escritório

O sistema detecta automaticamente o HD "HD_PEDRO" (seja E: ou D:):

**No `.env`:**
```env
DATABASE_PATH=AUTO_DETECT_DRIVE/djen-data/djen.db
EXTERNAL_DRIVE_VOLUME=HD_PEDRO
```

**No `claude_desktop_config.json`:**
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
        "DATABASE_PATH": "AUTO_DETECT_DRIVE/djen-data/djen.db",
        "EXTERNAL_DRIVE_VOLUME": "HD_PEDRO"
      }
    }
  }
}
```

**Primeira vez:** Crie a pasta no HD externo:
```bash
# O sistema detecta automaticamente se é E: ou D:
mkdir E:\djen-data  # ou D:\djen-data no escritório
```

📖 **Ver guia completo:** `SETUP_MULTIPLAS_MAQUINAS.md`

### Configuração Manual (sem auto-detecção)

Se preferir fixar o drive:

```json
"DATABASE_PATH": "E:/djen-data/djen.db"
```

## 🎓 Casos de Uso

### Acompanhar Processo
```
Adicione o processo 0001234-56.2024.8.26.0100 ao monitoramento
com a descrição "Ação de indenização - Cliente XYZ"
```

### Buscar Jurisprudência
```
Gere contexto RAG sobre "responsabilidade civil médica"
limitado a 5 publicações do TJSP
```

### Download em Lote
```
Baixe publicações do STJ de 01/10/2024 a 31/10/2024
e salve no banco de dados
```

---

**Dúvidas?** Consulte a documentação completa ou o suporte CNJ.
