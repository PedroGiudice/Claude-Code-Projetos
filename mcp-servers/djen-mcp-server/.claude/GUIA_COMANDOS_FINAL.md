# 📚 Guia Completo de Comandos - DJEN MCP Server

**Status:** ✅ Pronto para Produção
**Versão:** 1.0 Final
**Data:** 29/10/2025

---

## 🎯 Visão Geral

Este servidor MCP oferece **4 tipos de busca principais** para consultar publicações do DJEN (Diário de Justiça Eletrônico Nacional) e compilar jurisprudência brasileira.

```
┌─────────────────────────────────────┐
│   DJEN MCP Server Slash Commands    │
├─────────────────────────────────────┤
│ 1️⃣  /busca-oab-djen                 │ ← Buscar por OAB
│ 2️⃣  /busca-processo-numero          │ ← Buscar por Processo
│ 3️⃣  /busca-processo-parte           │ ← Buscar por Parte
│ 4️⃣  /cadernos-jurisprudencia        │ ← Compilar Jurisprudência
└─────────────────────────────────────┘
```

---

## 1️⃣ Buscar por OAB - `/busca-oab-djen`

**Descrição:** Encontra todas as publicações mencionando um advogado (por OAB)

### Sintaxe
```bash
/busca-oab-djen <numero-oab> <uf> [dias]
```

### Exemplos
```bash
/busca-oab-djen 129021 SP 14      # Últimas 2 semanas
/busca-oab-djen 129021 SP 7       # Última semana
/busca-oab-djen 129021 SP 30      # Último mês
```

### Parâmetros
| Param | Tipo | Obrig? | Descrição |
|-------|------|--------|-----------|
| `numero-oab` | string | ✅ | Número OAB (ex: 129021) |
| `uf` | string | ✅ | Estado (ex: SP, RJ, MG) |
| `dias` | number | ❌ | Período em dias (padrão: 14) |

### Saída
```json
{
  "consulta": {
    "numeroOab": "129021",
    "ufOab": "SP",
    "periodo": { "inicio": "2025-10-12", "fim": "2025-10-26", "dias": 14 },
    "dataConsulta": "2025-10-26T15:30:00.000Z"
  },
  "estatisticas": {
    "totalComunicacoes": 15420,
    "comunicacoesFiltradas": 23,
    "totalProcessos": 12
  },
  "processos": [
    {
      "numeroProcesso": "1057607-11.2024.8.26.0002",
      "tribunal": "TJSP",
      "classe": "Apelação",
      "orgaoJulgador": "3ª Câmara de Direito Privado",
      "publicacoes": [...]
    }
  ]
}
```

### Arquivo Salvo
```
E:/djen-data/oab-129021-SP-2025-10-26.json
```

### Caso de Uso
- ✅ Monitorar publicações de um advogado
- ✅ Acompanhar processos onde advogado atua
- ✅ Gerar relatório de atividades judiciais

---

## 2️⃣ Buscar por Número de Processo - `/busca-processo-numero`

**Descrição:** Retorna TODAS as publicações de um processo específico

### Sintaxe
```bash
/busca-processo-numero <numero-processo>
```

### Exemplos
```bash
/busca-processo-numero 1057607-11.2024.8.26.0002
/busca-processo-numero 0000000-00.0000.0.00.0000
```

### Parâmetros
| Param | Tipo | Obrig? | Descrição |
|-------|------|--------|-----------|
| `numero-processo` | string | ✅ | Número CNJ com ou sem máscara |

### Validação
O comando valida automaticamente:
- ✅ Formato CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO)
- ✅ Dígitos verificadores
- ✅ Rejeita formatos inválidos

### Saída
- Timeline completa de publicações
- Padrões anormais (gaps, ordem inversa, etc)
- Alertas contextualizados
- JSON detalhado em `E:/djen-data/`

### Caso de Uso
- ✅ Acompanhar processo do cliente
- ✅ Extrair histórico completo
- ✅ Detectar anomalias processuais

---

## 3️⃣ Buscar por Parte - `/busca-processo-parte`

**Descrição:** Encontra todos os processos onde uma pessoa/empresa é parte

### Sintaxe
```bash
/busca-processo-parte <nome-parte>
```

### Exemplos
```bash
/busca-processo-parte RAIA DROGASIL
/busca-processo-parte Maria da Silva
/busca-processo-parte Banco do Brasil S.A.
```

### Parâmetros
| Param | Tipo | Obrig? | Descrição |
|-------|------|--------|-----------|
| `nome-parte` | string | ✅ | Nome da pessoa ou empresa |

### Saída
```
✅ Processos encontrados: 15
📋 Principais tribunais: TJSP (8), STJ (4), TRF3 (3)
👨‍⚖️ Advogados identificados: 12 diferentes
📊 Taxa de sucesso: 73% (11 ganhos, 4 perdidos)
```

### Arquivo Salvo
```
E:/djen-data/parte-{nome}-{timestamp}.json
```

### Caso de Uso
- ✅ Encontrar processos de cliente/concorrente
- ✅ Análise de jurisprudência de empresa
- ✅ Pesquisa de antecedentes judiciais

---

## 4️⃣ Compilar Jurisprudência - `/cadernos-jurisprudencia`

**Descrição:** Download de TODAS as publicações de um tribunal em uma data

**⭐ Novo comando - Resultado da Investigação DJEN**

### Sintaxe
```bash
/cadernos-jurisprudencia <tribunal> [data] [meio]
```

### Exemplos
```bash
/cadernos-jurisprudencia TJSP                    # TJSP hoje
/cadernos-jurisprudencia TJSP 2025-10-29        # TJSP em data específica
/cadernos-jurisprudencia TJSP 2025-10-29 D      # Meio Digital
/cadernos-jurisprudencia TJSP 2025-10-29 E      # Meio Eletrônico
/cadernos-jurisprudencia STJ 2025-10-15 D       # STJ em data específica
/cadernos-jurisprudencia TRT3 2025-10-20        # TRT3
```

### Parâmetros
| Param | Tipo | Obrig? | Valores | Descrição |
|-------|------|--------|--------|-----------|
| `tribunal` | string | ✅ | TJSP, TRT3, STJ, etc | Sigla do tribunal |
| `data` | YYYY-MM-DD | ❌ | 2025-10-29 | Padrão: hoje |
| `meio` | char | ❌ | **D** ou **E** | **D**=Digital, **E**=Eletrônico |

### Dados Reais (TJSP - 29/10/2025)
```
Meio Digital (D):
  ├─ Total: 219.993 publicações
  ├─ Páginas: 220
  ├─ Tamanho: 118 MB
  └─ Hash: c40025ad1e03647eb...

Meio Eletrônico (E):
  ├─ Total: 1.583 publicações
  ├─ Páginas: 2
  ├─ Tamanho: 1.4 MB
  └─ Hash: e0e610060ec13cbac...
```

### Saída
```
═══════════════════════════════════════════════════════════
  CADERNO DJEN - TJSP - 2025-10-29
═══════════════════════════════════════════════════════════

📚 METADADOS: Tribunal, Data, Status, Versão
📊 ESTATÍSTICAS: Total, Páginas, Tamanho, Hash
📥 DOWNLOAD: Status, Caminho local, URL
📋 PRÓXIMOS PASSOS: Como processar o PDF
```

### Arquivo Salvo
```
E:/djen-data/cadernos/caderno-TJSP-2025-10-29-D.pdf  (112 MB)
E:/djen-data/cadernos/caderno-TJSP-2025-10-29-E.pdf  (1.4 MB)
```

### Caso de Uso
- ✅ Compilar jurisprudência completa
- ✅ Análise jurimetria (estatísticas judiciais)
- ✅ Pesquisa acadêmica de jurisprudência
- ✅ Gerar base de precedentes
- ✅ Garantir cobertura 100% (sem perder dados)

### Vantagem sobre Busca por OAB
| Aspecto | Busca OAB | Cadernos |
|---------|-----------|----------|
| **Cobertura** | 100 itens máx | TODAS as publicações |
| **Instâncias** | Pode perder | Inclui 1ª + 2ª instância |
| **Paginação** | Manual | Completo |
| **Arquivo** | JSON pequeno | PDF grande (100+ MB) |
| **Tempo** | Segundos | Minutos |

---

## 📊 Comparação dos 4 Comandos

| Comando | Entrada | Busca | Saída | Melhor Para |
|---------|---------|-------|-------|------------|
| `/busca-oab-djen` | OAB + UF | Por OAB | JSON + Relatório | Monitorar advogado |
| `/busca-processo-numero` | Número processo | Por processo | JSON + Timeline | Acompanhar processo |
| `/busca-processo-parte` | Nome parte | Por parte | JSON + Estatísticas | Encontrar processos |
| `/cadernos-jurisprudencia` | Tribunal + data | Todos do dia | PDF compilado | Compilar jurisprudência |

---

## 🗂️ Estrutura de Diretórios

```
E:\djen-mcp-server\
├── .claude\
│   ├── commands\                          ← Todos os 4 comandos
│   │   ├── busca-oab-djen.md              (Buscar por OAB)
│   │   ├── busca-processo-numero.md       (Buscar por Processo)
│   │   ├── busca-processo-parte.md        (Buscar por Parte)
│   │   └── cadernos-jurisprudencia.md     (Compilar Jurisprudência) ⭐ NOVO
│   │
│   ├── agents\
│   │   └── monitoramento-oab\             (Agente OAB 24/7)
│   │
│   └── settings.local.json
│
├── src\
│   ├── api\
│   │   ├── client.ts                      (Cliente DJEN/PCP)
│   │   └── ...
│   ├── types\
│   └── utils\
│       └── oab-formatter.ts               (Novo - Variações OAB)
│
└── dist\                                  (Compilado)
```

---

## 🔄 Fluxo de Trabalho Recomendado

### Scenario 1: Monitorar um Advogado

```
1. /busca-oab-djen 129021 SP 14
   ↓ (recebe JSON com processos)
2. /busca-processo-numero 0000000-00.0000.0.00.0000
   ↓ (recebe timeline completa)
3. Analisar padrões e gerar parecer
```

### Scenario 2: Pesquisar Jurisprudência Completa

```
1. /cadernos-jurisprudencia TJSP 2025-10-29
   ↓ (baixa PDF com 220 mil publicações)
2. Processar PDF (extrair texto)
3. Indexar em banco de dados
4. Gerar estatísticas jurimetrais
```

### Scenario 3: Encontrar Processos de Cliente

```
1. /busca-processo-parte "EMPRESA X S.A."
   ↓ (encontra 15 processos)
2. /busca-processo-numero <para cada processo>
   ↓ (timeline completa de cada um)
3. Montar dossiê jurídico
```

---

## ⚙️ Configuração Necessária

### Variáveis de Ambiente
```bash
DJEN_API_URL=https://comunicaapi.pje.jus.br
DATABASE_PATH=E:/djen-data/djen.db
EMBEDDINGS_MODEL=Xenova/multilingual-e5-small
LOG_LEVEL=info
```

### Rate Limiting (Respeitado automaticamente)
- ✅ Máx 60 requisições/minuto
- ✅ Máx 5 requisições concorrentes
- ✅ Delays automáticos entre chamadas

### Diretórios Criados Automaticamente
```
E:/djen-data/
├── oab-*.json           (Resultados busca OAB)
├── processo-*.json      (Resultados busca processo)
├── parte-*.json         (Resultados busca parte)
└── cadernos/            (PDFs dos cadernos)
    ├── caderno-TJSP-2025-10-29-D.pdf
    └── caderno-TRT3-2025-10-29-E.pdf
```

---

## 📈 Limitações & Considerações

### Busca por OAB
- ⚠️ API retorna máx 10.000 itens
- ⚠️ Períodos > 30 dias podem ter resultados incompletos
- ✅ Rápido (segundos)

### Busca por Processo
- ✅ Cobertura completa daquele processo
- ✅ Detecta anomalias
- ✅ Rápido (segundos)

### Busca por Parte
- ⚠️ Pode retornar muitos resultados
- ⚠️ Nomes incompletos podem ter falsos positivos
- ✅ Ótimo para pesquisa ampla

### Cadernos
- ⚠️ Arquivos podem ter 100+ MB
- ⚠️ Requer espaço em disco
- ⚠️ Processamento de PDF pode ter erros OCR
- ✅ Garantia de cobertura 100%

---

## 🔐 Segurança & Auditoria

✅ **Todas as requisições:**
- Log em `E:/djen-data/logs/`
- Hash MD5 para auditoria
- Timestamp de cada operação
- Sem armazenamento de dados sensíveis

✅ **API DJEN:**
- Pública (sem autenticação)
- Rate limit respeitado
- Certificado SSL validado

---

## 📞 Suporte & Troubleshooting

### Erro: "API não respondendo"
```bash
Solução: Verificar internet e tentar novamente
Aguardar 1-2 minutos entre requisições grandes
```

### Erro: "Espaço em disco insuficiente"
```bash
Solução: Cadernos podem ter 100+ MB
Limpar arquivos antigos em E:/djen-data/cadernos/
```

### Resultado vazio em busca
```bash
Solução 1: Aumentar período (mais dias)
Solução 2: Usar /cadernos-jurisprudencia para cobertura 100%
Solução 3: Tentar nome alternativo para parte
```

---

## 🚀 Próximas Integrações

Planejado para futuras versões:
- [ ] Extração automática de texto de PDF
- [ ] Indexação em SQLite
- [ ] Alertas por email
- [ ] Dashboard web
- [ ] Análise jurimetria
- [ ] Exportação para Excel
- [ ] Integração com LLM para análise

---

## 📝 Checklist de Uso

```
Antes de usar:
□ Verificar internet está funcionando
□ Confirmar espaço em disco (100 MB para cadernos)
□ Ter variáveis de ambiente configuradas

Ao usar:
□ Usar sintaxe correta do comando
□ Respeitar rate limits (60 req/min)
□ Verificar arquivo salvo em E:/djen-data/

Após usar:
□ Revisar resultado
□ Salvar em base de dados se necessário
□ Fazer backup de PDFs importantes
□ Verificar logs se houver erros
```

---

## 📚 Referências Externas

- **API DJEN:** https://comunicaapi.pje.jus.br/swagger/index.html
- **CNJ Portal:** https://www.cnj.jus.br
- **DataJud:** https://api-publica.datajud.cnj.jus.br
- **Documentação:** Ver `/CADERNOS_API_GUIDE.md`

---

**Versão:** 1.0
**Status:** ✅ Pronto para Produção
**Últimas mudanças:** 29/10/2025
