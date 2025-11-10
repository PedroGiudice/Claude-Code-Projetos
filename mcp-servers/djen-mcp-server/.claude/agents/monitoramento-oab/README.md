# Agente de Monitoramento OAB 129021/SP

Agente que roda continuamente, monitorando publicações do DJEN automaticamente.

## 📊 Informações Importantes

Baseado em análise real da API:
- **~25 publicações/dia** para a OAB 129021/SP
- **95% de cobertura** com top 14 tribunais
- **2 buscas/dia** (9h e 15h)
- **~2 minutos** por busca

## 🚀 Como Usar

### 1. Compilar o projeto

```bash
cd E:/projetos/djen-mcp-server
npm run build
```

### 2. Ativar o agente no Claude Code

Abra o Claude Code e execute:

```
Ativar agente "monitoramento-oab"
```

Ou diretamente no terminal:

```bash
npx tsx .claude/agents/monitoramento-oab/main.ts
```

### 3. Deixar rodando

O agente ficará rodando na tab, exibindo status em tempo real:

```
═══════════════════════════════════════════════════
🔔 AGENTE DE MONITORAMENTO OAB 129021/SP
═══════════════════════════════════════════════════

Status: ✅ ATIVO

Última busca: 29/10/2025 09:15:32
Próxima busca: 29/10/2025 15:00:00
Tempo restante: 5h 44m 28s

📊 Estatísticas:

   Total de publicações: 1.253
   Publicações hoje: 18
   Buscas realizadas: 3

═══════════════════════════════════════════════════

Pressione Ctrl+C para parar o agente
```

## 📁 Arquivos Gerados

### Banco SQLite
`E:/djen-data/oab-monitoring.db`

Armazena todas as publicações com deduplicação automática.

### Excel Diário
`E:/djen-data/DJEN-OAB129021-2025-10-29.xlsx`

Gerado automaticamente a cada busca que encontra novas publicações.

## ⚙️ Configuração

### Tribunais Prioritários

Definidos em `CONFIG.tribunais`:
- TRT3, TJMG, TJSP, TRT2, TJRJ, TJPR, TRF3, TRF4, TST, TJMA, TRF1, TRT8, TRT5, TRT15

### Horários de Busca

Definidos em `CONFIG.horariosBusca`:
- **09:00** - Busca matinal (publicações da noite)
- **15:00** - Busca vespertina (publicações da manhã/tarde)

### Personalizar

Edite `E:/projetos/djen-mcp-server/.claude/agents/monitoramento-oab/main.ts`:

```typescript
const CONFIG = {
  oab: { numero: '129021', uf: 'SP' },
  tribunais: ['TRT3', 'TJMG', ...], // Adicionar/remover
  horariosBusca: ['09:00', '15:00'], // Modificar horários
  // ...
};
```

## 🔄 Fluxo de Execução

1. **Ao iniciar:**
   - Busca imediata em todos os tribunais prioritários
   - Salva publicações no banco
   - Agenda próxima busca

2. **Durante execução:**
   - Verifica a cada 1 minuto se chegou o horário
   - Quando atingir horário agendado: executa busca
   - Filtra apenas publicações do dia atual
   - Deduplicação automática por hash
   - Gera Excel se houver novidades

3. **Ao encontrar novas publicações:**
   - Adiciona ao banco SQLite
   - Atualiza estatísticas
   - Gera/atualiza Excel do dia

## 📊 Banco de Dados

### Tabela: `publicacoes`
Armazena todas as publicações coletadas.

### Tabela: `processos_por_cliente` (futuro)
Para classificar processos por cliente manualmente.

### Tabela: `historico_buscas`
Log de todas as execuções.

## 🎯 Próximos Passos (Fase 2)

1. **Classificação por cliente**
   - Interface CLI para associar processos
   - Excel separado por cliente

2. **Cálculo de prazos**
   - Identificar tipos de publicação
   - Calcular vencimento conforme CPC
   - Alertas de prazo urgente

3. **Notificações**
   - E-mail diário
   - WhatsApp para urgências

## ❓ Troubleshooting

### "Erro ao conectar no banco"
```bash
# Criar diretório manualmente
mkdir E:/djen-data
```

### "API retornando erro 429"
O agente já trata isso automaticamente, aguardando 60s antes de retry.

### "Excel não sendo gerado"
Verifique se o diretório `E:/djen-data` existe e tem permissão de escrita.

## 📝 Logs

O agente exibe logs em tempo real no console. Para salvar:

```bash
npx tsx .claude/agents/monitoramento-oab/main.ts > log.txt 2>&1
```

## 🛑 Parar o Agente

Pressione `Ctrl+C` no terminal onde está rodando.
