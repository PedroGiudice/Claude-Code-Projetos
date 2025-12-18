import React, { useState } from 'react';
import { Edit2, Trash2, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useDocumentStore } from '@/store/documentStore';

export function AnnotationList() {
  const { annotations, removeAnnotation } = useAnnotations();
  const saveTemplate = useDocumentStore(state => state.saveTemplate);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await saveTemplate(templateName);
      setIsSaveModalOpen(false);
      setTemplateName('');
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col"> {/* Removed background and border */}
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#3f3f46]"> {/* Updated border color */}
        <h2 className="text-lg font-semibold text-[#e4e4e7] flex items-center gap-2"> {/* Updated primary text color */}
          <FileText className="w-5 h-5" />
          Annotations
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1"> {/* Updated secondary text color */}
          {annotations.length} field{annotations.length !== 1 ? 's' : ''} created
        </p>
      </div>

      {/* Annotation list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {annotations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#a1a1aa]">
              No annotations yet. Select text in the document to create fields.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {annotations.map(annotation => (
              <div
                key={annotation.fieldName}
                className="bg-[#1e1e2e] border border-[#3f3f46] rounded-lg p-3 hover:border-[#3b82f6] transition-colors" // Updated background, border, and hover border
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <code className="text-sm font-mono text-[#3b82f6]"> {/* Updated accent color */}
                    {annotation.fieldName}
                  </code>
                  <button
                    onClick={() => removeAnnotation(annotation.fieldName)}
                    className="text-[#a1a1aa] hover:text-[#ef4444] transition-colors" // Updated text and hover error colors
                    aria-label={`Delete ${annotation.fieldName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#a1a1aa] line-clamp-2"> {/* Updated secondary text color */}
                  "{annotation.text}"
                </p>
                <p className="text-xs text-[#a1a1aa] mt-1"> {/* Updated secondary text color */}
                  Paragraph {annotation.paragraphIndex + 1}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Save button */}
      {annotations.length > 0 && (
        <div className="px-4 py-4 border-t border-[#3f3f46]"> {/* Updated border color */}
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setIsSaveModalOpen(true)}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      )}

      {/* Save Template Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => !isSaving && setIsSaveModalOpen(false)}
        title="Save Template"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsSaveModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <Input
          label="Template Name"
          placeholder="e.g., Contrato de Prestação de Serviços"
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && templateName.trim() && !isSaving) {
              handleSaveTemplate();
            }
          }}
          autoFocus
        />
      </Modal>
    </div>
  );
}
