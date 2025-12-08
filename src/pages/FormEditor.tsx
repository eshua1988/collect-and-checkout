import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { FormSettings } from '@/components/FormBuilder/FormSettings';
import { FieldTypeSelector } from '@/components/FormBuilder/FieldTypeSelector';
import { FieldEditor } from '@/components/FormBuilder/FieldEditor';
import { FormPreview } from '@/components/FormPreview/FormPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Settings, Plus, FileText, ArrowLeft, Copy, Link, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FormData } from '@/types/form';

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultForm: FormData = {
  id: generateId(),
  title: 'Новая форма',
  description: '',
  fields: [],
  completionMessage: 'Спасибо за заполнение формы!',
  paymentEnabled: false,
  totalAmount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  published: false,
};

const FormEditor = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getForm, saveForm, togglePublish } = useFormsStorage();
  const { t } = useLanguage();
  
  const isNew = formId === 'new';
  const existingForm = !isNew ? getForm(formId!) : undefined;
  
  const {
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
  } = useFormBuilder(existingForm || { ...defaultForm, id: generateId() });

  const [activeTab, setActiveTab] = useState('builder');

  useEffect(() => {
    if (existingForm) {
      setForm(existingForm);
    }
  }, [formId]);

  const handleSave = () => {
    saveForm(form);
    toast.success(t('form.saved'));
    if (isNew) {
      navigate(`/form/${form.id}`, { replace: true });
    }
  };

  const handlePublish = () => {
    saveForm(form);
    const updatedForm = togglePublish(form.id);
    if (updatedForm?.published) {
      const url = `${window.location.origin}/f/${form.id}`;
      navigator.clipboard.writeText(url);
      toast.success(t('home.linkCopied'));
    } else {
      toast.info(t('home.formUnpublished'));
    }
    setForm(prev => ({ ...prev, published: !prev.published }));
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/f/${form.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t('home.linkCopied'));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{isNew ? t('editor.newForm') : form.title}</h1>
              <p className="text-xs text-muted-foreground">{t('header.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {!isNew && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/form/${form.id}/results`)}>
                <BarChart3 className="w-4 h-4 mr-1" />
                {t('home.results')}
              </Button>
            )}
            {form.published && (
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-1" />
                {t('home.copyLink')}
              </Button>
            )}
            <Button 
              variant={form.published ? "outline" : "default"} 
              size="sm" 
              onClick={handlePublish}
            >
              <Link className="w-4 h-4 mr-1" />
              {form.published ? t('home.unpublish') : t('home.publish')}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t('header.save')}
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
              {t('tabs.editor')}
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              {t('tabs.preview')}
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
                  {t('editor.addField')}
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
                    <p className="text-lg mb-2">{t('form.noFields')}</p>
                    <p className="text-sm">{t('form.addFieldsHint')}</p>
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
                      {t('form.fields')} <strong>{form.fields.length}</strong>
                    </span>
                    <span>
                      {t('form.payment')}{' '}
                      <strong className={form.paymentEnabled ? 'text-success' : 'text-muted-foreground'}>
                        {form.paymentEnabled ? t('form.enabled') : t('form.disabled')}
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

export default FormEditor;