# ADR 0001: Repository Separation

## Status
Accepted

## Date
2026-01-09

## Context
O repositório Claude-Code-Projetos evoluiu organicamente para conter:
- Legal Workbench (projeto principal de automação jurídica)
- Experimentos diversos (ADK agents, UIs, skills, templates)

Essa mistura causava:
- Confusão sobre o propósito do repositório
- Dificuldade em onboarding de novos contribuidores
- Poluição de contexto para Claude Code
- Commits misturando concerns diferentes

## Decision
Separar o repositório em dois:

1. **Claude-Code-Projetos** (este repo)
   - Foco exclusivo: Legal Workbench
   - Contém: frontend/, backend/, lte/, docker/, ferramentas/, docs/
   - Audiência: Desenvolvimento do produto jurídico

2. **claude-experiments** (novo repo)
   - Foco: Experimentos e protótipos
   - Contém: adk-agents/, CCui/, claudecodeui-main/, skills/, scripts/, shared/, tests/
   - Audiência: R&D, POCs, experimentação

## Consequences

### Positivas
- Clareza de propósito em cada repositório
- Onboarding simplificado para Legal Workbench
- Contexto mais limpo para Claude Code
- Histórico de commits mais coerente
- Possibilidade de diferentes políticas de acesso/deploy

### Negativas
- Necessidade de clonar dois repos para trabalho completo
- Potencial duplicação de utilities entre repos
- Custo único de migração e reorganização

### Mitigações
- Documentação clara sobre onde cada tipo de trabalho acontece
- Link no README de cada repo para o outro
- Se necessário, extrair shared utilities para pacote npm/pip

## Implementation
- Data: 2026-01-09
- Commits: 4ee616aa, de4ef127
- Novo repo: https://github.com/PedroGiudice/claude-experiments
