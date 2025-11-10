# Busca Diária de Publicações por OAB

Busca automatizada diária de publicações do DJEN para análise de prazos processuais.

**Args:** {{ARGS}}

## Descrição

Este comando realiza busca completa de publicações da OAB 129021/SP no dia atual ou em data específica, salvando os resultados em formato estruturado para análise de prazos.

## Uso

```bash
# Buscar publicações de hoje
/busca-diaria-oab

# Buscar data específica
/busca-diaria-oab 2025-10-28

# Buscar com OAB diferente
/busca-diaria-oab 129021 SP 2025-10-28
```

## Funcionalidades

1. **Busca Completa**: Varre todos os 92 tribunais brasileiros
2. **Rate Limiting Inteligente**: Respeita limite de 20 req/min automaticamente
3. **Análise de Prazos**: Identifica publicações que geram prazos processuais
4. **Exportação**: Salva JSON e Excel para análise
5. **Histórico**: Mantém registro de todas as buscas realizadas

## Tipos de Publicação Monitorados

### Geram Prazos (Urgente ⚠️)
- **Intimação**: Prazo de 5-15 dias úteis (conforme tipo)
- **Sentença**: Prazo de apelação (15 dias úteis)
- **Acórdão**: Prazo de embargos (5 dias úteis)
- **Despacho**: Prazo conforme determinação

### Informativas (📋)
- **Lista de distribuição**: Sem prazo
- **Publicação de pauta**: Informativo
- **Certidão**: Registro processual

## Saída

### JSON Estruturado
```json
{
  "consulta": {
    "numeroOab": "129021",
    "ufOab": "SP",
    "data": "2025-10-28",
    "dataConsulta": "2025-10-29T10:00:00Z"
  },
  "estatisticas": {
    "totalPublicacoes": 3475,
    "totalProcessos": 2341,
    "publicacoesComPrazo": 1247,
    "tribunais": {
      "TRT3": 1035,
      "TJMG": 649,
      "TJSP": 432
    }
  },
  "processos": [
    {
      "numeroProcesso": "5033782-84.2025.4.04.0000",
      "tribunal": "TRF4",
      "classe": "Mandado de Segurança",
      "orgaoJulgador": "4ª Turma",
      "prazoUrgente": true,
      "publicacoes": [
        {
          "data": "2025-10-28",
          "tipo": "Intimação",
          "prazoEmDias": 15,
          "prazoFinalEm": "2025-11-18",
          "texto": "..."
        }
      ]
    }
  ]
}
```

### Excel (Planilha)
- **Aba "Prazos Urgentes"**: Publicações com prazo
- **Aba "Processos"**: Todos os processos
- **Aba "Estatísticas"**: Resumo geral
- **Formatação Condicional**: Prazos próximos em vermelho

## Implementação

Execute o script TypeScript:

```bash
npx tsx dist/scripts/busca-diaria-oab.js --oab 129021 --uf SP --data 2025-10-28
```

## Agendamento Automático

### Windows (Task Scheduler)
```powershell
# Executar diariamente às 8h
schtasks /create /tn "DJEN Busca Diária OAB" /tr "node E:/projetos/djen-mcp-server/dist/scripts/busca-diaria-oab.js" /sc daily /st 08:00
```

### Linux/Mac (Crontab)
```bash
# Executar diariamente às 8h
0 8 * * * cd /path/to/djen-mcp-server && node dist/scripts/busca-diaria-oab.js
```

## Notificações

O sistema pode enviar notificações por:
- **E-mail**: Resumo diário de publicações
- **WhatsApp**: Alertas de prazos urgentes (via API)
- **Telegram**: Notificações em tempo real

## Notas

- **Primeira execução**: Pode demorar ~5-6 minutos (92 tribunais)
- **Rate limiting**: 20 requisições/minuto (CNJ)
- **Limitação da API**: Alguns tribunais retornam no máximo 100 publicações
- **Armazenamento**: ~5-10 MB por dia de busca

## Próximos Passos

1. **Cálculo automático de prazos** conforme CPC
2. **Detecção de prazo em dobro** (Defensoria, Fazenda Pública)
3. **Integração com calendário** (Google Calendar, Outlook)
4. **Dashboard web** para visualização
