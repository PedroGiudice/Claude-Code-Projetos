import { Mark, mergeAttributes } from '@tiptap/core';

export interface FieldAnnotationOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fieldAnnotation: {
      setFieldAnnotation: (attributes: { fieldName: string; color: string }) => ReturnType;
      unsetFieldAnnotation: () => ReturnType;
      removeFieldAnnotation: (fieldName: string) => ReturnType;
    };
  }
}

export const FieldAnnotationMark = Mark.create<FieldAnnotationOptions>({
  name: 'fieldAnnotation',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-field-name]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'field-annotation rounded-sm px-0.5 transition-colors cursor-pointer',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setFieldAnnotation:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetFieldAnnotation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      removeFieldAnnotation:
        (fieldName: string) =>
        ({ tr, state }) => {
          // Remove all marks with the specified fieldName
          const { doc } = state;
          let modified = false;

          doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type.name === this.name && mark.attrs.fieldName === fieldName) {
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
                modified = true;
              }
            });
          });

          return modified;
        },
    };
  },
});

export default FieldAnnotationMark;
