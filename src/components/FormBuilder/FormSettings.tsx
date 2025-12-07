import { FormData } from '@/types/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';

interface FormSettingsProps {
  form: FormData;
  onUpdate: (updates: Partial<FormData>) => void;
}

export function FormSettings({ form, onUpdate }: FormSettingsProps) {
  return (
    <Card variant="form" className="mb-6">
      <CardHeader variant="form">
        <CardTitle>Ustawienia formularza</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label>Tytuł formularza</Label>
          <Input
            value={form.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Tytuł formularza"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Opis</Label>
          <Textarea
            value={form.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Opis formularza (opcjonalnie)"
            className="mt-1"
            rows={2}
          />
        </div>

        <div>
          <Label>Obrazek nagłówkowy</Label>
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
          <Label>Wiadomość po zakończeniu</Label>
          <Textarea
            value={form.completionMessage}
            onChange={(e) => onUpdate({ completionMessage: e.target.value })}
            placeholder="Dziękujemy za wypełnienie formularza!"
            className="mt-1"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
