import { FormField, FieldOption, PaymentField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const addOption = () => {
    const newOption: FieldOption = {
      id: generateId(),
      label: `Opcja ${(field.options?.length || 0) + 1}`,
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
      label: `Pole ${type}`,
      multiplier: 1,
    };
    
    if (type === 'select' || type === 'radio') {
      newPaymentField.options = [
        { id: generateId(), label: 'Opcja 1', value: 0 },
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
          <Label>Etykieta pola</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Etykieta pola"
            className="mt-1"
          />
        </div>

        {(field.type === 'text' || field.type === 'textarea' || field.type === 'number' || field.type === 'email' || field.type === 'phone') && (
          <div>
            <Label>Placeholder</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Tekst podpowiedzi"
              className="mt-1"
            />
          </div>
        )}

        {field.type === 'image' && (
          <div>
            <Label>URL obrazka</Label>
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
            <Label>Opcje</Label>
            <div className="space-y-2 mt-2">
              {field.options?.map((option) => (
                <div key={option.id} className="flex gap-2 items-center">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(option.id, { label: e.target.value })}
                    placeholder="Etykieta opcji"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={option.value}
                    onChange={(e) => updateOption(option.id, { value: Number(e.target.value) })}
                    placeholder="Wartość"
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
                Dodaj opcję
              </Button>
            </div>
          </div>
        )}

        {field.type === 'dynamicNumber' && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Użytkownik wpisze liczbę, a następnie pojawi się tyle pól tekstowych ile wpisał.
              Wszystkie pola będą obowiązkowe.
            </p>
          </div>
        )}

        {field.type === 'payment' && (
          <div className="space-y-4">
            <div>
              <Label>Kwota bazowa (PLN)</Label>
              <Input
                type="number"
                value={field.baseAmount || 0}
                onChange={(e) => onUpdate({ baseAmount: Number(e.target.value) })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="mb-2 block">Pola do obliczenia sumy</Label>
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
                  + Liczba
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentField('select')}
                >
                  + Lista
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentField('radio')}
                >
                  + Wybór
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentField('dynamicNumber')}
                >
                  + Dynamiczne
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Switch
            id={`required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label htmlFor={`required-${field.id}`}>Pole obowiązkowe</Label>
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

  const addOption = () => {
    const newOption: FieldOption = {
      id: generateId(),
      label: `Opcja ${(paymentField.options?.length || 0) + 1}`,
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
          placeholder="Nazwa pola"
        />

        {paymentField.type === 'number' && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">Mnożnik:</Label>
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
                  placeholder="Opcja"
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
              Dodaj
            </Button>
          </div>
        )}

        {paymentField.type === 'dynamicNumber' && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">Koszt za pole:</Label>
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

function getFieldTypeName(type: FormField['type']): string {
  const names: Record<FormField['type'], string> = {
    text: 'Tekst',
    textarea: 'Długi tekst',
    number: 'Liczba',
    email: 'Email',
    phone: 'Telefon',
    select: 'Lista rozwijana',
    radio: 'Wybór jednokrotny',
    checkbox: 'Wybór wielokrotny',
    image: 'Obrazek',
    dynamicNumber: 'Dynamiczne pola',
    payment: 'Płatność',
  };
  return names[type];
}
