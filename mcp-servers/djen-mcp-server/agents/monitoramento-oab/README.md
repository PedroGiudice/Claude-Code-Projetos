# Agente de Monitoramento OAB 129021/SP

Monitora automaticamente publicações do DJEN, classificando por cliente e gerando relatórios Markdown.

## 🎯 Funcionalidades

- ✅ **Busca automática** 2x/dia (9h e 15h)
- ✅ **Classificação por cliente** (detecção automática no texto)
- ✅ **Relatórios Markdown** separados por cliente
- ✅ **Banco SQLite** com histórico completo
- ✅ **Deduplicação** automática por hash

## 📋 Clientes Configurados

- **NOVARTIS** (Novartis Biociências)
- **SALESFORCE**
- **RAIA DROGASIL**
- **GLENMARK** (Glenmark Farmacêutica)
- **SANDOZ**
- **DESCONHECIDO** (para processos não identificados)

## 🚀 Como Usar

### Iniciar o Agente

```bash
cd E:/projetos/djen-mcp-server
npx tsx E:/projetos/agents/monitoramento-oab/main.ts
```

O agente ficará rodando e exibirá status em tempo real.

## 📁 Arquivos Gerados

### Por Cliente
- `E:/djen-data/2025-10-29_NOVARTIS.md`
- `E:/djen-data/2025-10-29_SALESFORCE.md`
- `E:/djen-data/2025-10-29_DESCONHECIDO.md`

### Consolidado
- `E:/djen-data/2025-10-29_CONSOLIDADO.md`

## ⚙️ Adicionar Novo Cliente

Edite `E:/djen-data/clientes.json`:

```json
{
  "clientes": [
    {
      "id": "NOVO_CLIENTE",
      "nome": "Nome do Cliente",
      "variantes": [
        "NOME EXATO",
        "RAZAO SOCIAL"
      ]
    }
  ]
}
```

## 📊 Banco de Dados

**Local:** `E:/djen-data/oab-monitoring.db`

Armazena histórico completo de publicações.
