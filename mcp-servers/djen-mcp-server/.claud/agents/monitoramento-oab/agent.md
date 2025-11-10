# Agente de Monitoramento de Publicações OAB

**Tipo:** Daemon (execução contínua durante expediente)
**Função:** Monitorar publicações DJEN da OAB 129021/SP em tempo real

## Descrição

Agente especializado que roda continuamente durante o expediente, buscando automaticamente novas publicações do DJEN para a OAB 129021/SP, classificando por cliente e alertando sobre prazos urgentes.

## Funcionamento

### Ao Ativar
1. **Busca inicial completa** nos top 15 tribunais (~95% de cobertura)
2. **Cria/atualiza banco SQLite** com deduplicação por hash
3. **Classifica por cliente** (baseado em tabela auxiliar)
4. **Calcula prazos** conforme CPC
5. **Gera Excel** inicial do dia

### Durante Execução
- **A cada 3 horas:** Nova busca nos top 15 tribunais
- **Deduplicação automática:** Ignora publicações já coletadas
- **Atualização incremental:** Adiciona apenas novidades ao Excel
- **Alertas em tempo real:** Exibe notificações de prazos urgentes

### Modo de Operação
- **9h-18h:** Monitoramento ativo (3 buscas/dia)
- **Fora do horário:** Pausa automática
- **Finais de semana:** Opcional (configur
ável)

## Top 15 Tribunais Priorizados

Baseado em volume histórico de publicações:

1. **TRT3** (Minas Gerais) - 1.035/dia
2. **TJMG** (Minas Gerais) - 649/dia
3. **TJSP** (São Paulo) - 432/dia
4. **TRT2** (São Paulo) - 355/dia
5. **TJRJ** (Rio de Janeiro) - 166/dia
6. **TJPR** (Paraná) - 146/dia
7. **TRT18** (Goiás) - 134/dia
8. **TRF3** (SP/MS) - 123/dia
9. **TRF4** (Sul) - 57/dia
10. **TST** (Superior Trabalho) - 53/dia
11. **TJMA** (Maranhão) - 38/dia
12. **TRF1** (DF/GO/TO/MT/BA/...) - 38/dia
13. **TRT8** (Pará/Amapá) - 35/dia
14. **TRT5** (Bahia) - 33/dia
15. **TRT15** (Campinas) - 32/dia

**Cobertura:** ~3.318 de 3.475 publicações (95,5%)

## Comandos Interativos

Durante execução, você pode usar:

- `status` - Ver estatísticas atuais
- `buscar` - Forçar busca imediata
- `excel` - Regerar Excel
- `clientes` - Gerenciar classificação de clientes
- `pausar` - Pausar monitoramento
- `retomar` - Retomar monitoramento
- `sair` - Encerrar agente

## Arquivos Gerados

### Banco SQLite
**Local:** `E:/djen-data/oab-monitoring.db`

**Tabelas:**
- `publicacoes` - Todas as publicações (deduplicadas)
- `processos_por_cliente` - Classificação manual
- `prazos_calculados` - Prazos com vencimento
- `historico_buscas` - Log de execuções

### Excel Diário
**Local:** `E:/djen-data/DJEN-OAB129021-{DATA}.xlsx`

**Abas:**
1. **URGENTE** - Publicações com prazo ≤ 5 dias
2. **Prazos** - Todas com prazo calculado
3. **Por Cliente** - Agrupado por cliente
4. **Todas** - Lista completa
5. **Stats** - Estatísticas do dia

## Configuração

### Primeira Execução

1. **Associar processos a clientes:**
```typescript
// Arquivo: E:/djen-data/clientes-config.json
{
  "CLIENTE_A": {
    "nome": "Empresa XYZ Ltda",
    "processos": [
      "5033782-84.2025.4.04.0000",
      "0011074-79.2025.5.03.0062"
    ]
  },
  "CLIENTE_B": {
    "nome": "João da Silva",
    "processos": [
      "1057607-11.2024.8.26.0002"
    ]
  }
}
```

2. **Ajustar horários de busca:**
```typescript
// Arquivo: E:/djen-data/monitoramento-config.json
{
  "horarios": ["09:00", "13:00", "17:00"],
  "tribunais_customizados": [], // Vazio = usa top 15
  "finais_de_semana": false,
  "alertas_sonoros": true
}
```

## Limitações

- **API DJEN:** Máx. 100 publicações por tribunal/busca
- **Rate Limit:** 20 requisições/minuto
- **Cobertura:** ~95% (top 15 tribunais)

## Tecnologias

- **Runtime:** Node.js + TypeScript
- **Banco:** SQLite (WAL mode)
- **Excel:** ExcelJS
- **Agendamento:** node-cron

## Requisitos

- Node.js 18+
- ~100MB RAM
- ~50MB disco por mês
- Internet estável

## Uso

```bash
# Ativar agente no Claude Code
Ativar agente "monitoramento-oab"

# O agente ficará rodando na tab, mostrando:
# - Próxima busca em: 02:45:13
# - Total de publicações: 1.235
# - Novas desde última busca: 12
# - Prazos urgentes: 3
```
