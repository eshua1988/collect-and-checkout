import { FieldType } from '@/types/form';
import { Button } from '@/components/ui/button';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  List,
  Circle,
  CheckSquare,
  Image,
  PlusCircle,
  CreditCard,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCustomFieldTypes } from '@/components/AIAssistant/useAIAssistant';
import { useState, useEffect } from 'react';

interface FieldTypeSelectorProps {
  onAddField: (type: FieldType) => void;
}

export function FieldTypeSelector({ onAddField }: FieldTypeSelectorProps) {
  const { t } = useLanguage();

  // Custom AI-registered field types
  const [customFields, setCustomFields] = useState(() => getCustomFieldTypes());
  useEffect(() => {
    const handler = () => setCustomFields(getCustomFieldTypes());
    window.addEventListener('customFieldTypesUpdated', handler);
    return () => window.removeEventListener('customFieldTypesUpdated', handler);
  }, []);

  const fieldTypes: { type: FieldType; labelKey: string; icon: React.ReactNode }[] = [
    { type: 'text', labelKey: 'field.text', icon: <Type className="w-4 h-4" /> },
    { type: 'textarea', labelKey: 'field.textarea', icon: <AlignLeft className="w-4 h-4" /> },
    { type: 'number', labelKey: 'field.number', icon: <Hash className="w-4 h-4" /> },
    { type: 'email', labelKey: 'field.email', icon: <Mail className="w-4 h-4" /> },
    { type: 'phone', labelKey: 'field.phone', icon: <Phone className="w-4 h-4" /> },
    { type: 'select', labelKey: 'field.select', icon: <List className="w-4 h-4" /> },
    { type: 'radio', labelKey: 'field.radio', icon: <Circle className="w-4 h-4" /> },
    { type: 'checkbox', labelKey: 'field.checkbox', icon: <CheckSquare className="w-4 h-4" /> },
    { type: 'image', labelKey: 'field.image', icon: <Image className="w-4 h-4" /> },
    { type: 'dynamicNumber', labelKey: 'field.dynamicNumber', icon: <PlusCircle className="w-4 h-4" /> },
    { type: 'payment', labelKey: 'field.payment', icon: <CreditCard className="w-4 h-4" /> },
  ];

  // Merge custom AI field types
  const allFieldTypes = [
    ...fieldTypes,
    ...Object.entries(customFields).map(([type, meta]) => ({
      type: type as FieldType,
      labelKey: meta.label, // custom types use label directly
      icon: <span className="text-sm">{meta.icon || '📝'}</span>,
      _isCustom: true,
    })),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {allFieldTypes.map(({ type, labelKey, icon, ...rest }) => (
        <Button
          key={type}
          variant="outline"
          className="flex items-center gap-2 h-auto py-3 px-4 justify-start hover:bg-primary/5 hover:border-primary/30 cursor-grab active:cursor-grabbing"
          onClick={() => onAddField(type)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/tool-config', JSON.stringify({
              category: 'form',
              type,
              label: '_isCustom' in rest ? labelKey : t(labelKey)
            }));
            e.dataTransfer.effectAllowed = 'copy';
          }}
        >
          <span className="text-primary">{icon}</span>
          <span className="text-sm">{'_isCustom' in rest ? labelKey : t(labelKey)}</span>
        </Button>
      ))}
    </div>
  );
}
