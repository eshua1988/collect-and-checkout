import { useState } from 'react';
import { BotNodeData, BotNodeType } from '@/types/bot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Settings2 } from 'lucide-react';
import { FormData } from '@/types/form';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface NodeEditorProps {
  nodeId: string;
  nodeType: BotNodeType;
  data: BotNodeData;
  forms: FormData[];
  onUpdate: (nodeId: string, data: BotNodeData) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

export function NodeEditor({ nodeId, nodeType, data, forms, onUpdate, onClose, onDelete }: NodeEditorProps) {
  const [local, setLocal] = useState<BotNodeData>({ ...data });

  const update = (patch: Partial<BotNodeData>) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onUpdate(nodeId, updated);
  };

  const addButton = () => {
    const buttons = [...(local.buttons || []), { id: generateId(), label: 'Кнопка', url: '' }];
    update({ buttons });
  };

  const updateButton = (id: string, label: string) => {
    const buttons = (local.buttons || []).map(b => b.id === id ? { ...b, label } : b);
    update({ buttons });
  };

  const removeButton = (id: string) => {
    update({ buttons: (local.buttons || []).filter(b => b.id !== id) });
  };

  const typeLabel: Record<BotNodeType, string> = {
    message: 'Сообщение',
    userInput: 'Ввод пользователя',
    condition: 'Условие',
    action: 'Действие',
    start: 'Старт',
  };

  return (
    <Card className="w-80 shadow-2xl border-2 border-primary/20">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">{typeLabel[nodeType]}</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => onDelete(nodeId)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Start node - no settings */}
        {nodeType === 'start' && (
          <p className="text-sm text-muted-foreground">Стартовый узел. Бот начинает работу отсюда.</p>
        )}

        {/* Message node */}
        {nodeType === 'message' && (
          <>
            <div>
              <Label className="text-xs">Текст сообщения</Label>
              <Textarea
                value={local.text || ''}
                onChange={e => update({ text: e.target.value })}
                placeholder="Привет! 👋 Чем могу помочь?"
                rows={3}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Кнопки ответа</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addButton}>
                  <Plus className="w-3 h-3 mr-1" /> Кнопка
                </Button>
              </div>
              <div className="space-y-1">
                {(local.buttons || []).map(btn => (
                  <div key={btn.id} className="flex gap-1">
                    <Input
                      value={btn.label}
                      onChange={e => updateButton(btn.id, e.target.value)}
                      placeholder="Текст кнопки"
                      className="h-7 text-xs"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeButton(btn.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* UserInput node */}
        {nodeType === 'userInput' && (
          <>
            <div>
              <Label className="text-xs">Вопрос пользователю</Label>
              <Textarea
                value={local.text || ''}
                onChange={e => update({ text: e.target.value })}
                placeholder="Введите ваше имя..."
                rows={2}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Тип ввода</Label>
              <Select value={local.inputType || 'text'} onValueChange={v => update({ inputType: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Текст</SelectItem>
                  <SelectItem value="number">Число</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Телефон</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Сохранить в переменную</Label>
              <Input
                value={local.variableName || ''}
                onChange={e => update({ variableName: e.target.value })}
                placeholder="например: user_name"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>
          </>
        )}

        {/* Condition node */}
        {nodeType === 'condition' && (
          <>
            <div>
              <Label className="text-xs">Переменная</Label>
              <Input
                value={local.variable || ''}
                onChange={e => update({ variable: e.target.value })}
                placeholder="user_name"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Оператор</Label>
              <Select value={local.operator || 'equals'} onValueChange={v => update({ operator: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">равно</SelectItem>
                  <SelectItem value="contains">содержит</SelectItem>
                  <SelectItem value="greater">больше</SelectItem>
                  <SelectItem value="less">меньше</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Значение</Label>
              <Input
                value={local.value || ''}
                onChange={e => update({ value: e.target.value })}
                placeholder="да"
                className="mt-1 h-8 text-xs"
              />
            </div>
          </>
        )}

        {/* Action node */}
        {nodeType === 'action' && (
          <>
            <div>
              <Label className="text-xs">Тип действия</Label>
              <Select value={local.actionType || ''} onValueChange={v => update({ actionType: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sendForm">📋 Отправить ссылку на форму</SelectItem>
                  <SelectItem value="sendMessage">✉️ Отправить сообщение</SelectItem>
                  <SelectItem value="webhook">🔗 Webhook запрос</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {local.actionType === 'sendForm' && (
              <div>
                <Label className="text-xs">Выберите форму</Label>
                <Select value={local.formId || ''} onValueChange={v => update({ formId: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Форма..." />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                    ))}
                    {forms.length === 0 && (
                      <SelectItem value="" disabled>Нет доступных форм</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Бот отправит пользователю ссылку на форму</p>
              </div>
            )}

            {local.actionType === 'sendMessage' && (
              <div>
                <Label className="text-xs">Текст сообщения</Label>
                <Textarea
                  value={local.message || ''}
                  onChange={e => update({ message: e.target.value })}
                  placeholder="Текст..."
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
            )}

            {local.actionType === 'webhook' && (
              <div>
                <Label className="text-xs">URL Webhook</Label>
                <Input
                  value={local.webhookUrl || ''}
                  onChange={e => update({ webhookUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
