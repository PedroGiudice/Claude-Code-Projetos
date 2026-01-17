import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { useEffect, useRef } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { FieldAnnotationMark } from '@/extensions/FieldAnnotationMark';
import { FileText } from 'lucide-react';
import type { FieldAnnotation } from '@/types';
import type { Editor, JSONContent } from '@tiptap/core';

// Convert paragraphs array to TipTap JSON content
function paragraphsToTipTapContent(paragraphs: string[]): JSONContent {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    })),
  };
}

// Calculate absolute position from paragraph index and local offset
function getAbsolutePosition(editor: Editor, paragraphIndex: number, localOffset: number): number {
  const { doc } = editor.state;
  let pos = 0;

  doc.forEach((node, nodePos, index) => {
    if (index < paragraphIndex) {
      pos = nodePos + node.nodeSize;
    } else if (index === paragraphIndex) {
      // Position within paragraph: nodePos + 1 (paragraph opening) + localOffset
      pos = nodePos + 1 + localOffset;
    }
  });

  return pos;
}

// Get paragraph index and local offset from absolute position
function getLocalPosition(
  editor: Editor,
  absolutePos: number
): { paragraphIndex: number; localOffset: number } {
  const { doc } = editor.state;
  const $pos = doc.resolve(absolutePos);

  // Get the paragraph node index
  const paragraphIndex = $pos.index(0);

  // Calculate local offset within the paragraph
  // $pos.parentOffset gives us the offset within the immediate parent
  const paragraphStart = $pos.start(1);
  const localOffset = absolutePos - paragraphStart;

  return { paragraphIndex, localOffset };
}

// Sync annotations to editor marks
function syncAnnotationsToEditor(editor: Editor, annotations: FieldAnnotation[]): void {
  const { tr, schema } = editor.state;
  const markType = schema.marks.fieldAnnotation;

  if (!markType) return;

  // First, remove all existing fieldAnnotation marks
  editor.state.doc.descendants((node, pos) => {
    node.marks.forEach((mark) => {
      if (mark.type === markType) {
        tr.removeMark(pos, pos + node.nodeSize, markType);
      }
    });
  });

  // Then add marks for each annotation
  annotations.forEach((ann) => {
    const from = getAbsolutePosition(editor, ann.paragraphIndex, ann.start);
    const to = getAbsolutePosition(editor, ann.paragraphIndex, ann.end);

    tr.addMark(
      from,
      to,
      markType.create({
        fieldName: ann.fieldName,
        color: ann.color,
      })
    );
  });

  // Dispatch the transaction
  editor.view.dispatch(tr);
}

export function TipTapDocumentViewer() {
  const paragraphs = useDocumentStore((state) => state.paragraphs);
  const textContent = useDocumentStore((state) => state.textContent);
  const setSelectedText = useDocumentStore((state) => state.setSelectedText);
  const annotations = useDocumentStore((state) => state.annotations);
  // TODO: Implement pattern detection highlighting with TipTap marks
  // const detectedPatterns = useDocumentStore((state) => state.detectedPatterns);

  // Track if we're syncing to avoid update loops
  const isSyncing = useRef(false);

  // TipTap selection fix: editable:true allows smooth selection
  // We use keyboard/paste/drop handlers to prevent actual editing while keeping selection UX
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, FieldAnnotationMark],
    content: paragraphsToTipTapContent(paragraphs),
    editable: true, // Enable for better selection UX
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none select-text',
      },
      handleKeyDown: () => true, // Block all keyboard input
      handlePaste: () => true, // Block paste
      handleDrop: () => true, // Block drag-drop
    },
    onSelectionUpdate: ({ editor }) => {
      if (isSyncing.current) return;

      const { from, to, empty } = editor.state.selection;

      // Only update selection if user made an actual selection
      // Don't clear on empty - let explicit actions (Escape, create field) clear it
      if (empty) {
        return;
      }

      const text = editor.state.doc.textBetween(from, to);
      const fromPos = getLocalPosition(editor, from);
      const toPos = getLocalPosition(editor, to);

      // Validate same paragraph - cross-paragraph selections not supported
      if (fromPos.paragraphIndex !== toPos.paragraphIndex) {
        // Cross-paragraph selection - ignore
        return;
      }

      // Calculate global position in textContent based on paragraph structure
      // textContent = paragraphs.join("\n\n"), so we need:
      //   globalStart = sum of (paragraph[i].length + 2) for i < paragraphIndex
      //                 + localOffset within the paragraph
      const selectedText = text;

      // Calculate exact global start position from paragraph structure
      let globalStart = 0;
      for (let i = 0; i < fromPos.paragraphIndex; i++) {
        globalStart += paragraphs[i].length + 2; // +2 for "\n\n" separator
      }
      // Add local offset within the paragraph
      globalStart += fromPos.localOffset;

      const globalEnd = globalStart + selectedText.length;

      // VALIDATION: Verify the calculated position matches the selected text
      const textAtPosition = textContent.slice(globalStart, globalEnd);
      if (textAtPosition !== selectedText) {
        // Position mismatch - log details for debugging
        console.error('[DEBUG] Position validation failed!');
        console.error('[DEBUG] paragraphIndex:', fromPos.paragraphIndex);
        console.error('[DEBUG] localOffset:', fromPos.localOffset);
        console.error('[DEBUG] Calculated globalStart:', globalStart);
        console.error('[DEBUG] Expected text:', selectedText);
        console.error('[DEBUG] Got text at position:', textAtPosition);
        console.error(
          '[DEBUG] textContent preview at position:',
          textContent.slice(Math.max(0, globalStart - 20), globalStart + 50)
        );

        // Fallback: try indexOf as last resort
        const fallbackStart = textContent.indexOf(selectedText);
        if (fallbackStart !== -1) {
          console.warn('[DEBUG] Using indexOf fallback, position:', fallbackStart);
          // Note: This may be wrong if text appears multiple times
        }
        return; // Don't set invalid selection
      }

      setSelectedText({
        text: selectedText,
        start: globalStart,
        end: globalEnd,
        paragraphIndex: fromPos.paragraphIndex,
      });
    },
  });

  // Update editor content when paragraphs change
  useEffect(() => {
    if (!editor || paragraphs.length === 0) return;

    isSyncing.current = true;
    editor.commands.setContent(paragraphsToTipTapContent(paragraphs));
    isSyncing.current = false;
  }, [editor, paragraphs]);

  // Sync annotations to editor when they change
  useEffect(() => {
    if (!editor || isSyncing.current) return;

    // Small delay to ensure editor is ready
    const timeout = setTimeout(() => {
      isSyncing.current = true;
      syncAnnotationsToEditor(editor, annotations);
      isSyncing.current = false;
    }, 0);

    return () => clearTimeout(timeout);
  }, [editor, annotations]);

  // Keyboard shortcut: Escape to cancel selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedText(null);
        editor?.commands.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSelectedText, editor]);

  // Empty state
  if (paragraphs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <FileText className="w-16 h-16 text-gh-text-secondary mb-4" />
        <h3 className="text-lg font-semibold text-gh-text-primary mb-2">No Document Loaded</h3>
        <p className="text-sm text-gh-text-secondary max-w-md">
          Upload a .docx document to start creating your template. Select text to create field
          annotations.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-8 py-6 bg-gh-bg-primary">
        <div className="max-w-4xl mx-auto">
          <EditorContent
            editor={editor}
            className="min-h-full [&_.ProseMirror]:min-h-full [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:text-gh-text-primary [&_.ProseMirror_p]:leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}

export default TipTapDocumentViewer;
