import React from 'react';
import { Check } from 'lucide-react';
import useTrelloStore, { CARD_FIELDS } from '../../store/trelloStore';

/**
 * FieldSelector component
 * Allows users to select which card fields to display in the table and include in exports.
 * The 'name' field is locked and always selected.
 */
export const FieldSelector: React.FC = () => {
  const { selectedFields, toggleField } = useTrelloStore();

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Campos Visíveis
      </h4>
      <div className="space-y-1">
        {CARD_FIELDS.map((field) => {
          const isSelected = selectedFields.has(field.key);
          const isLocked = field.locked;

          return (
            <label
              key={field.key}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-zinc-800'}
                ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                  ${isSelected
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-zinc-600 bg-transparent'
                  }`}
              >
                {isSelected && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => !isLocked && toggleField(field.key)}
                disabled={isLocked}
                className="sr-only"
              />
              <span className="text-sm">{field.label}</span>
              {isLocked && (
                <span className="text-[10px] text-zinc-600">(obrigatório)</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default FieldSelector;
