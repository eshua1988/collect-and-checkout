import { useState } from 'react';
import { FormData, FormResponse } from '@/types/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormFieldComponent } from './FormField';
import { PaymentSelector } from './PaymentSelector';
import { ArrowRight, Check, Edit3 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface FormPreviewProps {
  form: FormData;
  onUpdateCompletionMessage?: (message: string) => void;
}

type FormStage = 'filling' | 'payment' | 'complete';

export function FormPreview({ form, onUpdateCompletionMessage }: FormPreviewProps) {
  const [responses, setResponses] = useState<FormResponse>({});
  const [stage, setStage] = useState<FormStage>('filling');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState(form.completionMessage);
  const { t } = useLanguage();

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePaymentChange = (amount: number) => {
    setTotalAmount(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.paymentEnabled && totalAmount > 0) {
      setStage('payment');
    } else {
      setStage('complete');
    }
  };

  const handlePaymentComplete = () => {
    setStage('complete');
  };

  const handleSaveMessage = () => {
    setIsEditingMessage(false);
    if (onUpdateCompletionMessage) {
      onUpdateCompletionMessage(editedMessage);
    }
  };

  if (stage === 'payment') {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <PaymentSelector amount={totalAmount} onPaymentComplete={handlePaymentComplete} />
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
        <Card variant="form" className="max-w-md w-full animate-scale-in">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            
            {isEditingMessage ? (
              <div className="space-y-4">
                <Textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  rows={4}
                  className="text-center"
                />
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setIsEditingMessage(false)}>
                    {t('complete.cancel')}
                  </Button>
                  <Button onClick={handleSaveMessage}>{t('complete.save')}</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-lg text-foreground whitespace-pre-wrap">
                  {editedMessage}
                </p>
                {onUpdateCompletionMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsEditingMessage(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('complete.editMessage')}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <Card variant="form" className="overflow-hidden">
          {form.headerImage && (
            <div className="w-full h-48 overflow-hidden">
              <img
                src={form.headerImage}
                alt="Header"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardHeader variant="form">
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-primary-foreground/80">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {form.fields.map((field) => (
              <div key={field.id} className="animate-fade-in">
                <FormFieldComponent
                  field={field}
                  value={responses[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  onPaymentChange={field.type === 'payment' ? handlePaymentChange : undefined}
                />
              </div>
            ))}

            {form.paymentEnabled && totalAmount > 0 && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('preview.totalToPay')}</span>
                  <span className="text-2xl font-bold text-primary animate-pulse-soft">
                    {totalAmount.toFixed(2)} PLN
                  </span>
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" variant="formAction">
              {form.paymentEnabled && totalAmount > 0 ? (
                <>
                  {t('preview.goToPayment')}
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                t('preview.submit')
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
