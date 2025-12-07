import { FormField as FormFieldType, PaymentField } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';

interface FormFieldProps {
  field: FormFieldType;
  value: any;
  onChange: (value: any) => void;
  onPaymentChange?: (amount: number) => void;
}

export function FormFieldComponent({ field, value, onChange, onPaymentChange }: FormFieldProps) {
  const [dynamicFields, setDynamicFields] = useState<string[]>([]);
  const [paymentValues, setPaymentValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (field.type === 'dynamicNumber' && typeof value === 'number') {
      setDynamicFields(Array(value).fill(''));
    }
  }, [value, field.type]);

  useEffect(() => {
    if (field.type === 'payment' && onPaymentChange) {
      calculatePayment();
    }
  }, [paymentValues]);

  const calculatePayment = () => {
    if (!field.paymentFields || !onPaymentChange) return;

    let total = field.baseAmount || 0;

    field.paymentFields.forEach((pf) => {
      const val = paymentValues[pf.id];
      if (val === undefined) return;

      if (pf.type === 'number') {
        total += (Number(val) || 0) * (pf.multiplier || 1);
      } else if (pf.type === 'select' || pf.type === 'radio') {
        const option = pf.options?.find((o) => o.id === val);
        if (option) total += option.value;
      } else if (pf.type === 'dynamicNumber') {
        total += (Number(val) || 0) * (pf.multiplier || 1);
      }
    });

    onPaymentChange(total);
  };

  const handlePaymentFieldChange = (paymentFieldId: string, val: any) => {
    setPaymentValues((prev) => ({ ...prev, [paymentFieldId]: val }));
  };

  const handleDynamicFieldChange = (index: number, val: string) => {
    const newFields = [...dynamicFields];
    newFields[index] = val;
    setDynamicFields(newFields);
    onChange({ count: value, values: newFields });
  };

  const renderLabel = () => (
    <Label className="text-base font-medium">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      );

    case 'email':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'example@email.com'}
            required={field.required}
          />
        </div>
      );

    case 'phone':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || '+48 XXX XXX XXX'}
            required={field.required}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          {renderLabel()}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz opcję" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                  {option.value > 0 && (
                    <span className="ml-2 text-muted-foreground">
                      (+{option.value} PLN)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-3">
          {renderLabel()}
          <RadioGroup value={value} onValueChange={onChange}>
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="font-normal cursor-pointer">
                  {option.label}
                  {option.value > 0 && (
                    <span className="ml-2 text-muted-foreground text-sm">
                      (+{option.value} PLN)
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-3">
          {renderLabel()}
          {field.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={(value || []).includes(option.id)}
                onCheckedChange={(checked) => {
                  const current = value || [];
                  if (checked) {
                    onChange([...current, option.id]);
                  } else {
                    onChange(current.filter((id: string) => id !== option.id));
                  }
                }}
              />
              <Label htmlFor={option.id} className="font-normal cursor-pointer">
                {option.label}
                {option.value > 0 && (
                  <span className="ml-2 text-muted-foreground text-sm">
                    (+{option.value} PLN)
                  </span>
                )}
              </Label>
            </div>
          ))}
        </div>
      );

    case 'image':
      return (
        <div className="space-y-2">
          {renderLabel()}
          {field.imageUrl && (
            <img
              src={field.imageUrl}
              alt={field.label}
              className="rounded-lg max-h-64 w-full object-cover"
            />
          )}
        </div>
      );

    case 'dynamicNumber':
      return (
        <div className="space-y-4">
          {renderLabel()}
          <Input
            type="number"
            min={0}
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder="Wprowadź liczbę"
            required={field.required}
          />
          {dynamicFields.length > 0 && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/30">
              <p className="text-sm text-muted-foreground">
                Wypełnij poniższe pola ({dynamicFields.length}):
              </p>
              {dynamicFields.map((_, index) => (
                <Input
                  key={index}
                  value={dynamicFields[index]}
                  onChange={(e) => handleDynamicFieldChange(index, e.target.value)}
                  placeholder={`Pole ${index + 1}`}
                  required
                />
              ))}
            </div>
          )}
        </div>
      );

    case 'payment':
      return (
        <div className="space-y-4">
          {renderLabel()}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
            {field.baseAmount && field.baseAmount > 0 && (
              <p className="text-sm">
                Kwota bazowa: <strong>{field.baseAmount} PLN</strong>
              </p>
            )}
            
            {field.paymentFields?.map((pf) => (
              <PaymentFieldInput
                key={pf.id}
                paymentField={pf}
                value={paymentValues[pf.id]}
                onChange={(val) => handlePaymentFieldChange(pf.id, val)}
              />
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

function PaymentFieldInput({
  paymentField,
  value,
  onChange,
}: {
  paymentField: PaymentField;
  value: any;
  onChange: (value: any) => void;
}) {
  const [dynamicValues, setDynamicValues] = useState<string[]>([]);

  useEffect(() => {
    if (paymentField.type === 'dynamicNumber' && typeof value === 'number') {
      setDynamicValues(Array(value).fill(''));
    }
  }, [value, paymentField.type]);

  switch (paymentField.type) {
    case 'number':
      return (
        <div className="space-y-2">
          <Label className="text-sm">{paymentField.label}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">
              × {paymentField.multiplier} PLN
            </span>
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label className="text-sm">{paymentField.label}</Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz" />
            </SelectTrigger>
            <SelectContent>
              {paymentField.options?.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label} (+{option.value} PLN)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          <Label className="text-sm">{paymentField.label}</Label>
          <RadioGroup value={value} onValueChange={onChange}>
            {paymentField.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={`pf-${option.id}`} />
                <Label htmlFor={`pf-${option.id}`} className="font-normal text-sm cursor-pointer">
                  {option.label} (+{option.value} PLN)
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'dynamicNumber':
      return (
        <div className="space-y-2">
          <Label className="text-sm">{paymentField.label}</Label>
          <Input
            type="number"
            min={0}
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {dynamicValues.length > 0 && (
            <div className="space-y-1 pl-3 border-l border-muted">
              {dynamicValues.map((_, i) => (
                <Input
                  key={i}
                  value={dynamicValues[i]}
                  onChange={(e) => {
                    const newVals = [...dynamicValues];
                    newVals[i] = e.target.value;
                    setDynamicValues(newVals);
                  }}
                  placeholder={`Pole ${i + 1}`}
                  className="h-8 text-sm"
                />
              ))}
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            × {paymentField.multiplier} PLN za każde
          </span>
        </div>
      );

    default:
      return null;
  }
}
