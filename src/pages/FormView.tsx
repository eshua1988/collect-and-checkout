import { useParams } from 'react-router-dom';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { FormPreview } from '@/components/FormPreview/FormPreview';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';
import { FormData, FormResponse } from '@/types/form';

const sendTelegramNotification = async (
  form: FormData,
  responses: FormResponse,
  paymentAmount?: number,
  paymentMethod?: string
) => {
  if (!form.telegramBotToken || !form.telegramChatId) return;

  const fieldLabels: Record<string, string> = {};
  form.fields.forEach((f) => { fieldLabels[f.id] = f.label; });

  const lines: string[] = [
    `📋 *Новый ответ на форму: ${form.title}*`,
    `🕐 ${new Date().toLocaleString('ru-RU')}`,
    '',
  ];

  Object.entries(responses).forEach(([fieldId, value]) => {
    const label = fieldLabels[fieldId] || fieldId;
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    if (displayValue) lines.push(`*${label}:* ${displayValue}`);
  });

  if (paymentAmount && paymentAmount > 0) {
    lines.push('');
    lines.push(`💳 *Сумма к оплате:* ${paymentAmount.toFixed(2)} PLN`);
    if (paymentMethod) lines.push(`*Метод оплаты:* ${paymentMethod}`);
  }

  try {
    await fetch(`https://api.telegram.org/bot${form.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: form.telegramChatId,
        text: lines.join('\n'),
        parse_mode: 'Markdown',
      }),
    });
  } catch (e) {
    console.error('Telegram notification error:', e);
  }
};

const FormView = () => {
  const { formId } = useParams();
  const { getForm, addSubmission } = useFormsStorage();
  const { t } = useLanguage();
  
  const form = getForm(formId!);

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">{t('formView.notFound')}</h2>
            <p className="text-muted-foreground">{t('formView.notFoundDesc')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form.published) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-semibold mb-2">{t('formView.notPublished')}</h2>
            <p className="text-muted-foreground">{t('formView.notPublishedDesc')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (responses: Record<string, any>, paymentAmount?: number, paymentMethod?: string) => {
    addSubmission({
      formId: form.id,
      responses,
      paymentAmount,
      paymentMethod: paymentMethod as any,
    });
    sendTelegramNotification(form, responses, paymentAmount, paymentMethod);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-medium">{form.title}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="py-6">
        <FormPreview
          form={form}
          isPublicView
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
};

export default FormView;