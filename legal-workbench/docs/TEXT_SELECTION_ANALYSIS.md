# Analise de Selecao de Texto - Doc Assembler

> **Data:** 2026-01-17
> **Contexto:** Bug onde clicar no FieldEditorPanel fazia a selecao desaparecer

---

## Causa Raiz Identificada

**Arquivo:** `frontend/src/hooks/useTextSelection.ts`, linhas 62-69

```typescript
const handleMouseDown = () => {
  // Clear selection when starting a new selection
  setSelection(null);
  options.onSelectionChange?.call(null, null);
};

document.addEventListener('mousedown', handleMouseDown);  // <-- PROBLEMA
```

### Fluxo do Bug:

1. Usuario seleciona texto no documento
2. `handleMouseUp` detecta e salva a selecao no store via `setSelectedText()`
3. `FieldEditorPanel` renderiza mostrando o texto
4. Usuario clica no Input para digitar
5. **`mousedown` dispara PRIMEIRO no `document`** (listener global)
6. `handleMouseDown` executa `setSelectedText(null)`
7. Painel desaparece

**Causa:** O listener estava em `document`, entao **qualquer clique em qualquer lugar** limpava a selecao - incluindo cliques no FieldEditorPanel.

---

## Fix Aplicado (Curto Prazo)

Modificado o listener para só limpar quando clique for DENTRO do container do documento:

```typescript
const handleMouseDown = (event: MouseEvent) => {
  const container = options.containerRef?.current;
  // So limpa se o clique for DENTRO do container do documento
  if (container && container.contains(event.target as Node)) {
    setSelection(null);
    options.onSelectionChange?.call(null, null);
  }
};
```

**Commit:** (sera feito apos este documento)

---

## Analise Tecnica do Sistema de Selecao

### Tech Stack Atual:

| Aspecto | Estado Atual | Avaliacao |
|---------|--------------|-----------|
| **React 18** | Moderno | OK |
| **Zustand** | Excelente state management | OK |
| **TypeScript** | Tipagem forte | OK |
| **Selecao de Texto** | `window.getSelection()` nativo | **Fraco - tech debt** |

### Gaps na Abordagem Atual:

1. **Dependencia total de API nativa** - `window.getSelection()` e simples mas fragil:
   - Selecao perdida em qualquer clique
   - Nao persiste entre interacoes
   - Nao funciona bem com UI fora do container
   - Dificil de estender para funcionalidades avancadas

2. **Arquitetura de eventos fragil:**
   - Listeners em `document` sao muito amplos
   - Facil introduzir bugs de interacao
   - Dificil de debugar

3. **Sem modelo de documento:**
   - Texto e tratado como string simples
   - Posicoes calculadas manualmente
   - Nao ha conceito de "documento" rico

---

## Alternativas Robustas (Future-Proof)

### Opcao 1: TipTap (Recomendado)

**O que e:** Framework de editor moderno baseado em ProseMirror

**Vantagens:**
- Modelo de documento estruturado
- Selecao persistente e gerenciada
- Extensoes para highlighting, marcacoes, etc.
- API React moderna
- Comunidade ativa
- Usado por Notion, GitLab, etc.

**Desvantagens:**
- Curva de aprendizado
- Bundle size maior
- Refatoracao significativa

### Opcao 2: Slate.js

**O que e:** Framework de editor customizavel

**Vantagens:**
- Muito flexivel
- Bom para casos especificos
- Model-driven

**Desvantagens:**
- API mais complexa
- Menos plugins prontos

### Opcao 3: Rangy

**O que e:** Biblioteca especializada em selecao

**Vantagens:**
- Focada em selecao de texto
- Menor que editores completos

**Desvantagens:**
- Projeto menos ativo
- Ainda depende de DOM nativo

---

## Recomendacao: Migrar para TipTap

### Por que TipTap:

1. **Future-proof:** Baseado em ProseMirror que e a base de muitos editores profissionais
2. **Selecao robusta:** Gerenciada pelo editor, nao pelo browser
3. **Extensibilidade:** Podemos criar extensao customizada para field annotations
4. **Integracao React:** `@tiptap/react` oferece hooks e componentes prontos
5. **Performance:** Rendering otimizado, virtual DOM interno

### Impacto da Migracao:

| Componente | Impacto |
|------------|---------|
| `useTextSelection.ts` | Sera substituido por TipTap hooks |
| `DocumentViewer.tsx` | Refatorado para usar TipTap editor |
| `FieldAnnotation.tsx` | Vira uma TipTap Mark extension |
| `documentStore.ts` | Adaptar para TipTap state |

### Estimativa:

- **Complexidade:** Media-Alta
- **Arquivos afetados:** ~5-8 componentes
- **Beneficio:** Resolve classe inteira de bugs + habilita features futuras

---

## Proximos Passos

1. [x] Fix de curto prazo aplicado (scoped listener)
2. [ ] Criar branch `feat/tiptap-integration`
3. [ ] Prototipo com TipTap basico
4. [ ] Criar extensao para field annotations
5. [ ] Migrar DocumentViewer
6. [ ] Testes E2E

---

*Documento criado como referencia para decisao arquitetural*
