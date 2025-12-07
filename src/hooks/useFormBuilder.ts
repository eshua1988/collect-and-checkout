import { useState, useCallback } from 'react';
import { FormData, FormField, FieldType, PaymentField } from '@/types/form';

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultForm: FormData = {
  id: generateId(),
  title: 'Nowy formularz',
  description: 'Opis formularza',
  fields: [],
  completionMessage: 'Dziękujemy za wypełnienie formularza!',
  paymentEnabled: false,
  totalAmount: 0,
};

export function useFormBuilder(initialForm?: FormData) {
  const [form, setForm] = useState<FormData>(initialForm || defaultForm);

  const updateFormMeta = useCallback((updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const addField = useCallback((type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: getDefaultLabel(type),
      required: false,
      placeholder: '',
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = [
        { id: generateId(), label: 'Opcja 1', value: 0 },
        { id: generateId(), label: 'Opcja 2', value: 0 },
      ];
    }

    if (type === 'payment') {
      newField.baseAmount = 0;
      newField.paymentFields = [];
    }

    if (type === 'dynamicNumber') {
      newField.dynamicFieldsCount = 0;
    }

    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
      paymentEnabled: type === 'payment' ? true : prev.paymentEnabled,
    }));
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setForm((prev) => {
      const field = prev.fields.find((f) => f.id === fieldId);
      return {
        ...prev,
        fields: prev.fields.filter((f) => f.id !== fieldId),
        paymentEnabled: field?.type === 'payment' ? false : prev.paymentEnabled,
      };
    });
  }, []);

  const moveField = useCallback((fieldId: string, direction: 'up' | 'down') => {
    setForm((prev) => {
      const index = prev.fields.findIndex((f) => f.id === fieldId);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prev.fields.length - 1)
      ) {
        return prev;
      }

      const newFields = [...prev.fields];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

      return { ...prev, fields: newFields };
    });
  }, []);

  const addPaymentField = useCallback((fieldId: string, paymentField: PaymentField) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              paymentFields: [...(field.paymentFields || []), paymentField],
            }
          : field
      ),
    }));
  }, []);

  const updatePaymentField = useCallback(
    (fieldId: string, paymentFieldId: string, updates: Partial<PaymentField>) => {
      setForm((prev) => ({
        ...prev,
        fields: prev.fields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                paymentFields: field.paymentFields?.map((pf) =>
                  pf.id === paymentFieldId ? { ...pf, ...updates } : pf
                ),
              }
            : field
        ),
      }));
    },
    []
  );

  const removePaymentField = useCallback((fieldId: string, paymentFieldId: string) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              paymentFields: field.paymentFields?.filter((pf) => pf.id !== paymentFieldId),
            }
          : field
      ),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(defaultForm);
  }, []);

  return {
    form,
    setForm,
    updateFormMeta,
    addField,
    updateField,
    removeField,
    moveField,
    addPaymentField,
    updatePaymentField,
    removePaymentField,
    resetForm,
  };
}

function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Pole tekstowe',
    textarea: 'Długi tekst',
    number: 'Liczba',
    email: 'Email',
    phone: 'Telefon',
    select: 'Lista rozwijana',
    radio: 'Wybór jednokrotny',
    checkbox: 'Wybór wielokrotny',
    image: 'Obrazek',
    dynamicNumber: 'Liczba z polami dynamicznymi',
    payment: 'Płatność',
  };
  return labels[type];
}
