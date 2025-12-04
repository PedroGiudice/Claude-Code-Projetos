# ATTACK VECTORS

Vulnerabilidades frequentes e técnicas de ataque para revisão adversarial.

---

## Ataques a Teses Jurídicas

### 1. Ataque à Subsunção
**O que verificar**: Fato realmente se enquadra na norma?

| Vulnerabilidade | Pergunta | Exemplo |
|-----------------|----------|---------|
| Elemento ausente | Todos os elementos da norma estão presentes nos fatos? | Responsabilidade civil sem demonstração de dano |
| Elemento presumido | O elemento foi provado ou apenas alegado? | Culpa alegada mas não demonstrada |
| Fato controverso | Adversário contesta esse fato? | Data de ciência do vício |
| Interpretação forçada | Fato precisa ser "esticado" para caber? | Equiparação questionável |

**Teste**: Para cada elemento da norma, perguntar "onde está a prova disso?"

### 2. Ataque Normativo
**O que verificar**: É a norma certa? Há exceção?

| Vulnerabilidade | Pergunta | Exemplo |
|-----------------|----------|---------|
| Norma errada | Existe norma mais específica? | Lei geral quando há lei especial |
| Exceção ignorada | Há exceção não considerada? | Excludente de responsabilidade |
| Revogação | Norma ainda está vigente? | Dispositivo revogado |
| Alteração | Redação atual é essa? | Lei alterada depois do fato |

**Teste**: Buscar "não se aplica quando...", "exceto se...", "salvo..."

### 3. Ataque Jurisprudencial
**O que verificar**: Jurisprudência sustenta a tese?

| Vulnerabilidade | Pergunta | Exemplo |
|-----------------|----------|---------|
| Jurisprudência contrária | Há posição dominante em sentido oposto? | Súmula desfavorável |
| Desatualização | Precedente é recente? | Julgado de 10 anos atrás |
| Distinguishing falho | A distinção convence? | Diferença irrelevante |
| Obiter dictum | É ratio decidendi ou comentário lateral? | Citação fora de contexto |
| Instância inferior | Há posição de tribunal superior? | TJ contra STJ |

**Teste**: Pesquisar "em sentido contrário" + tema

### 4. Ataque Lógico
**O que verificar**: A conclusão decorre das premissas?

| Vulnerabilidade | Pergunta | Exemplo |
|-----------------|----------|---------|
| Non sequitur | Conclusão realmente segue? | Salto argumentativo |
| Contradição | Há afirmações incompatíveis? | Alegar A e não-A |
| Petição de princípio | Pressupõe o que deveria provar? | Circular |
| Generalização | De caso específico para regra geral? | Amostra insuficiente |

**Teste**: Reconstruir silogismo formal; premissas sustentam conclusão?

---

## Ataques a Pesquisas

### 1. Completude
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Norma faltante | Todas as normas típicas do tema foram buscadas? |
| Tribunal omitido | Todos os tribunais relevantes foram consultados? |
| Precedente vinculante | Súmulas e temas foram verificados? |
| Atualização | Pesquisa é recente o suficiente? |

### 2. Verificação
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Fonte primária | Foi verificado no original ou é citação de citação? |
| Texto completo | O dispositivo foi lido inteiro ou só trecho? |
| Contexto | O precedente diz isso no contexto correto? |
| Vigência | A norma ainda está vigente? |

### 3. Viés
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Cherry-picking | Só buscou jurisprudência favorável? |
| Divergência oculta | Há posição contrária não mencionada? |
| Tribunal seletivo | Escolheu o tribunal mais favorável ignorando outros? |

---

## Ataques a Extrações

### 1. Precisão
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Dado incorreto | O valor/data/nome está certo? |
| Transcrição | Texto literal confere com original? |
| Cálculo | A matemática está correta? |

### 2. Completude
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Omissão relevante | Faltou extrair algo importante? |
| Contexto | Dado fora de contexto muda o sentido? |
| Ressalvas | Condições/exceções foram extraídas? |

### 3. Interpretação
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Inferência indevida | Extrator deduziu algo não escrito? |
| Ambiguidade | Texto admite outra leitura? |

---

## Ataques a Textos/Documentos

### 1. Citações
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Inexistente | Citação realmente existe? |
| Distorcida | Diz o que se alega que diz? |
| Desatualizada | Ainda é válida/vigente? |
| Formatação | Formato está correto? |

### 2. Estrutura
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Requisitos formais | Atende art. 319 CPC (ou equivalente)? |
| Organização | Fluxo lógico está claro? |
| Completude | Todos os pontos necessários estão presentes? |

### 3. Clareza
| Vulnerabilidade | Pergunta |
|-----------------|----------|
| Ambiguidade | Frase admite dupla interpretação? |
| Jargão excessivo | Destinatário vai entender? |
| Prolixidade | Dá para ser mais direto? |

---

## Severidade de Vulnerabilidades

### CRÍTICA (bloqueia)
- Citação inexistente ou distorcida
- Precedente vinculante contrário não enfrentado
- Erro de fato determinante
- Conclusão não decorre das premissas
- Norma revogada como fundamento principal

### ALTA (corrigir antes de usar)
- Jurisprudência dominante contrária
- Elemento da norma sem correspondência fática
- Divergência não mapeada
- Tese inovadora sem fundamentação principiológica

### MÉDIA (considerar correção)
- Jurisprudência antiga (> 5 anos)
- Argumentação mais forte disponível
- Estrutura subótima
- Clareza pode melhorar

### BAIXA (melhoria opcional)
- Formatação
- Estilo
- Organização alternativa

---

## Simulação de Adversário

### Perspectiva: Advogado Contrário
**Foco**: Onde atacar para vencer?
- Pontos fracos na prova
- Jurisprudência favorável à outra parte
- Interpretação alternativa da norma
- Fatos controversos a explorar

### Perspectiva: Juiz Cético
**Foco**: Por que não acolher?
- Fundamento suficiente?
- Prova robusta?
- Pedido determinado?
- Jurisprudência pacífica?

### Perspectiva: Desembargador
**Foco**: Merece reforma?
- Sentença está fundamentada?
- Houve error in judicando?
- Houve error in procedendo?
- Jurisprudência do tribunal é em que sentido?

---

## Checklist Rápido de Ataque

### Para qualquer tese
- [ ] Todos os elementos da norma têm fato correspondente?
- [ ] Existe precedente vinculante sobre o tema?
- [ ] Jurisprudência dominante é favorável ou contrária?
- [ ] Conclusão decorre logicamente das premissas?
- [ ] Contrapontos foram antecipados e refutados?
- [ ] Citações foram verificadas?

### Red flags
- "É evidente que..." (sem demonstração)
- "A jurisprudência pacífica..." (sem citar)
- "Conforme entendimento majoritário..." (qual?)
- Ausência de contrapontos
- Tese inovadora sem fundamentação principiológica
- Precedente vinculante ignorado
