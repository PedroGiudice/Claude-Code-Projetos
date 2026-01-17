import type { FieldAnnotation as FieldAnnotationType } from '@/types';

interface FieldAnnotationProps {
  annotation: FieldAnnotationType;
  text: string;
}

export function FieldAnnotation({ annotation, text }: FieldAnnotationProps) {
  return (
    <span
      className="rounded-sm px-0.5 transition-colors"
      style={{
        backgroundColor: `${annotation.color}30`, // 30 = ~19% opacity in hex
        borderBottom: `2px solid ${annotation.color}`,
      }}
      title={annotation.fieldName}
    >
      {text}
    </span>
  );
}
