import { FormData } from '@/types/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Send, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FormSettingsProps {
  form: FormData;
  onUpdate: (updates: Partial<FormData>) => void;
}

export function FormSettings({ form, onUpdate }: FormSettingsProps) {
  const { t } = useLanguage();

  return (
    <Card variant="form" className="mb-6">
      <CardHeader variant="form">
        <CardTitle>{t('settings.title')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label>{t('settings.formTitle')}</Label>
          <Input
            value={form.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={t('settings.formTitlePlaceholder')}
            className="mt-1"
          />
        </div>

        <div>
          <Label>{t('settings.description')}</Label>
          <Textarea
            value={form.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder={t('settings.descriptionPlaceholder')}
            className="mt-1"
            rows={2}
          />
        </div>

        <div>
          <Label>{t('settings.headerImage')}</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={form.headerImage || ''}
              onChange={(e) => onUpdate({ headerImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            {form.headerImage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onUpdate({ headerImage: '' })}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {form.headerImage && (
            <img
              src={form.headerImage}
              alt="Header"
              className="mt-2 rounded-lg max-h-40 w-full object-cover"
            />
          )}
        </div>

        <div>
          <Label>{t('settings.paymentAccount')}</Label>
          <Input
            value={form.paymentAccount || ''}
            onChange={(e) => onUpdate({ paymentAccount: e.target.value })}
            placeholder={t('settings.paymentAccountPlaceholder')}
            className="mt-1 font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">{t('settings.paymentAccountHint')}</p>
        </div>

        <div>
          <Label>{t('settings.completionMessage')}</Label>
          <Textarea
            value={form.completionMessage}
            onChange={(e) => onUpdate({ completionMessage: e.target.value })}
            placeholder={t('settings.completionPlaceholder')}
            className="mt-1"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
