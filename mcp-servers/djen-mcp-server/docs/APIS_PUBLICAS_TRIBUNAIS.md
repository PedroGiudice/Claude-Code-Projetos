# APIs Públicas para Consulta de Processos Judiciais Brasileiros

Este documento mapeia as principais APIs disponíveis para consulta de processos e publicações judiciais no Brasil, com foco em APIs públicas e gratuitas.

## 📊 Resumo Executivo

| API | Tipo | Cobertura | Autenticação | Custo | Status |
|-----|------|-----------|--------------|-------|--------|
| **DataJud (CNJ)** | REST/Elasticsearch | Nacional (91 tribunais) | API Key pública | **Gratuito** | ✅ Ativa |
| **PJe MNI** | SOAP WebService | Nacional (PJe) | Credenciais por tribunal | **Gratuito** | ✅ Ativa |
| **Jusbrasil** | REST | Nacional | Bearer Token | **Comercial** | ✅ Ativa |
| **Escavador** | REST | Nacional | Bearer Token | **Comercial** | ✅ Ativa |
| **DJEN** | REST | Nacional (CNJ) | JWT | **Gratuito?** | ⚠️ A confirmar |

---

## 1. API Pública do DataJud (CNJ) ⭐ **RECOMENDADA**

### Descrição
API oficial do Conselho Nacional de Justiça (CNJ) que universaliza o acesso a metadados de processos judiciais de todo o Brasil.

### Características
- **Tipo:** REST API (baseada em Elasticsearch)
- **Base URL:** `https://api-publica.datajud.cnj.jus.br/`
- **Autenticação:** API Key pública (sem cadastro)
- **Custo:** **100% Gratuito**
- **Cobertura:** 91 tribunais brasileiros
- **Lançamento:** Setembro de 2024
- **Base legal:** Portaria CNJ nº 160/2020, Portaria nº 91/2021, Resolução nº 331/2020

### Autenticação

**Chave pública atual (2025):**
```
cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
```

**Header HTTP:**
```http
Authorization: APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
```

⚠️ **Nota:** A chave pode ser alterada pelo CNJ a qualquer momento por razões de segurança.

### Endpoints Disponíveis

#### Estrutura Geral
```
https://api-publica.datajud.cnj.jus.br/api_publica_[TRIBUNAL]/_search
```

#### Tribunais Superiores (4)
| Tribunal | Alias | Endpoint |
|----------|-------|----------|
| Supremo Tribunal Federal | stf | `api_publica_stf/_search` |
| Superior Tribunal de Justiça | stj | `api_publica_stj/_search` |
| Tribunal Superior do Trabalho | tst | `api_publica_tst/_search` |
| Tribunal Superior Eleitoral | tse | `api_publica_tse/_search` |
| Tribunal Superior Militar | stm | `api_publica_stm/_search` |

#### Justiça Federal (6 TRFs)
| Tribunal | Alias | Endpoint |
|----------|-------|----------|
| TRF 1ª Região | trf1 | `api_publica_trf1/_search` |
| TRF 2ª Região | trf2 | `api_publica_trf2/_search` |
| TRF 3ª Região | trf3 | `api_publica_trf3/_search` |
| TRF 4ª Região | trf4 | `api_publica_trf4/_search` |
| TRF 5ª Região | trf5 | `api_publica_trf5/_search` |
| TRF 6ª Região | trf6 | `api_publica_trf6/_search` |

#### Justiça Estadual (27 TJs)
| Estado | Alias | Endpoint |
|--------|-------|----------|
| São Paulo | tjsp | `api_publica_tjsp/_search` |
| Rio de Janeiro | tjrj | `api_publica_tjrj/_search` |
| Minas Gerais | tjmg | `api_publica_tjmg/_search` |
| Rio Grande do Sul | tjrs | `api_publica_tjrs/_search` |
| Paraná | tjpr | `api_publica_tjpr/_search` |
| Bahia | tjba | `api_publica_tjba/_search` |
| Santa Catarina | tjsc | `api_publica_tjsc/_search` |
| Pernambuco | tjpe | `api_publica_tjpe/_search` |
| Ceará | tjce | `api_publica_tjce/_search` |
| Goiás | tjgo | `api_publica_tjgo/_search` |
| Pará | tjpa | `api_publica_tjpa/_search` |
| Maranhão | tjma | `api_publica_tjma/_search` |
| Espírito Santo | tjes | `api_publica_tjes/_search` |
| Paraíba | tjpb | `api_publica_tjpb/_search` |
| Amazonas | tjam | `api_publica_tjam/_search` |
| Rio Grande do Norte | tjrn | `api_publica_tjrn/_search` |
| Alagoas | tjal | `api_publica_tjal/_search` |
| Mato Grosso | tjmt | `api_publica_tjmt/_search` |
| Piauí | tjpi | `api_publica_tjpi/_search` |
| Mato Grosso do Sul | tjms | `api_publica_tjms/_search` |
| Sergipe | tjse | `api_publica_tjse/_search` |
| Rondônia | tjro | `api_publica_tjro/_search` |
| Tocantins | tjto | `api_publica_tjto/_search` |
| Acre | tjac | `api_publica_tjac/_search` |
| Amapá | tjap | `api_publica_tjap/_search` |
| Roraima | tjrr | `api_publica_tjrr/_search` |
| Distrito Federal | tjdft | `api_publica_tjdft/_search` |

#### Justiça do Trabalho (24 TRTs)
| Região | Alias | Endpoint |
|--------|-------|----------|
| TRT 1ª (RJ) | trt1 | `api_publica_trt1/_search` |
| TRT 2ª (SP) | trt2 | `api_publica_trt2/_search` |
| TRT 3ª (MG) | trt3 | `api_publica_trt3/_search` |
| TRT 4ª (RS) | trt4 | `api_publica_trt4/_search` |
| TRT 5ª (BA) | trt5 | `api_publica_trt5/_search` |
| ... | ... | ... (TRT 6 a 24) |

#### Justiça Eleitoral (28 TREs)
| Estado | Alias | Endpoint |
|--------|-------|----------|
| TRE-SP | tresp | `api_publica_tresp/_search` |
| TRE-RJ | trerj | `api_publica_trerj/_search` |
| ... | ... | ... (todos os 27 estados + DF) |

#### Justiça Militar (3)
| Tribunal | Alias | Endpoint |
|----------|-------|----------|
| TJM-MG | tjmmg | `api_publica_tjmmg/_search` |
| TJM-RS | tjmrs | `api_publica_tjmrs/_search` |
| TJM-SP | tjmsp | `api_publica_tjmsp/_search` |

### Exemplo de Requisição

#### cURL
```bash
curl -X POST "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search" \
  -H "Authorization: APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "numeroProcesso": "1057607-11.2024.8.26.0002"
      }
    }
  }'
```

#### TypeScript/Node.js
```typescript
const response = await fetch(
  'https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search',
  {
    method: 'POST',
    headers: {
      'Authorization': 'APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        match: {
          numeroProcesso: '1057607-11.2024.8.26.0002'
        }
      }
    })
  }
);

const data = await response.json();
```

### Estrutura de Resposta

A API retorna dados no formato Elasticsearch:

```json
{
  "hits": {
    "total": { "value": 1, "relation": "eq" },
    "max_score": 1.0,
    "hits": [
      {
        "_index": "api_publica_tjsp",
        "_id": "...",
        "_score": 1.0,
        "_source": {
          "numeroProcesso": "1057607-11.2024.8.26.0002",
          "tribunal": "TJSP",
          "orgaoJulgador": "2ª Vara Cível",
          "classeProcessual": "Procedimento Comum Cível",
          "assunto": ["Responsabilidade Civil"],
          "dataAjuizamento": "2024-11-15",
          "movimentos": [
            {
              "dataHora": "2024-11-15T10:30:00",
              "movimento": "Distribuído",
              "complemento": "..."
            }
          ]
        }
      }
    ]
  }
}
```

### Dados Disponíveis

A API fornece acesso a:
- ✅ Número do processo (CNJ)
- ✅ Tribunal e órgão julgador
- ✅ Grau de jurisdição
- ✅ Classe processual
- ✅ Assuntos
- ✅ Movimentações processuais
- ✅ Datas (ajuizamento, publicações)
- ❌ **NÃO** inclui processos sob segredo de justiça
- ❌ **NÃO** inclui teor completo de decisões (apenas metadados)

### Limitações Conhecidas

- **Rate Limit:** Não documentado oficialmente
- **Processos sigilosos:** Não são retornados
- **Conteúdo completo:** Apenas metadados (não retorna PDFs ou texto completo de decisões)
- **Paginação:** Máximo de 10.000 registros por página (padrão Elasticsearch)

### Recursos Adicionais

- **Wiki oficial:** https://datajud-wiki.cnj.jus.br/
- **Documentação da API:** https://datajud-wiki.cnj.jus.br/api-publica/
- **Tutorial PDF:** https://www.cnj.jus.br/wp-content/uploads/2023/05/tutorial-api-publica-datajud-beta.pdf
- **Portal CNJ:** https://www.cnj.jus.br/sistemas/datajud/api-publica/

---

## 2. PJe - Modelo Nacional de Interoperabilidade (MNI)

### Descrição
WebService SOAP para integração com o Processo Judicial Eletrônico (PJe), desenvolvido por equipes técnicas do STF, CNJ, STJ, CJF, TST, CSJT, AGU e PGR.

### Características
- **Tipo:** SOAP WebService
- **WSDL:** `http://[ENDERECO_PJE]/intercomunicacao?wsdl`
- **WSDL Consulta:** `http://[ENDERECO_PJE]/ConsultaPJe?wsdl`
- **Autenticação:** Credenciais específicas por tribunal
- **Custo:** **Gratuito** (requer autorização formal)

### Operações Disponíveis

#### WebService Principal
- `consultarProcesso` - Visualizar informações do processo
- `consultarAvisosPendentes` - Verificar comunicações pendentes
- `consultarTeorComunicacao` - Acessar conteúdo de intimações
- `entregarManifestacaoProcessual` - Criar processos ou anexar documentos

#### WebService Complementar (ConsultaPJe)
- Consultas adicionais ao PJe

### Como Obter Acesso

1. Enviar ofício à Presidência do tribunal solicitando acesso
2. Justificar a necessidade de integração
3. Aguardar análise pelo Departamento de TI
4. Receber credenciais para ambiente de testes
5. Após homologação, receber credenciais de produção

### Limitações

- ⚠️ **Requer autorização formal** de cada tribunal
- ⚠️ **Processo burocrático** (pode levar semanas/meses)
- ⚠️ **SOAP** (tecnologia mais antiga que REST)
- ⚠️ **Endpoints variam** por tribunal

### Recursos Adicionais

- **Documentação oficial:** https://docs.pje.jus.br/
- **Padrões de API:** https://docs.pje.jus.br/manuais-basicos/padroes-de-api-do-pje/
- **Serviço MNI:** https://docs.pje.jus.br/servicos-auxiliares/servico-mni-client/

---

## 3. DJEN - Diário de Justiça Eletrônico Nacional

### Descrição
API do CNJ para consulta de publicações oficiais no Diário de Justiça Eletrônico Nacional.

### Características
- **Tipo:** REST API
- **Base URL:** `https://comunicaapi.pje.jus.br` (a confirmar)
- **Autenticação:** JWT (token renovado a cada hora)
- **Custo:** **Gratuito?** (a confirmar)
- **Status:** ⚠️ **Endpoints não confirmados oficialmente**

### Status de Implementação

Este projeto (`djen-mcp-server`) foi desenvolvido com base em padrões REST comuns, mas **os endpoints exatos da API DJEN ainda não foram confirmados**.

### Próximos Passos

- [ ] Confirmar URL base oficial
- [ ] Validar esquema de autenticação
- [ ] Testar endpoints reais
- [ ] Ajustar tipos TypeScript conforme resposta real

### Recursos Adicionais

- **Swagger (requer login):** https://app.swaggerhub.com/apis-docs/cnj/pcp/1.0.0
- **Portal CNJ:** https://www.cnj.jus.br/programas-e-acoes/processo-judicial-eletronico-pje/comunicacoes-processuais/
- **GitJus - Conector PJe:** https://git.cnj.jus.br/git-jus/conector-pje-pcp
- **Suporte:** sistemasnacionais@cnj.jus.br | (61) 2326-5353

---

## 4. APIs Comerciais

### 4.1 Jusbrasil API

#### Características
- **Tipo:** REST API
- **Autenticação:** Bearer Token
- **Custo:** **Comercial** (contato comercial)
- **Cobertura:** Nacional

#### Funcionalidades
- Monitoramento de novos processos
- Consulta por CPF/CNPJ
- Download de autos processuais
- Análise de risco e compliance
- Dados estruturados

#### Recursos
- **Documentação:** https://api.jusbrasil.com.br/docs/
- **Soluções:** https://insight.jusbrasil.com.br/

### 4.2 Escavador API

#### Características
- **Tipo:** REST API (v2)
- **Autenticação:** Bearer Token
- **Custo:** **Comercial**
- **Cobertura:** Nacional
- **Rate Limit:** 500 requisições/minuto

#### Funcionalidades
- Busca de processos (v2 com dados estruturados)
- Download de documentos públicos
- Acesso a autos com certificado digital
- Callbacks para eventos assíncronos
- Atualização de processos

#### Recursos
- **Documentação v2:** https://api.escavador.com/v2/docs/
- **Site oficial:** https://api.escavador.com/
- **Blog:** https://blog.escavador.com/api-do-escavador
- **Suporte:** https://suporte-api.escavador.com/

### 4.3 Outras Soluções Comerciais

- **Judit API** - https://judit.io/
- **Intima.AI** - https://intima.ai/
- **Infosimples** - https://infosimples.com/
- **Codilo** - https://www.codilo.com.br/

---

## 📋 Recomendações para Este Projeto

### Prioridade 1: DataJud API (CNJ) ⭐
**Razões:**
- ✅ **100% Gratuita**
- ✅ **Sem cadastro/burocracia**
- ✅ **Cobertura nacional** (91 tribunais)
- ✅ **Oficial do CNJ**
- ✅ **API Key pública disponível**
- ✅ **REST API moderna**

**Ações imediatas:**
1. Implementar cliente DataJud no servidor MCP
2. Substituir endpoints hipotéticos do DJEN
3. Atualizar agentes para usar DataJud
4. Manter DJEN como fallback caso seja confirmado

### Prioridade 2: PJe MNI (Longo Prazo)
**Razões:**
- ✅ **Gratuita**
- ✅ **Acesso a conteúdo completo** (não apenas metadados)
- ⚠️ **Requer autorização formal**

**Ações futuras:**
1. Solicitar acesso a tribunais relevantes (TJSP, TRF3, etc.)
2. Implementar cliente SOAP quando credenciais forem obtidas

### Prioridade 3: APIs Comerciais (Opcional)
**Usar apenas se:**
- Necessidade de dados não disponíveis na DataJud
- Orçamento disponível
- Funcionalidades avançadas (monitoramento, webhooks)

---

## 🔄 Migração da Implementação Atual

### Atual
```typescript
// Implementação hipotética baseada em padrões REST
const response = await fetch('https://comunicaapi.pje.jus.br/...', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Novo (DataJud)
```typescript
// Implementação real com API pública do CNJ
const response = await fetch('https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search', {
  method: 'POST',
  headers: {
    'Authorization': 'APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: {
      match: { numeroProcesso: '...' }
    }
  })
});
```

---

## 📚 Referências

1. **CNJ - API Pública do DataJud**
   - https://datajud-wiki.cnj.jus.br/
   - https://www.cnj.jus.br/sistemas/datajud/api-publica/

2. **PJe - Documentação Oficial**
   - https://docs.pje.jus.br/

3. **Artigos e Tutoriais**
   - [Consulta com Python à API DataJud](https://medium.com/@pimentel.jes/consulta-com-python-à-api-pública-do-datajud-base-de-dados-do-poder-judiciário-do-cnj-670157a392ae)
   - [Construindo algoritmo para consumir API do CNJ](https://dev.to/leonardo_vilela/construindo-algoritmo-para-consumir-a-api-publica-do-cnj-conselho-nacional-de-justica-1a-parte-3n4i)

---

**Última atualização:** 26/10/2025
**Responsável:** Desenvolvimento DJEN MCP Server
