# TipTap Implementation Plan - Doc Assembler

> **Branch:** `feat/tiptap-integration`
> **Data:** 2026-01-17
> **Status:** Planejamento

---

## Objetivo

Migrar o sistema de selecao de texto do Doc Assembler de `window.getSelection()` nativo para **TipTap**, um framework de editor rico baseado em ProseMirror.

### Beneficios Esperados

1. **Selecao persistente:** Gerenciada pelo editor, nao pelo browser
2. **Extensibilidade:** Marks customizadas para field annotations
3. **Eventos estruturados:** `onSelectionUpdate`, `onUpdate`
4. **Modelo de documento:** JSON estruturado em vez de strings
5. **Future-proof:** Base para features avancadas (colaboracao, AI, etc.)

---

## Pacotes Necessarios

```bash
bun add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/core
```

**Bundle size estimado:** ~50-80KB gzipped (StarterKit inclui muitas extensoes)

Para bundle minimo:
```bash
bun add @tiptap/react @tiptap/pm @tiptap/core @tiptap/extension-document @tiptap/extension-paragraph @tiptap/extension-text
```

---

## Arquitetura Proposta

### Antes (Atual)

```
DocumentViewer
  |-- useTextSelection (window.getSelection)
  |-- renderParagraph (manual string parsing)
  |-- FieldAnnotation (inline highlight)

Store: selectedText: TextSelection | null
```

### Depois (TipTap)

```
TipTapDocumentViewer
  |-- useEditor (@tiptap/react)
  |-- FieldAnnotationMark (custom Mark extension)
  |-- useEditorState (selecao reativa)

Store:
  - selectedText: {from, to, text} | null  (do TipTap selection)
  - editor: Editor | null (referencia opcional)
```

---

## Componentes a Criar

### 1. FieldAnnotationMark Extension

Custom Mark para representar field annotations com cor.

```typescript
// extensions/FieldAnnotationMark.ts
import { Mark, mergeAttributes } from '@tiptap/core'

export interface FieldAnnotationOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fieldAnnotation: {
      setFieldAnnotation: (attributes: {
        fieldName: string
        color: string
      }) => ReturnType
      unsetFieldAnnotation: () => ReturnType
    }
  }
}

export const FieldAnnotationMark = Mark.create<FieldAnnotationOptions>({
  name: 'fieldAnnotation',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      fieldName: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-field-name'),
        renderHTML: (attributes) => ({
          'data-field-name': attributes.fieldName,
        }),
      },
      color: {
        default: '#3b82f6',
        parseHTML: (element) => element.getAttribute('data-color'),
        renderHTML: (attributes) => ({
          'data-color': attributes.color,
          style: `background-color: ${attributes.color}30; border-bottom: 2px solid ${attributes.color};`,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-field-name]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'field-annotation rounded-sm px-0.5',
    }), 0]
  },

  addCommands() {
    return {
      setFieldAnnotation:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      unsetFieldAnnotation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})
```

### 2. TipTapDocumentViewer Component

```typescript
// components/document/TipTapDocumentViewer.tsx
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { useEffect } from 'react'
import { useDocumentStore } from '@/store/documentStore'
import { FieldAnnotationMark } from '@/extensions/FieldAnnotationMark'

export function TipTapDocumentViewer() {
  const paragraphs = useDocumentStore((state) => state.paragraphs)
  const setSelectedText = useDocumentStore((state) => state.setSelectedText)
  const annotations = useDocumentStore((state) => state.annotations)

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      FieldAnnotationMark,
    ],
    content: paragraphsToTipTapContent(paragraphs, annotations),
    editable: false, // Read-only, so aplicar marks via commands
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection

      if (empty) {
        setSelectedText(null)
        return
      }

      const text = editor.state.doc.textBetween(from, to)

      // Calcular paragraphIndex baseado na posicao
      const $from = editor.state.doc.resolve(from)
      const paragraphIndex = $from.index(0) // index do paragrafo

      setSelectedText({
        text,
        start: from,
        end: to,
        paragraphIndex,
      })
    },
  })

  // Sync annotations com editor
  useEffect(() => {
    if (!editor) return

    // Quando annotations mudam, re-aplicar marks
    syncAnnotationsToEditor(editor, annotations)
  }, [editor, annotations])

  if (!editor) return null

  return (
    <div className="h-full overflow-y-auto px-8 py-6 bg-gh-bg-primary">
      <div className="max-w-4xl mx-auto prose prose-invert prose-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// Helpers
function paragraphsToTipTapContent(paragraphs: string[], annotations: FieldAnnotation[]) {
  return {
    type: 'doc',
    content: paragraphs.map((text, index) => ({
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    })),
  }
}

function syncAnnotationsToEditor(editor: Editor, annotations: FieldAnnotation[]) {
  // Transaction para aplicar todas as marks
  const { tr } = editor.state

  // Remover marks existentes primeiro
  // ...

  // Aplicar novas marks
  annotations.forEach(ann => {
    // Converter posicoes de paragrafo para posicoes absolutas
    // ...
    tr.addMark(from, to, editor.schema.marks.fieldAnnotation.create({
      fieldName: ann.fieldName,
      color: ann.color,
    }))
  })

  editor.view.dispatch(tr)
}
```

### 3. Adaptar FieldEditorPanel

O FieldEditorPanel ja funciona com `selectedText` do store.
Unica mudanca: ao criar campo, usar `editor.commands.setFieldAnnotation()`.

```typescript
// No handleCreate:
const handleCreate = () => {
  if (!selectedText || !editor) return

  // Validacao...

  // Aplicar mark via TipTap
  editor.chain()
    .focus()
    .setTextSelection({ from: selectedText.start, to: selectedText.end })
    .setFieldAnnotation({ fieldName, color: getNextColor() })
    .run()

  // Adicionar ao store (sem cor, pois TipTap gerencia o render)
  addAnnotation({
    fieldName,
    text: selectedText.text,
    start: selectedText.start,
    end: selectedText.end,
    paragraphIndex: selectedText.paragraphIndex,
  })

  setSelectedText(null)
}
```

---

## Plano de Migracao

### Fase 1: Setup Basico
1. [ ] Instalar pacotes TipTap
2. [ ] Criar `FieldAnnotationMark` extension
3. [ ] Criar `TipTapDocumentViewer` componente basico
4. [ ] Testar renderizacao de texto

### Fase 2: Selecao
5. [ ] Implementar `onSelectionUpdate`
6. [ ] Adaptar store para novo formato de selecao
7. [ ] Testar que FieldEditorPanel funciona com nova selecao

### Fase 3: Annotations
8. [ ] Implementar sync de annotations para marks
9. [ ] Implementar criacao de annotation via TipTap commands
10. [ ] Testar cores funcionando

### Fase 4: Cleanup
11. [ ] Remover `useTextSelection.ts` (antigo)
12. [ ] Remover `DocumentViewer.tsx` (antigo)
13. [ ] Atualizar imports

### Fase 5: Polish
14. [ ] Testar edge cases
15. [ ] Performance profiling
16. [ ] Deploy e teste E2E

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Bundle size aumenta significativamente | Media | Medio | Usar extensoes minimas, tree-shaking |
| Performance com documentos grandes | Baixa | Alto | TipTap usa virtual rendering |
| Complexidade de posicoes (paragrafo vs absoluta) | Media | Medio | Criar helpers de conversao bem testados |
| Regressoes em features existentes | Media | Alto | Manter testes E2E, feature flag |

---

## Estimativa

| Fase | Tempo Estimado |
|------|----------------|
| Setup Basico | 2-3 horas |
| Selecao | 2-3 horas |
| Annotations | 3-4 horas |
| Cleanup | 1 hora |
| Polish | 2 horas |
| **Total** | **10-13 horas** |

---

## Alternativa: Implementacao Incremental

Se preferir abordagem mais conservadora:

1. **Manter sistema atual** com o fix aplicado
2. **Criar feature flag** `USE_TIPTAP=true`
3. **Implementar TipTap em paralelo**
4. **Testar A/B** antes de remover codigo antigo

---

## Arquivos Atuais (para referencia)

Estes arquivos serao modificados ou substituidos:

| Arquivo | Acao | Notas |
|---------|------|-------|
| `src/hooks/useTextSelection.ts` | REMOVER | Sera substituido por TipTap events |
| `src/components/document/DocumentViewer.tsx` | SUBSTITUIR | Por TipTapDocumentViewer |
| `src/components/document/FieldAnnotation.tsx` | ADAPTAR | Vira parte da Mark extension |
| `src/components/document/FieldEditorPanel.tsx` | MANTER | Pequenas adaptacoes |
| `src/store/documentStore.ts` | ADAPTAR | selectedText format muda ligeiramente |
| `src/types/index.ts` | MANTER | TextSelection type pode mudar |

## Commits Relevantes

- `babcdc8e` - Fix do bug de selecao (branch work/session-20260117-042005)
- `4117407d` - Este plano (branch feat/tiptap-integration)

## Como Iniciar Nova Sessao

```bash
# Na nova sessao, executar:
git checkout feat/tiptap-integration
cat legal-workbench/docs/TIPTAP_IMPLEMENTATION_PLAN.md
```

Depois pedir: "Implemente a Fase 1 do plano TipTap"

---

## Referencias

- [TipTap Docs](https://tiptap.dev/docs)
- [Creating Custom Marks](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new)
- [React Integration](https://tiptap.dev/docs/editor/getting-started/install/react)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)

---

*Documento criado para planejamento da migracao para TipTap*
