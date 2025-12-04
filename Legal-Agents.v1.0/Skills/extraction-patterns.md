# EXTRACTION PATTERNS

Templates e padrões para extração de dados de documentos jurídicos.

## Fatos

### Onde encontrar
- Petição inicial: seção "DOS FATOS" ou "DA NARRAÇÃO DOS FATOS"
- Contestação: seção "DOS FATOS" ou "DA IMPUGNAÇÃO AOS FATOS"
- Sentença: seção "RELATÓRIO"
- Acórdão: "RELATÓRIO" do voto do relator

### O que extrair
```yaml
fato:
  id: F[N]
  descricao: [narração]
  data: [quando ocorreu, se mencionado]
  agentes: [quem fez o quê]
  documentos: [provas mencionadas]
  controverso: [true se contestado]
```

### Padrão de numeração
- F1, F2, F3... em ordem cronológica quando possível
- Se documento já numera, manter numeração original

---

## Valores

### Onde encontrar
- Inicial: "DO VALOR DA CAUSA", "DOS PEDIDOS", corpo do texto
- Sentença: "DISPOSITIVO", "julgo procedente/improcedente"
- Acordo: cláusulas de pagamento
- Planilha: qualquer anexo com cálculos

### O que extrair
```yaml
valor:
  rubrica: [principal | juros | correção | multa | honorários | custas | danos morais | outro]
  quantia: [R$ X,XX ou "a apurar" ou "X salários"]
  base_calculo: [se percentual, sobre o quê]
  indice: [correção monetária aplicável]
  termo_inicial: [a partir de quando]
  observacao: [limitações, condições]
```

### Valores típicos a buscar
- Principal (valor do contrato, dano material, verbas trabalhistas)
- Juros de mora (taxa, termo inicial)
- Correção monetária (índice, termo inicial)
- Multa contratual ou processual
- Honorários advocatícios (% ou valor fixo)
- Custas e despesas processuais
- Danos morais (se houver)
- Danos estéticos (se houver)

---

## Partes

### Onde encontrar
- Qualquer peça: cabeçalho, qualificação inicial
- Procuração: outorgante e outorgado
- Contrato: preâmbulo

### O que extrair
```yaml
parte:
  polo: [autor | réu | terceiro | assistente | outro]
  nome: [nome completo]
  tipo: [PF | PJ]
  documento: [CPF | CNPJ]
  qualificacao: [nacionalidade, estado civil, profissão - se PF]
  endereco: [se disponível]
  representante: [se PJ ou incapaz]
  advogado:
    nome: [nome]
    oab: [número/seccional]
```

---

## Pedidos

### Onde encontrar
- Inicial: "DOS PEDIDOS", "REQUER", lista final
- Reconvenção: mesma estrutura
- Recurso: "DAS RAZÕES DO PEDIDO DE REFORMA"

### O que extrair
```yaml
pedido:
  id: P[N]
  tipo: [condenatório | declaratório | constitutivo | cautelar | tutela urgência]
  descricao: [o que se pede]
  valor: [se quantificado]
  fundamento: [artigo ou base legal mencionada]
  cumulacao: [simples | subsidiário | alternativo | sucessivo]
```

---

## Datas e Prazos

### Onde encontrar
- Qualquer documento: buscar padrões DD/MM/AAAA, "em [data]", "no dia"
- Decisões: data do julgamento, publicação, trânsito
- Contratos: vigência, vencimentos

### O que extrair
```yaml
data:
  evento: [descrição]
  data: [DD/MM/AAAA]
  tipo: [fato | prazo | vencimento | julgamento | publicação | trânsito]
  consequencia: [relevância jurídica]
```

### Datas críticas a buscar
- Fato gerador (início da prescrição)
- Citação (interrupção da prescrição)
- Sentença e publicação
- Interposição de recursos
- Trânsito em julgado
- Vencimentos contratuais

---

## Fundamentos Jurídicos

### Onde encontrar
- Inicial: "DO DIREITO", "DOS FUNDAMENTOS JURÍDICOS"
- Contestação: "DO DIREITO", "DAS PRELIMINARES", "DO MÉRITO"
- Sentença: "FUNDAMENTAÇÃO" ou "MOTIVAÇÃO"

### O que extrair
```yaml
fundamento:
  tipo: [preliminar | prejudicial | mérito]
  tese: [síntese do argumento]
  normas: [artigos citados]
  jurisprudencia: [precedentes citados]
  posicao: [autor | réu | juízo]
```

---

## Decisões

### Onde encontrar
- Sentença: "DISPOSITIVO", "julgo", "decido"
- Acórdão: "ACORDAM", ementa, dispositivo
- Decisão interlocutória: parte final

### O que extrair
```yaml
decisao:
  tipo: [sentença | acórdão | decisão interlocutória | despacho]
  resultado: [procedente | improcedente | parcialmente procedente | extinto sem mérito]
  fundamento_principal: [ratio decidendi]
  condenacoes: [lista de condenações]
  honorarios: [sucumbência]
  custas: [responsabilidade]
  recursos_cabiveis: [se mencionados]
```
