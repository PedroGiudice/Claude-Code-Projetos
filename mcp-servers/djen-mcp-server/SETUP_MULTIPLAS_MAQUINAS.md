# Setup para Múltiplas Máquinas

Este guia explica como configurar o DJEN MCP Server para funcionar em diferentes computadores, detectando automaticamente o HD externo "HD_PEDRO".

## 🎯 Problema Resolvido

O HD externo "HD_PEDRO" pode ter letras de drive diferentes em cada máquina:
- **Casa:** E:
- **Escritório:** D:

O sistema agora detecta automaticamente o drive correto pelo nome do volume.

## 📋 Configuração Inicial (Fazer Uma Vez)

### 1. Preparar o HD Externo

Certifique-se de que o HD externo tenha o nome correto:
1. Conecte o HD externo
2. Abra o Windows Explorer
3. Clique com botão direito no HD → **Propriedades** → **Geral**
4. Confirme que o nome é **HD_PEDRO**

### 2. Criar a Estrutura de Pastas no HD

```bash
# No HD externo (E: ou D:), crie:
E:\djen-data\          # Pasta para dados do projeto
```

Você pode criar essa pasta manualmente ou o sistema criará automaticamente.

### 3. Clonar/Copiar o Projeto

**Opção A - Manter projeto no HD externo (RECOMENDADO):**
```bash
# Copie a pasta djen-mcp-server para o HD externo
# Vantagem: mesmos arquivos em todas as máquinas
E:\projetos\djen-mcp-server\
```

**Opção B - Projeto local, dados no HD externo:**
```bash
# Projeto em cada máquina
C:\Users\CMR Advogados\djen-mcp-server\
# Dados centralizados
E:\djen-data\
```

### 4. Configurar o .env

```bash
# Na pasta do projeto
cd djen-mcp-server
cp .env.example .env
```

Edite o `.env` e configure:

```env
# API DJEN (suas credenciais)
DJEN_API_URL=https://comunicaapi.pje.jus.br
DJEN_USERNAME=seu_usuario_real
DJEN_PASSWORD=sua_senha_real

# DETECÇÃO AUTOMÁTICA DO HD (deixe assim!)
DATABASE_PATH=AUTO_DETECT_DRIVE/djen-data/djen.db
EXTERNAL_DRIVE_VOLUME=HD_PEDRO
```

## 🚀 Uso em Diferentes Máquinas

### Primeira Vez em Cada Máquina

1. **Conecte o HD "HD_PEDRO"**

2. **Instale as dependências** (se ainda não instalou):
```bash
cd djen-mcp-server
npm install
```

3. **Build do projeto**:
```bash
npm run build
```

4. **Configure no Claude Desktop**

Edite: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "djen": {
      "command": "node",
      "args": ["CAMINHO_COMPLETO/djen-mcp-server/dist/index.js"],
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

**IMPORTANTE:** Substitua `CAMINHO_COMPLETO` pelo caminho real:
- Se projeto no HD: `E:/projetos/djen-mcp-server/dist/index.js` (será ajustado automaticamente)
- Se projeto local: `C:/Users/CMR Advogados/djen-mcp-server/dist/index.js`

### Ao Trocar de Máquina

1. **Conecte o HD "HD_PEDRO"**
2. **Abra o Claude Desktop** - pronto! O sistema detecta automaticamente se o HD está em E: ou D:

## 🔍 Como Funciona a Detecção

O sistema executa estas etapas automaticamente:

1. **Lê a configuração** `DATABASE_PATH=AUTO_DETECT_DRIVE/djen-data/djen.db`
2. **Detecta o placeholder** `AUTO_DETECT_DRIVE`
3. **Procura o volume** `HD_PEDRO` em todos os drives
4. **Substitui automaticamente:**
   - Casa (E:): `E:/djen-data/djen.db`
   - Escritório (D:): `D:/djen-data/djen.db`

### Logs de Detecção

O sistema gera logs mostrando o que aconteceu:

```
[INFO] Drive HD_PEDRO detectado em E:
[INFO] Caminho do banco resolvido: E:/djen-data/djen.db
```

## ⚠️ Troubleshooting

### "Drive HD_PEDRO não encontrado"

**Causa:** HD externo não conectado ou nome diferente

**Solução:**
1. Verifique se o HD está conectado
2. Confirme o nome do volume no Windows Explorer
3. Se o nome for diferente, atualize `EXTERNAL_DRIVE_VOLUME` no `.env`

### "Banco de dados não encontrado"

**Causa:** Pasta não existe no HD

**Solução:**
```bash
# Crie manualmente a pasta no HD (ajuste a letra do drive)
mkdir E:\djen-data
```

### Claude Desktop não encontra o servidor

**Causa:** Caminho do projeto incorreto no `claude_desktop_config.json`

**Solução:**
1. Verifique o caminho completo do projeto
2. Use barras `/` ao invés de `\` no JSON
3. Certifique-se de que o build foi feito (`npm run build`)

## 📁 Estrutura Recomendada

```
HD_PEDRO (E: ou D:)
├── djen-data/
│   ├── djen.db              # Banco de dados (gerado automaticamente)
│   ├── djen.db-wal          # Write-Ahead Log
│   └── djen.db-shm          # Shared Memory
├── projetos/
│   └── djen-mcp-server/     # (Opcional) Projeto no HD
└── .djen-mcp-marker         # Marcador do sistema (auto-criado)
```

## 💡 Dicas

### Sincronização

Se mantiver o projeto no HD externo:
- ✅ Mesmos arquivos em todas as máquinas
- ✅ Não precisa sincronizar código
- ✅ Apenas faça `npm install` uma vez

### Backup

O banco de dados está no HD externo, faça backup regularmente:
```bash
# Copie o arquivo .db
copy E:\djen-data\djen.db E:\backup\djen-backup-2024-10-25.db
```

### Git

Se usar controle de versão:
```bash
# .env está no .gitignore - cada máquina tem sua cópia
# Mas as configurações devem ser idênticas (exceto caminhos específicos)
```

## 🔧 Configurações Avançadas

### Usar Drive Específico (Desabilitar Auto-Detecção)

Se preferir fixar o drive:

```env
# Em casa
DATABASE_PATH=E:/djen-data/djen.db

# No escritório
DATABASE_PATH=D:/djen-data/djen.db
```

### Outro Nome de Volume

Se o HD tiver nome diferente:

```env
EXTERNAL_DRIVE_VOLUME=MEU_HD_BACKUP
DATABASE_PATH=AUTO_DETECT_DRIVE/djen-data/djen.db
```

### Modo Híbrido

Projeto local, mas com fallback:

```env
# Se o HD não for encontrado, usa pasta local
DATABASE_PATH=AUTO_DETECT_DRIVE/djen-data/djen.db
```

O sistema automaticamente usará `./data/djen.db` se o HD não estiver conectado.
