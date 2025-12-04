# Legal Agents v1.0

Sistema de agentes jurídicos especializados para Claude Code.

## Arquitetura

```
Agentes = executores especializados (contexto isolado, sob demanda)
Skills  = conhecimento compartilhado (templates, padrões, referências)
```

### Agentes

| Agente | Função | Quando usar |
|--------|--------|-------------|
| **extractor** | Extrai dados estruturados de documentos | Fatos, valores, datas, partes, pedidos |
| **briefer** | Gera resumos adaptáveis | Resumo executivo, briefing, checklist |
| **admin** | Produz documentos administrativos | Emails, planilhas, cronogramas |
| **researcher** | Identifica legislação e pesquisa jurisprudência | Normas aplicáveis, precedentes, divergências |
| **thesis-builder** | Elabora argumentos estruturados (IRAC+) | Construir teses, fundamentar pedidos |
| **attacker** | Encontra vulnerabilidades | Revisar qualquer output, simular adversário |

### Skills

| Skill | Conteúdo |
|-------|----------|
| **extraction-patterns** | Templates de extração por tipo de dado |
| **document-types** | Estrutura de petições, sentenças, recursos |
| **legal-areas** | Normas típicas por área do direito |
| **argument-patterns** | IRAC+, técnicas hermenêuticas |
| **attack-vectors** | Vulnerabilidades e técnicas de ataque |

---

## Instalação

Copiar para o repositório:

```bash
cp -r agents/ ~/.claude/agents/
cp -r skills/ ~/.claude/skills/
```

Ou usar como agentes globais conforme configuração do Claude Code.

---

## Uso

### Princípio fundamental

**Você controla quais agentes rodam, quando rodam, e sobre o quê.**

Não é pipeline automática. É toolbox de especialistas.

### Exemplos de uso

#### Caso novo - entender o que tem

```
Você: "Extractor: extrai fatos e valores da inicial anexa"
      [Extractor executa]

Você: "Briefer: resumo executivo desse caso, 1 página, para o sócio"
      [Briefer executa com output do Extractor]
```

#### Pesquisa jurídica

```
Você: "Researcher: legislação e jurisprudência sobre prescrição de dívida condominial"
      [Researcher executa]

Você: "Attacker: essa pesquisa está completa? Falta alguma norma ou precedente?"
      [Attacker executa sobre output do Researcher]
```

#### Construir argumento

```
Você: "Thesis-builder: constrói tese de que a dívida prescreveu em 5 anos"
      [Thesis-builder executa]

Você: "Attacker: ataca essa tese, perspectiva do advogado do condomínio"
      [Attacker executa sobre tese]

Você: "Thesis-builder: reforça a tese considerando os ataques"
      [Thesis-builder executa nova versão]
```

#### Documento administrativo

```
Você: "Admin: email pro cliente informando redesignação da audiência"
      [Admin executa]
```

### O que cada agente recebe

Os agentes têm **contexto isolado**. Você passa o que eles precisam:

| Agente | Recebe |
|--------|--------|
| extractor | Documento + o que extrair |
| briefer | Informações do caso + formato/audiência |
| admin | Dados + tipo de documento |
| researcher | Tema + escopo |
| thesis-builder | Questão + fatos + fontes |
| attacker | Output de outro agente + foco |

### Fluxo típico (não obrigatório)

```
1. Extractor → dados brutos
2. Briefer → entendimento geral
3. Researcher → fundamentos
4. Attacker → verifica pesquisa
5. Thesis-builder → argumentos
6. Attacker → verifica argumentos
7. Admin/Briefer → outputs finais
```

Mas você pode pular etapas, voltar, repetir, usar só um agente.

---

## Outputs

### Formato padrão

Todos os agentes produzem output estruturado (YAML/JSON) que pode alimentar outro agente.

### Níveis de confiança

| Nível | Significado |
|-------|-------------|
| alta | Verificado em fonte oficial |
| média | Conhecimento interno ou fonte secundária |
| baixa | Não verificado, usar com cautela |

### Severidade de vulnerabilidades (Attacker)

| Nível | Significado | Ação |
|-------|-------------|------|
| CRÍTICA | Inviabiliza | Bloquear até corrigir |
| ALTA | Enfraquece | Corrigir antes de usar |
| MÉDIA | Problema | Considerar correção |
| BAIXA | Melhoria | Opcional |

---

## Skills como contexto

Os agentes referenciam skills, mas você também pode consultar diretamente:

```
Você: "Quais são as normas típicas de direito do consumidor?"
      → Consultar skills/legal-areas.md

Você: "Como estruturar um argumento de prescrição?"
      → Consultar skills/argument-patterns.md
```

---

## Limitações conhecidas

1. **Contexto isolado**: Agentes não sabem o que outros fizeram (isso é feature, não bug)
2. **Verificação de jurisprudência**: Depende de portais de tribunais funcionando
3. **Conhecimento interno**: Tem data de corte; verificar normas recentes
4. **Não substitui advogado**: Human-in-the-loop sempre

---

## Versionamento

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | 2025-01 | Release inicial: 6 agentes, 5 skills |

---

## Referências

- [LDE Reference v5.1](../LDE_REFERENCE_v5.1.md) - Fundamentação teórica
- Koulu et al. (2021) - Design Patterns in Law
- Wilson (2006) - Refactoring the Law
- Prakken (1997) - Logical Tools for Legal Argument
