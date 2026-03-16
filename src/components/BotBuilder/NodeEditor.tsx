import { useState } from 'react';
import { BotNodeData, BotNodeType, BotButton, SocialLink } from '@/types/bot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Trash2, Settings2, Brain, Clock, Shuffle, Languages, Youtube, Share2, Globe } from 'lucide-react';
import { FormData } from '@/types/form';
import { BotNode } from '@/types/bot';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface NodeEditorProps {
  nodeId: string;
  nodeType: BotNodeType;
  data: BotNodeData;
  forms: FormData[];
  nodes: BotNode[];
  onUpdate: (nodeId: string, data: BotNodeData) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

const typeLabel: Record<BotNodeType, string> = {
  message: '💬 Сообщение',
  userInput: '❓ Ввод пользователя',
  condition: '⚡ Условие',
  action: '🔗 Действие',
  start: '▶ Старт',
  aiChat: '🤖 ИИ Ответ',
  delay: '⏱ Задержка',
  media: '🖼 Медиа',
  variable: '📦 Переменная',
  randomizer: '🎲 Рандомайзер',
  jump: '↩ Переход',
  translate: '🌐 Перевод',
  langDetect: '🔍 Определить язык',
  youtubeMonitor: '▶ YouTube Monitor',
  socialShare: '📱 Соц. сети',
};

const LANGUAGES = [
  { code: 'auto', name: '🔄 Авто-определение' },
  { code: 'ru', name: '🇷🇺 Русский' },
  { code: 'en', name: '🇬🇧 English' },
  { code: 'de', name: '🇩🇪 Deutsch' },
  { code: 'fr', name: '🇫🇷 Français' },
  { code: 'es', name: '🇪🇸 Español' },
  { code: 'it', name: '🇮🇹 Italiano' },
  { code: 'zh', name: '🇨🇳 中文' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'ar', name: '🇸🇦 العربية' },
  { code: 'pt', name: '🇧🇷 Português' },
  { code: 'ko', name: '🇰🇷 한국어' },
  { code: 'tr', name: '🇹🇷 Türkçe' },
  { code: 'uk', name: '🇺🇦 Українська' },
  { code: 'pl', name: '🇵🇱 Polski' },
  { code: 'nl', name: '🇳🇱 Nederlands' },
  { code: 'sv', name: '🇸🇪 Svenska' },
  { code: 'cs', name: '🇨🇿 Čeština' },
  { code: 'he', name: '🇮🇱 עברית' },
  { code: 'hi', name: '🇮🇳 हिन्दी' },
];

const PLATFORMS: { id: SocialLink['platform']; name: string; emoji: string; placeholder: string }[] = [
  { id: 'telegram', name: 'Telegram', emoji: '✈️', placeholder: 'https://t.me/...' },
  { id: 'youtube', name: 'YouTube', emoji: '▶️', placeholder: 'https://youtube.com/@...' },
  { id: 'instagram', name: 'Instagram', emoji: '📸', placeholder: 'https://instagram.com/...' },
  { id: 'tiktok', name: 'TikTok', emoji: '🎵', placeholder: 'https://tiktok.com/@...' },
  { id: 'twitter', name: 'X (Twitter)', emoji: '🐦', placeholder: 'https://x.com/...' },
  { id: 'vk', name: 'ВКонтакте', emoji: '💬', placeholder: 'https://vk.com/...' },
  { id: 'facebook', name: 'Facebook', emoji: '📘', placeholder: 'https://facebook.com/...' },
  { id: 'discord', name: 'Discord', emoji: '🎮', placeholder: 'https://discord.gg/...' },
  { id: 'twitch', name: 'Twitch', emoji: '🟣', placeholder: 'https://twitch.tv/...' },
  { id: 'website', name: 'Сайт', emoji: '🌐', placeholder: 'https://...' },
];

export function NodeEditor({ nodeId, nodeType, data, forms, nodes, onUpdate, onClose, onDelete }: NodeEditorProps) {
  const [local, setLocal] = useState<BotNodeData>({ ...data });

  const update = (patch: Partial<BotNodeData>) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onUpdate(nodeId, updated);
  };

  // Buttons helpers
  const addButton = () => {
    const buttons: BotButton[] = [...(local.buttons || []), { id: generateId(), label: 'Кнопка', url: '' }];
    update({ buttons });
  };
  const updateButton = (id: string, field: keyof BotButton, val: string) => {
    const buttons = (local.buttons || []).map(b => b.id === id ? { ...b, [field]: val } : b);
    update({ buttons });
  };
  const removeButton = (id: string) => update({ buttons: (local.buttons || []).filter(b => b.id !== id) });

  // Choices helpers
  const addChoice = () => update({ choices: [...(local.choices || []), ''] });
  const updateChoice = (i: number, val: string) => {
    const choices = [...(local.choices || [])];
    choices[i] = val;
    update({ choices });
  };
  const removeChoice = (i: number) => {
    const choices = [...(local.choices || [])];
    choices.splice(i, 1);
    update({ choices });
  };

  // Randomizer weights
  const randWeights = local.randWeights || [1, 1];
  const addRandBranch = () => update({ randWeights: [...randWeights, 1] });
  const removeRandBranch = (i: number) => {
    const w = [...randWeights];
    w.splice(i, 1);
    update({ randWeights: w });
  };

  // Social links helpers
  const addSocialLink = () => {
    const links: SocialLink[] = [...(local.shareLinks || []), { id: generateId(), platform: 'telegram', label: 'Telegram', url: '' }];
    update({ shareLinks: links });
  };
  const updateSocialLink = (id: string, field: keyof SocialLink, val: string) => {
    const links = (local.shareLinks || []).map(l => {
      if (l.id !== id) return l;
      if (field === 'platform') {
        const p = PLATFORMS.find(pl => pl.id === val as SocialLink['platform']);
        return { ...l, platform: val as SocialLink['platform'], label: p?.name || val };
      }
      return { ...l, [field]: val };
    });
    update({ shareLinks: links });
  };
  const removeSocialLink = (id: string) => update({ shareLinks: (local.shareLinks || []).filter(l => l.id !== id) });

  return (
    <Card className="shadow-2xl border-2 border-primary/20 h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between shrink-0">
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

      <CardContent className="space-y-3 pt-0 overflow-y-auto flex-1 pb-4">

        {/* START */}
        {nodeType === 'start' && (
          <p className="text-sm text-muted-foreground">Стартовый узел. Бот начинает работу с команды /start.</p>
        )}

        {/* MESSAGE */}
        {nodeType === 'message' && (
          <>
            <div>
              <Label className="text-xs">Текст сообщения</Label>
              <Textarea value={local.text || ''} onChange={e => update({ text: e.target.value })} placeholder="Привет! 👋 Чем могу помочь?" rows={3} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Форматирование</Label>
              <Select value={local.parseMode || 'Markdown'} onValueChange={v => update({ parseMode: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Markdown">Markdown</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="plain">Обычный текст</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Кнопки ответа (Inline)</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addButton}>
                  <Plus className="w-3 h-3 mr-1" /> Кнопка
                </Button>
              </div>
              <div className="space-y-1.5">
                {(local.buttons || []).map(btn => (
                  <div key={btn.id} className="space-y-1 p-2 bg-muted/40 rounded-lg">
                    <div className="flex gap-1">
                      <Input value={btn.label} onChange={e => updateButton(btn.id, 'label', e.target.value)} placeholder="Текст кнопки" className="h-7 text-xs" />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeButton(btn.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input value={btn.url || ''} onChange={e => updateButton(btn.id, 'url', e.target.value)} placeholder="URL (необязательно)" className="h-7 text-xs" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* MEDIA */}
        {nodeType === 'media' && (
          <>
            <div>
              <Label className="text-xs">Тип медиа</Label>
              <Select value={local.mediaType || 'photo'} onValueChange={v => update({ mediaType: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">🖼️ Фото</SelectItem>
                  <SelectItem value="video">🎬 Видео</SelectItem>
                  <SelectItem value="audio">🎵 Аудио</SelectItem>
                  <SelectItem value="document">📄 Документ</SelectItem>
                  <SelectItem value="sticker">😀 Стикер</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">URL файла или File ID</Label>
              <Input value={local.mediaUrl || ''} onChange={e => update({ mediaUrl: e.target.value })} placeholder="https://... или file_id" className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Подпись (caption)</Label>
              <Textarea value={local.caption || ''} onChange={e => update({ caption: e.target.value })} placeholder="Описание медиа..." rows={2} className="mt-1 text-sm" />
            </div>
          </>
        )}

        {/* USER INPUT */}
        {nodeType === 'userInput' && (
          <>
            <div>
              <Label className="text-xs">Вопрос пользователю</Label>
              <Textarea value={local.text || ''} onChange={e => update({ text: e.target.value })} placeholder="Введите ваше имя..." rows={2} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Тип ввода</Label>
              <Select value={local.inputType || 'text'} onValueChange={v => update({ inputType: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Текст</SelectItem>
                  <SelectItem value="number">Число</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Телефон</SelectItem>
                  <SelectItem value="date">Дата</SelectItem>
                  <SelectItem value="choice">Выбор из вариантов</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {local.inputType === 'choice' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Варианты ответа</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addChoice}><Plus className="w-3 h-3 mr-1" />Вариант</Button>
                </div>
                <div className="space-y-1">
                  {(local.choices || []).map((c, i) => (
                    <div key={i} className="flex gap-1">
                      <Input value={c} onChange={e => updateChoice(i, e.target.value)} placeholder={`Вариант ${i + 1}`} className="h-7 text-xs" />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeChoice(i)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs">Сохранить в переменную</Label>
              <Input value={local.variableName || ''} onChange={e => update({ variableName: e.target.value })} placeholder="user_name" className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs">Валидация (regex)</Label>
              <Input value={local.validation || ''} onChange={e => update({ validation: e.target.value })} placeholder="^[a-zA-Z]+$" className="mt-1 h-8 text-xs font-mono" />
            </div>
          </>
        )}

        {/* CONDITION */}
        {nodeType === 'condition' && (
          <>
            <div>
              <Label className="text-xs">Переменная</Label>
              <Input value={local.variable || ''} onChange={e => update({ variable: e.target.value })} placeholder="user_name" className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs">Оператор</Label>
              <Select value={local.operator || 'equals'} onValueChange={v => update({ operator: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">= равно</SelectItem>
                  <SelectItem value="notEquals">≠ не равно</SelectItem>
                  <SelectItem value="contains">содержит</SelectItem>
                  <SelectItem value="notContains">не содержит</SelectItem>
                  <SelectItem value="greater">&gt; больше</SelectItem>
                  <SelectItem value="less">&lt; меньше</SelectItem>
                  <SelectItem value="isEmpty">пусто</SelectItem>
                  <SelectItem value="isNotEmpty">не пусто</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!['isEmpty', 'isNotEmpty'].includes(local.operator || '') && (
              <div>
                <Label className="text-xs">Значение</Label>
                <Input value={local.value || ''} onChange={e => update({ value: e.target.value })} placeholder="значение" className="mt-1 h-8 text-xs" />
              </div>
            )}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              <p className="font-medium mb-1">Выходы:</p>
              <p className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Верхняя точка — Да (true)</p>
              <p className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Нижняя точка — Нет (false)</p>
            </div>
          </>
        )}

        {/* ACTION */}
        {nodeType === 'action' && (
          <>
            <div>
              <Label className="text-xs">Тип действия</Label>
              <Select value={local.actionType || ''} onValueChange={v => update({ actionType: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Выберите..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sendForm">📋 Отправить ссылку на форму</SelectItem>
                  <SelectItem value="sendMessage">✉️ Отправить сообщение</SelectItem>
                  <SelectItem value="webhook">🔗 Webhook запрос</SelectItem>
                  <SelectItem value="email">📧 Отправить Email</SelectItem>
                  <SelectItem value="saveToSheet">📊 Сохранить в Google Sheets</SelectItem>
                  <SelectItem value="postToSocial">📱 Опубликовать в соц. сеть</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {local.actionType === 'sendForm' && (
              <div>
                <Label className="text-xs">Выберите форму</Label>
                <Select value={local.formId || ''} onValueChange={v => update({ formId: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Форма..." /></SelectTrigger>
                  <SelectContent>
                    {forms.map(f => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}
                    {forms.length === 0 && <SelectItem value="_empty" disabled>Нет доступных форм</SelectItem>}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Бот отправит пользователю ссылку на форму</p>
              </div>
            )}
            {local.actionType === 'sendMessage' && (
              <div>
                <Label className="text-xs">Текст сообщения</Label>
                <Textarea value={local.message || ''} onChange={e => update({ message: e.target.value })} placeholder="Текст..." rows={2} className="mt-1 text-sm" />
              </div>
            )}
            {local.actionType === 'webhook' && (
              <>
                <div>
                  <Label className="text-xs">Метод</Label>
                  <Select value={local.webhookMethod || 'POST'} onValueChange={v => update({ webhookMethod: v as any })}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">URL</Label>
                  <Input value={local.webhookUrl || ''} onChange={e => update({ webhookUrl: e.target.value })} placeholder="https://..." className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Тело запроса (JSON)</Label>
                  <Textarea value={local.webhookBody || ''} onChange={e => update({ webhookBody: e.target.value })} placeholder={'{\n  "key": "{{variable}}"\n}'} rows={3} className="mt-1 text-xs font-mono" />
                </div>
              </>
            )}
            {local.actionType === 'email' && (
              <>
                <div>
                  <Label className="text-xs">Email получателя</Label>
                  <Input value={local.emailTo || ''} onChange={e => update({ emailTo: e.target.value })} placeholder="email@example.com" className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Тема письма</Label>
                  <Input value={local.emailSubject || ''} onChange={e => update({ emailSubject: e.target.value })} placeholder="Новый ответ от бота" className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Тело письма</Label>
                  <Textarea value={local.message || ''} onChange={e => update({ message: e.target.value })} placeholder="Можно использовать {{переменные}}" rows={3} className="mt-1 text-sm" />
                </div>
              </>
            )}
            {local.actionType === 'saveToSheet' && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                Подключение Google Sheets через Webhook — укажите URL Apps Script для передачи данных.
              </div>
            )}
            {local.actionType === 'postToSocial' && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                Для публикации используйте Webhook с API нужной платформы (VK API, Buffer, Make.com и др.)
              </div>
            )}
          </>
        )}

        {/* AI CHAT */}
        {nodeType === 'aiChat' && (
          <>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Brain className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-primary font-medium">Использует Lovable AI для генерации ответов</p>
            </div>
            <div>
              <Label className="text-xs">Системный промпт</Label>
              <Textarea
                value={local.aiPrompt || ''}
                onChange={e => update({ aiPrompt: e.target.value })}
                placeholder="Ты — дружелюбный помощник. Отвечай кратко и по-русски. Можешь использовать переменные: {{user_name}}"
                rows={4}
                className="mt-1 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Используй {'{{переменная}}'} для подстановки значений</p>
            </div>
            <div>
              <Label className="text-xs">Модель ИИ</Label>
              <Select value={local.aiModel || 'google/gemini-3-flash-preview'} onValueChange={v => update({ aiModel: v })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-3-flash-preview">Gemini Flash (быстрый)</SelectItem>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (баланс)</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (мощный)</SelectItem>
                  <SelectItem value="openai/gpt-5-mini">GPT-5 Mini (баланс)</SelectItem>
                  <SelectItem value="openai/gpt-5">GPT-5 (максимум)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Контекст (дополнительные данные)</Label>
              <Textarea
                value={local.aiContext || ''}
                onChange={e => update({ aiContext: e.target.value })}
                placeholder="Дополнительная информация для ИИ..."
                rows={2}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Температура: {(local.aiTemperature ?? 0.7).toFixed(1)}</Label>
              </div>
              <Slider
                value={[local.aiTemperature ?? 0.7]}
                onValueChange={([v]) => update({ aiTemperature: v })}
                min={0} max={1} step={0.1}
                className="mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Точно</span><span>Творчески</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Сохранить ответ в переменную</Label>
              <Input value={local.aiResponseVar || ''} onChange={e => update({ aiResponseVar: e.target.value })} placeholder="ai_response" className="mt-1 h-8 text-xs font-mono" />
            </div>
          </>
        )}

        {/* DELAY */}
        {nodeType === 'delay' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Задержка: {local.delaySeconds ?? 3} сек</Label>
              </div>
              <Slider
                value={[local.delaySeconds ?? 3]}
                onValueChange={([v]) => update({ delaySeconds: v })}
                min={1} max={60} step={1}
                className="mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 сек</span><span>60 сек</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Статус "печатает..." (необязательно)</Label>
              <Input value={local.delayMessage || ''} onChange={e => update({ delayMessage: e.target.value })} placeholder="Обрабатываю запрос..." className="mt-1 h-8 text-xs" />
              <p className="text-xs text-muted-foreground mt-1">Бот будет показывать typing indicator</p>
            </div>
          </>
        )}

        {/* VARIABLE */}
        {nodeType === 'variable' && (
          <>
            <div>
              <Label className="text-xs">Имя переменной</Label>
              <Input value={local.varName || ''} onChange={e => update({ varName: e.target.value })} placeholder="counter" className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs">Операция</Label>
              <Select value={local.varOperation || 'set'} onValueChange={v => update({ varOperation: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">= Присвоить</SelectItem>
                  <SelectItem value="increment">+= Увеличить</SelectItem>
                  <SelectItem value="decrement">-= Уменьшить</SelectItem>
                  <SelectItem value="append">+ Добавить к строке</SelectItem>
                  <SelectItem value="clear">∅ Очистить</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {local.varOperation !== 'clear' && (
              <div>
                <Label className="text-xs">Значение</Label>
                <Input value={local.varValue || ''} onChange={e => update({ varValue: e.target.value })} placeholder="Значение или {{переменная}}" className="mt-1 h-8 text-xs" />
              </div>
            )}
          </>
        )}

        {/* RANDOMIZER */}
        {nodeType === 'randomizer' && (
          <>
            <p className="text-xs text-muted-foreground">Случайно выбирает один из выходов по заданным весам.</p>
            <div className="space-y-2">
              {randWeights.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">Ветка {i + 1}</span>
                  <Slider
                    value={[w]}
                    onValueChange={([v]) => {
                      const weights = [...randWeights];
                      weights[i] = v;
                      update({ randWeights: weights });
                    }}
                    min={1} max={10} step={1}
                    className="flex-1"
                  />
                  <span className="text-xs w-6 text-right">{w}</span>
                  {randWeights.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeRandBranch(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {randWeights.length < 5 && (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={addRandBranch}>
                <Plus className="w-3 h-3 mr-1" /> Добавить ветку
              </Button>
            )}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-2">
              <Shuffle className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Вероятности: {randWeights.map((w, i) => `Ветка ${i + 1}: ${Math.round(w / randWeights.reduce((a, b) => a + b, 0) * 100)}%`).join(', ')}
              </p>
            </div>
          </>
        )}

        {/* JUMP */}
        {nodeType === 'jump' && (
          <>
            <p className="text-xs text-muted-foreground">Перейти к другому узлу без соединения стрелкой.</p>
            <div>
              <Label className="text-xs">Целевой узел (ID)</Label>
              <Select value={local.jumpTarget || ''} onValueChange={v => update({ jumpTarget: v })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Выберите узел..." /></SelectTrigger>
                <SelectContent>
                  {nodes.filter(n => n.id !== nodeId).map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      {typeLabel[n.type as BotNodeType]} — {(n.data.text || n.data.aiPrompt || n.id).slice(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TRANSLATE NODE
        ══════════════════════════════════════════════════════════════════════ */}
        {nodeType === 'translate' && (
          <>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Languages className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-primary font-medium">Перевод текста с помощью ИИ</p>
            </div>

            <div>
              <Label className="text-xs">Режим определения языка</Label>
              <Select value={local.translateMode || 'fixed'} onValueChange={v => update({ translateMode: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">🔒 Фиксированный язык</SelectItem>
                  <SelectItem value="userLang">👤 По языку пользователя (из {{user_lang}})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {local.translateMode === 'userLang'
                  ? 'Использует переменную user_lang для определения нужного языка'
                  : 'Всегда переводит на выбранный язык'}
              </p>
            </div>

            <div>
              <Label className="text-xs">Исходный язык</Label>
              <Select value={local.translateSourceLang || 'auto'} onValueChange={v => update({ translateSourceLang: v })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {local.translateMode !== 'userLang' && (
              <div>
                <Label className="text-xs">Целевой язык</Label>
                <Select value={local.translateTargetLang || 'ru'} onValueChange={v => update({ translateTargetLang: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs">Переменная с текстом для перевода</Label>
              <Input
                value={local.translateSourceVar || ''}
                onChange={e => update({ translateSourceVar: e.target.value })}
                placeholder="user_message"
                className="mt-1 h-8 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Переменная содержит текст который нужно перевести</p>
            </div>

            <div>
              <Label className="text-xs">Сохранить перевод в переменную</Label>
              <Input
                value={local.translateResultVar || ''}
                onChange={e => update({ translateResultVar: e.target.value })}
                placeholder="translated_text"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Пример использования:</p>
              <p>1. Пользователь пишет на любом языке</p>
              <p>2. Этот узел переводит {'{{user_message}}'} → {'{{translated_text}}'}</p>
              <p>3. Используй {'{{translated_text}}'} в следующих узлах</p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            LANG DETECT NODE
        ══════════════════════════════════════════════════════════════════════ */}
        {nodeType === 'langDetect' && (
          <>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Globe className="w-4 h-4 text-accent-foreground shrink-0" />
              <p className="text-xs text-accent-foreground font-medium">Автоматически определяет язык пользователя</p>
            </div>

            <div>
              <Label className="text-xs">Переменная с текстом для анализа</Label>
              <Input
                value={local.langDetectVar || ''}
                onChange={e => update({ langDetectVar: e.target.value })}
                placeholder="user_message"
                className="mt-1 h-8 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Обычно это первое сообщение пользователя</p>
            </div>

            <div>
              <Label className="text-xs">Сохранить код языка в переменную</Label>
              <Input
                value={local.langResultVar || ''}
                onChange={e => update({ langResultVar: e.target.value })}
                placeholder="user_lang"
                className="mt-1 h-8 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Будет сохранён код языка: ru, en, de, fr...</p>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
              <div>
                <p className="text-xs font-medium">Установить как язык бота</p>
                <p className="text-xs text-muted-foreground">Все переводы будут использовать этот язык</p>
              </div>
              <Switch
                checked={local.langSetAsDefault ?? true}
                onCheckedChange={v => update({ langSetAsDefault: v })}
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Как это работает:</p>
              <p>• Анализирует текст и определяет язык через ИИ</p>
              <p>• Сохраняет код языка в {'{{user_lang}}'}</p>
              <p>• Узел Перевод использует это значение автоматически</p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            YOUTUBE MONITOR NODE
        ══════════════════════════════════════════════════════════════════════ */}
        {nodeType === 'youtubeMonitor' && (
          <>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
              <Youtube className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">Отслеживание YouTube канала</p>
            </div>

            <div>
              <Label className="text-xs">ID канала (UCxxxxxxxx...)</Label>
              <Input
                value={local.ytChannelId || ''}
                onChange={e => update({ ytChannelId: e.target.value })}
                placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs">или URL канала</Label>
              <Input
                value={local.ytChannelUrl || ''}
                onChange={e => update({ ytChannelUrl: e.target.value })}
                placeholder="https://youtube.com/@channelname"
                className="mt-1 h-8 text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">Можно использовать ID или URL</p>
            </div>

            <div>
              <Label className="text-xs">Интервал проверки</Label>
              <Select value={String(local.ytCheckInterval || 30)} onValueChange={v => update({ ytCheckInterval: Number(v) })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Каждые 15 минут</SelectItem>
                  <SelectItem value="30">Каждые 30 минут</SelectItem>
                  <SelectItem value="60">Каждый час</SelectItem>
                  <SelectItem value="120">Каждые 2 часа</SelectItem>
                  <SelectItem value="360">Каждые 6 часов</SelectItem>
                  <SelectItem value="720">Каждые 12 часов</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Что отслеживать</Label>
              <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                <span className="text-xs">📹 Новые видео</span>
                <Switch checked={local.ytNotifyVideos ?? true} onCheckedChange={v => update({ ytNotifyVideos: v })} />
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                <span className="text-xs">🔴 Начало стрима / трансляции</span>
                <Switch checked={local.ytNotifyStreams ?? true} onCheckedChange={v => update({ ytNotifyStreams: v })} />
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                <span className="text-xs">🎬 Премьеры</span>
                <Switch checked={local.ytNotifyPremiere ?? false} onCheckedChange={v => update({ ytNotifyPremiere: v })} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Шаблон уведомления</Label>
              <Textarea
                value={local.ytMessageTemplate || ''}
                onChange={e => update({ ytMessageTemplate: e.target.value })}
                placeholder={'🎬 Новое видео от {{author}}!\n\n{{title}}\n\n▶️ {{url}}'}
                rows={4}
                className="mt-1 text-xs font-mono"
              />
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <p>Переменные: <span className="font-mono">{'{{title}}'}</span> <span className="font-mono">{'{{url}}'}</span> <span className="font-mono">{'{{author}}'}</span> <span className="font-mono">{'{{type}}'}</span></p>
              </div>
            </div>

            <div>
              <Label className="text-xs">Переменная для ID последнего видео</Label>
              <Input
                value={local.ytSaveLastIdVar || ''}
                onChange={e => update({ ytSaveLastIdVar: e.target.value })}
                placeholder="yt_last_video_id"
                className="mt-1 h-8 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Используется для отслеживания новых публикаций</p>
            </div>

            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2 text-xs space-y-1">
              <p className="font-medium">Для работы требуется:</p>
              <p className="text-muted-foreground">• YouTube Data API v3 ключ (Google Cloud Console)</p>
              <p className="text-muted-foreground">• Настройка периодического запуска бота</p>
              <p className="text-muted-foreground">• Подключить через Webhook или Action узел</p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SOCIAL SHARE NODE
        ══════════════════════════════════════════════════════════════════════ */}
        {nodeType === 'socialShare' && (
          <>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Share2 className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-primary font-medium">Отправить ссылки на соц. сети и каналы</p>
            </div>

            <div>
              <Label className="text-xs">Текст перед ссылками</Label>
              <Textarea
                value={local.shareText || ''}
                onChange={e => update({ shareText: e.target.value })}
                placeholder="Подпишись на нас в соц. сетях! 👇"
                rows={2}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">Отображение</Label>
              <Select value={local.shareLayout || 'buttons'} onValueChange={v => update({ shareLayout: v as any })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buttons">🔲 Кнопки (inline keyboard)</SelectItem>
                  <SelectItem value="text">📝 Текстовые ссылки</SelectItem>
                  <SelectItem value="mixed">🔀 Текст + кнопки</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Ссылки</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addSocialLink}>
                  <Plus className="w-3 h-3 mr-1" /> Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {(local.shareLinks || []).map(link => {
                  const platform = PLATFORMS.find(p => p.id === link.platform);
                  return (
                    <div key={link.id} className="p-2 bg-muted/40 rounded-lg space-y-1.5">
                      <div className="flex gap-1 items-center">
                        <Select value={link.platform} onValueChange={v => updateSocialLink(link.id, 'platform', v)}>
                          <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PLATFORMS.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeSocialLink(link.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Input
                        value={link.label}
                        onChange={e => updateSocialLink(link.id, 'label', e.target.value)}
                        placeholder="Название кнопки"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={link.url}
                        onChange={e => updateSocialLink(link.id, 'url', e.target.value)}
                        placeholder={platform?.placeholder || 'https://...'}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  );
                })}
                {(local.shareLinks || []).length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                    Нажмите «Добавить» чтобы добавить ссылку на соц. сеть
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">Поддерживаемые платформы:</p>
              <p>Telegram, YouTube, Instagram, TikTok, X, VK, Facebook, Discord, Twitch, сайт</p>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}
