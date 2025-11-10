---
description: Organiza processos de um cliente em planilha Excel com atualização incremental
---

# Organizador de Processos por Cliente

Agrupa processos judiciais por cliente e exporta para Excel com **atualização incremental inteligente**.

**Args:** {{ARGS}}

## Formatos de Uso

### Formato 1: Cliente + Arquivos JSON Específicos
```
/organizar-cliente SALESFORCE arquivo:E:/djen-data/salesforce-*.json
```

### Formato 2: Cliente (busca automática de JSONs)
```
/organizar-cliente "RAIA DROGASIL"
```
Sistema busca automaticamente em `E:/djen-data/` por arquivos relacionados.

### Formato 3: Atualizar Planilha Existente
```
/organizar-cliente NOVARTIS --atualizar
```
Detecta novos andamentos e atualiza apenas processos modificados.

### Formato 4: Criar do Zero (força recriação)
```
/organizar-cliente ONNI --recriar
```
Ignora planilha existente e cria nova.

## Clientes Conhecidos

O sistema reconhece automaticamente variações de nomes:

- **RAIA DROGASIL**: raia, drogasil, rd saude
- **SALESFORCE**: salesforce, salesforce.com, salesforce inc
- **NOVARTIS**: novartis
- **SANDOZ**: sandoz
- **ONNI**: onni

## O que o Comando Faz

### 1. Busca e Agregação
- Localiza todos os JSONs do cliente em `E:/djen-data/`
- Agrupa processos (deduplica por número CNJ)
- Mescla andamentos de múltiplas fontes

### 2. Detecção Incremental
- Compara com planilha existente (se houver)
- Identifica **apenas novos andamentos**
- Preserva dados e formatação existentes

### 3. Geração de Excel

**Estrutura da Planilha:**

#### Aba "Índice"
Visão geral de todos os processos do cliente.

| Processo | Tribunal | Classe | Último Andamento | Data | Status | Obs |
|----------|----------|--------|------------------|------|--------|-----|
| 1057607-11... | TJSP | Apelação | Acórdão publicado | 15/01/2025 | 🟢 | - |

#### Aba por Cliente (ex: "SALESFORCE")
- Resumo do cliente (total, ativos, encerrados)
- Tabela completa de processos
- Histórico detalhado de andamentos

#### Aba "Metadados"
Registro de todas as atualizações:
```
26/10/2025 14:30: Atualização incremental
  • 3 novos andamentos detectados
  • Processos atualizados: 1057607-11.2024..., 1043667-76.2024...
```

### 4. Marcação de Novidades
Andamentos novos recebem:
- 🆕 Marcador visual
- Fundo amarelo claro
- Data de detecção

## Exemplos de Saída

### Primeira Execução (Criação)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PLANILHA CRIADA - SALESFORCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗂️ Arquivo: E:/djen-data/excel/SALESFORCE-processos.xlsx

📈 Estatísticas:
   • Total de processos: 12
   • Processos ativos: 8
   • Processos encerrados: 4
   • Total de andamentos: 48

📁 Fontes de dados (3 arquivos JSON):
   • salesforce-processos-2025-10-20.json
   • processo-1057607-11.2024.json
   • juris-responsabilidade-salesforce.json

✅ Planilha criada com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Execução Subsequente (Atualização Incremental)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 ATUALIZAÇÃO INCREMENTAL - SALESFORCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗂️ Planilha: E:/djen-data/excel/SALESFORCE-processos.xlsx

📊 Análise de mudanças:
   • Processos verificados: 12
   • Processos com novos andamentos: 2
   • Processos sem mudança: 10

🆕 Novos Andamentos (3):

   [1] Processo 1057607-11.2024.8.26.0002
       📅 15/01/2025 10:30 - Acórdão
       📄 Publicado acórdão no DJEN

   [2] Processo 1043667-76.2024.8.26.0100
       📅 20/01/2025 14:15 - Sentença
       ⚖️ Sentença de procedência proferida

       📅 21/01/2025 09:00 - Intimação
       📬 Partes intimadas para manifestação

⏱️ Tempo de processamento: 3.2s
📅 Última atualização: 26/10/2025 14:35

✅ Planilha atualizada com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Nenhuma Mudança Detectada
```
✅ Planilha já está atualizada!

🗂️ Cliente: SALESFORCE
📁 Planilha: E:/djen-data/excel/SALESFORCE-processos.xlsx

📊 Verificação:
   • 12 processos verificados
   • 0 novos andamentos detectados
   • Última atualização: 26/10/2025 14:35

💡 Não há mudanças para aplicar.
```

## Implementação

**DELEGUE ao agente `process-excel-organizer`:**

```
Task tool com agente process-excel-organizer:
"Organizar processos do cliente {{ARGS}} em planilha Excel"
```

O agente fará automaticamente:
1. Buscar arquivos JSON relevantes
2. Detectar se é criação ou atualização
3. Comparar andamentos (se atualização)
4. Gerar/atualizar Excel com ExcelJS
5. Marcar novos andamentos visualmente
6. Gerar relatório de mudanças

## Parâmetros Opcionais

### `--modo`
- `auto` (padrão): Detecta automaticamente
- `criar`: Força criação (ignora planilha existente)
- `atualizar`: Força atualização (erro se não existir)

### `--somente-ativos`
Exporta apenas processos com status ativo (exclui encerrados/arquivados).

### `--periodo`
Filtra processos por período de ajuizamento:
```
/organizar-cliente SALESFORCE --periodo 2024-01-01:2024-12-31
```

### `--formato`
- `detalhado` (padrão): Inclui histórico completo
- `resumido`: Apenas tabela de processos (sem histórico)

## Notas Importantes

⚠️ **Backup automático**: Antes de cada atualização, o sistema cria cópia `.bak` da planilha existente

⚠️ **Não editar durante atualização**: Feche o Excel antes de executar o comando

⚠️ **Deduplicação automática**: Se múltiplos JSONs contêm o mesmo processo, andamentos são mesclados (sem duplicatas)

⚠️ **Grande volume**: Processar 100+ processos pode levar alguns minutos

## Limitações

- Não detecta mudanças em dados retroativos (apenas novos andamentos após última execução)
- Processos removidos do JSON não são excluídos da planilha (apenas não atualizados)
- Formatação manual na planilha pode ser sobrescrita em atualizações

## Próximos Passos Após Execução

1. Abrir planilha no Excel: `E:/djen-data/excel/[CLIENTE]-processos.xlsx`
2. Verificar andamentos marcados com 🆕
3. Aplicar filtros conforme necessidade
4. Exportar para outros formatos (PDF, CSV) se necessário
