import { FormField, FieldOption, PaymentField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCustomFieldTypes } from '@/components/AIAssistant/useAIAssistant';

interface FieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onAddPaymentField?: (paymentField: PaymentField) => void;
  onUpdatePaymentField?: (paymentFieldId: string, updates: Partial<PaymentField>) => void;
  onRemovePaymentField?: (paymentFieldId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function FieldEditor({
  field,
  onUpdate,
  onRemove,
  onMove,
  onAddPaymentField,
  onUpdatePaymentField,
  onRemovePaymentField,
}: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useLanguage();

  const getFieldTypeName = (type: FormField['type']): string => {
    const names: Record<string, string> = {
      text: t('field.text'),
      textarea: t('field.textarea'),
      number: t('field.number'),
      email: t('field.email'),
      phone: t('field.phone'),
      select: t('field.select'),
      radio: t('field.radio'),
      checkbox: t('field.checkbox'),
      image: t('field.image'),
      dynamicNumber: t('field.dynamicNumber'),
      payment: t('field.payment'),
    };
    if (names[type]) return names[type];
    const custom = getCustomFieldTypes()[type];
    return custom ? `${custom.icon || '📝'} ${custom.label}` : type;
  };

  const addOption = () => {
    const newOption: FieldOption = {
      id: generateId(),
      label: `Option ${(field.options?.length || 0) + 1}`,
      value: 0,
    };
    onUpdate({ options: [...(field.options || []), newOption] });
  };

  const updateOption = (optionId: string, updates: Partial<FieldOption>) => {
    onUpdate({
      options: field.options?.map((opt) =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ),
    });
  };

  const removeOption = (optionId: string) => {
    onUpdate({
      options: field.options?.filter((opt) => opt.id !== optionId),
    });
  };

  const handleAddPaymentField = (type: PaymentField['type']) => {
    if (!onAddPaymentField) return;
    
    const newPaymentField: PaymentField = {
      id: generateId(),
      type,
      label: `${type} field`,
      multiplier: 1,
    };
    
    if (type === 'select' || type === 'radio') {
      newPaymentField.options = [
        { id: generateId(), label: 'Option 1', value: 0 },
      ];
    }
    
    onAddPaymentField(newPaymentField);
  };

  return (
    <Card variant="field" className="animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {getFieldTypeName(field.type)}
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={() => onMove('up')}>
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMove('down')}>
          <ChevronDown className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{t('editor.fieldLabel')}</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={t('editor.fieldLabel')}
            className="mt-1"
          />
        </div>

        {(field.type === 'text' || field.type === 'textarea' || field.type === 'number' || field.type === 'email' || field.type === 'phone') && (
          <div>
            <Label>{t('editor.placeholder')}</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder={t('editor.placeholderText')}
              className="mt-1"
            />
          </div>
        )}

        {field.type === 'image' && (
          <div>
            <Label>{t('editor.imageUrl')}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={field.imageUrl || ''}
                onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              <Button variant="outline" size="icon">
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
            {field.imageUrl && (
              <img
                src={field.imageUrl}
                alt="Preview"
                className="mt-2 rounded-lg max-h-32 object-cover"
              />
            )}
          </div>
        )}

        {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
          <div>
            <Label>{t('editor.options')}</Label>
            <div className="space-y-2 mt-2">
              {field.options?.map((option) => (
                <div key={option.id} className="flex gap-2 items-center">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(option.id, { label: e.target.value })}
                    placeholder={t('editor.optionLabel')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={option.value}
                    onChange={(e) => updateOption(option.id, { value: Number(e.target.value) })}
                    placeholder={t('editor.value')}
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="w-4 h-4 mr-2" />
                {t('editor.addOption')}
              </Button>
            </div>
          </div>
        )}

        {field.type === 'dynamicNumber' && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t('editor.dynamicInfo')}
            </p>
          </div>
        )}

        {field.type === 'payment' && (
          <div className="space-y-4">
            <div>
              <Label>{t('editor.baseAmount')}</Label>
              <Input
                type="number"
                value={field.baseAmount || 0}
                onChange={(e) => onUpdate({ baseAmount: Number(e.target.value) })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="mb-2 block">{t('editor.fieldsForSum')}</Label>
              <div className="space-y-3">
                {field.paymentFields?.map((pf) => (
                  <PaymentFieldEditor
                    key={pf.id}
                    paymentField={pf}
                    onUpdate={(updates) => onUpdatePaymentField?.(pf.id, updates)}
                    onRemove={() => onRemovePaymentField?.(pf.id)}
                  />
                ))}
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentField('number')}
                >
                  {t('editor.addNumber')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentField('select')}
                >
                  {t('editor.addList')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentField('radio')}
                >
                  {t('editor.addChoice')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentField('dynamicNumber')}
                >
                  {t('editor.addDynamic')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generic editor for custom AI-registered field types */}
        {!['text', 'textarea', 'number', 'email', 'phone', 'select', 'radio', 'checkbox', 'image', 'dynamicNumber', 'payment'].includes(field.type) && (() => {
          const customMeta = getCustomFieldTypes()[field.type];
          return (
            <>
              {customMeta && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-lg">{customMeta.icon || '📝'}</span>
                  <div>
                    <p className="text-xs font-medium">{customMeta.label}</p>
                    {customMeta.description && <p className="text-xs text-muted-foreground">{customMeta.description}</p>}
                  </div>
                </div>
              )}
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  placeholder={`Подсказка для поля ${field.type}`}
                  className="mt-1"
                />
              </div>
            </>
          );
        })()}

        <div className="flex items-center gap-2">
          <Switch
            id={`required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label htmlFor={`required-${field.id}`}>{t('editor.requiredField')}</Label>
        </div>
      </div>
    </Card>
  );
}

function PaymentFieldEditor({
  paymentField,
  onUpdate,
  onRemove,
}: {
  paymentField: PaymentField;
  onUpdate: (updates: Partial<PaymentField>) => void;
  onRemove: () => void;
}) {
  const generateId = () => Math.random().toString(36).substring(2, 9);
  const { t } = useLanguage();

  const addOption = () => {
    const newOption: FieldOption = {
      id: generateId(),
      label: `Option ${(paymentField.options?.length || 0) + 1}`,
      value: 0,
    };
    onUpdate({ options: [...(paymentField.options || []), newOption] });
  };

  const updateOption = (optionId: string, updates: Partial<FieldOption>) => {
    onUpdate({
      options: paymentField.options?.map((opt) =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ),
    });
  };

  const removeOption = (optionId: string) => {
    onUpdate({
      options: paymentField.options?.filter((opt) => opt.id !== optionId),
    });
  };

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {paymentField.type}
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          value={paymentField.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder={t('editor.fieldName')}
        />

        {paymentField.type === 'number' && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">{t('editor.multiplier')}</Label>
            <Input
              type="number"
              value={paymentField.multiplier || 1}
              onChange={(e) => onUpdate({ multiplier: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">PLN</span>
          </div>
        )}

        {(paymentField.type === 'select' || paymentField.type === 'radio') && (
          <div className="space-y-2">
            {paymentField.options?.map((option) => (
              <div key={option.id} className="flex gap-2 items-center">
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(option.id, { label: e.target.value })}
                  placeholder={t('editor.optionLabel')}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={option.value}
                  onChange={(e) => updateOption(option.id, { value: Number(e.target.value) })}
                  placeholder="PLN"
                  className="w-20"
                />
                <Button variant="ghost" size="icon" onClick={() => removeOption(option.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="w-3 h-3 mr-1" />
              {t('editor.add')}
            </Button>
          </div>
        )}

        {paymentField.type === 'dynamicNumber' && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">{t('editor.costPerField')}</Label>
            <Input
              type="number"
              value={paymentField.multiplier || 1}
              onChange={(e) => onUpdate({ multiplier: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">PLN</span>
          </div>
        )}
      </div>
    </div>
  );
}
