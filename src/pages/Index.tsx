import { useState } from 'react';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { FormSettings } from '@/components/FormBuilder/FormSettings';
import { FieldTypeSelector } from '@/components/FormBuilder/FieldTypeSelector';
import { FieldEditor } from '@/components/FormBuilder/FieldEditor';
import { FormPreview } from '@/components/FormPreview/FormPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Settings, Plus, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const {
    form,
    updateFormMeta,
    addField,
    updateField,
    removeField,
    moveField,
    addPaymentField,
    updatePaymentField,
    removePaymentField,
    resetForm,
  } = useFormBuilder();

  const [activeTab, setActiveTab] = useState('builder');

  const handleSaveForm = () => {
    // In a real app, this would save to a database
    localStorage.setItem('savedForm', JSON.stringify(form));
    toast.success('Formularz zapisany!');
  };

  const handleLoadForm = () => {
    const saved = localStorage.getItem('savedForm');
    if (saved) {
      const parsed = JSON.parse(saved);
      updateFormMeta(parsed);
      toast.success('Formularz wczytany!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">FormBuilder</h1>
              <p className="text-xs text-muted-foreground">z płatnościami</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadForm}>
              Wczytaj
            </Button>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <Trash2 className="w-4 h-4 mr-1" />
              Wyczyść
            </Button>
            <Button size="sm" onClick={handleSaveForm}>
              Zapisz
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="builder" className="gap-2">
              <Settings className="w-4 h-4" />
              Edytor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Podgląd
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="max-w-3xl mx-auto">
            {/* Form Settings */}
            <FormSettings form={form} onUpdate={updateFormMeta} />

            {/* Add Field */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Dodaj pole
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldTypeSelector onAddField={addField} />
              </CardContent>
            </Card>

            {/* Fields List */}
            <div className="space-y-4">
              {form.fields.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p className="text-lg mb-2">Brak pól w formularzu</p>
                    <p className="text-sm">
                      Dodaj pola używając przycisków powyżej
                    </p>
                  </CardContent>
                </Card>
              ) : (
                form.fields.map((field) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                    onMove={(direction) => moveField(field.id, direction)}
                    onAddPaymentField={
                      field.type === 'payment'
                        ? (pf) => addPaymentField(field.id, pf)
                        : undefined
                    }
                    onUpdatePaymentField={
                      field.type === 'payment'
                        ? (pfId, updates) => updatePaymentField(field.id, pfId, updates)
                        : undefined
                    }
                    onRemovePaymentField={
                      field.type === 'payment'
                        ? (pfId) => removePaymentField(field.id, pfId)
                        : undefined
                    }
                  />
                ))
              )}
            </div>

            {/* Summary */}
            {form.fields.length > 0 && (
              <Card className="mt-6 bg-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Pól: <strong>{form.fields.length}</strong>
                    </span>
                    <span>
                      Płatność:{' '}
                      <strong className={form.paymentEnabled ? 'text-success' : 'text-muted-foreground'}>
                        {form.paymentEnabled ? 'Włączona' : 'Wyłączona'}
                      </strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview">
            <FormPreview
              form={form}
              onUpdateCompletionMessage={(message) =>
                updateFormMeta({ completionMessage: message })
              }
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
