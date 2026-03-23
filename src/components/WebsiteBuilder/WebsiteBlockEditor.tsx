import { useState } from 'react';
import { WebsiteBlock } from '@/types/website';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2 } from 'lucide-react';

interface WebsiteBlockEditorProps {
  block: WebsiteBlock;
  onUpdate: (block: WebsiteBlock) => void;
  onClose: () => void;
}

export function WebsiteBlockEditor({ block, onUpdate, onClose }: WebsiteBlockEditorProps) {
  const [content, setContent] = useState({ ...block.content });

  const save = () => onUpdate({ ...block, content });

  const set = (key: string, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Подзаголовок</Label><Textarea value={content.subtitle || ''} onChange={e => set('subtitle', e.target.value)} rows={2} /></div>
            <div><Label>Текст кнопки</Label><Input value={content.ctaText || ''} onChange={e => set('ctaText', e.target.value)} /></div>
            <div><Label>Ссылка кнопки</Label><Input value={content.ctaHref || ''} onChange={e => set('ctaHref', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Фон</Label><Input type="color" value={content.bgColor || '#1e293b'} onChange={e => set('bgColor', e.target.value)} className="h-10 cursor-pointer" /></div>
              <div><Label>Текст</Label><Input type="color" value={content.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} className="h-10 cursor-pointer" /></div>
            </div>
            <div>
              <Label>Выравнивание</Label>
              <div className="flex gap-2 mt-1">
                {['left', 'center', 'right'].map(a => (
                  <Button key={a} size="sm" variant={content.align === a ? 'default' : 'outline'} onClick={() => set('align', a)}>
                    {a === 'left' ? '← Лево' : a === 'center' ? '↔ Центр' : '→ Право'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'navbar':
        return (
          <div className="space-y-3">
            <div><Label>Логотип / Название</Label><Input value={content.logo || ''} onChange={e => set('logo', e.target.value)} /></div>
            <div><Label>Текст кнопки CTA</Label><Input value={content.ctaText || ''} onChange={e => set('ctaText', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Фон</Label><Input type="color" value={content.bgColor || '#1e293b'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
              <div><Label>Текст</Label><Input type="color" value={content.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} className="h-10" /></div>
            </div>
            <div>
              <Label>Ссылки меню</Label>
              {(content.links || []).map((link: any, i: number) => (
                <div key={i} className="flex gap-2 mt-1">
                  <Input placeholder="Название" value={link.label} onChange={e => {
                    const links = [...(content.links || [])];
                    links[i] = { ...links[i], label: e.target.value };
                    set('links', links);
                  }} />
                  <Input placeholder="Ссылка" value={link.href} onChange={e => {
                    const links = [...(content.links || [])];
                    links[i] = { ...links[i], href: e.target.value };
                    set('links', links);
                  }} />
                  <Button size="icon" variant="ghost" onClick={() => set('links', (content.links || []).filter((_: any, j: number) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="mt-2" onClick={() => set('links', [...(content.links || []), { label: 'Ссылка', href: '#' }])}>
                <Plus className="w-3 h-3 mr-1" /> Добавить ссылку
              </Button>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Текст</Label><Textarea value={content.body || ''} onChange={e => set('body', e.target.value)} rows={6} /></div>
            <div><Label>Выравнивание текста</Label>
              <div className="flex gap-2 mt-1">
                {['left', 'center', 'right'].map(a => (
                  <Button key={a} size="sm" variant={content.align === a ? 'default' : 'outline'} onClick={() => set('align', a)}>
                    {a === 'left' ? 'Лево' : a === 'center' ? 'Центр' : 'Право'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div><Label>URL изображения</Label><Input value={content.src || ''} onChange={e => set('src', e.target.value)} placeholder="https://..." /></div>
            <div><Label>Подпись</Label><Input value={content.caption || ''} onChange={e => set('caption', e.target.value)} /></div>
            <div><Label>Ссылка при клике</Label><Input value={content.href || ''} onChange={e => set('href', e.target.value)} /></div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок раздела</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div>
              <Label>Элементы</Label>
              {(content.items || []).map((item: any, i: number) => (
                <div key={i} className="border rounded-lg p-3 mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Иконка (эмодзи)" value={item.icon} onChange={e => {
                      const items = [...(content.items || [])]; items[i] = { ...items[i], icon: e.target.value }; set('items', items);
                    }} className="w-24" />
                    <Input placeholder="Название" value={item.title} onChange={e => {
                      const items = [...(content.items || [])]; items[i] = { ...items[i], title: e.target.value }; set('items', items);
                    }} />
                    <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input placeholder="Описание" value={item.desc} onChange={e => {
                    const items = [...(content.items || [])]; items[i] = { ...items[i], desc: e.target.value }; set('items', items);
                  }} />
                </div>
              ))}
              <Button size="sm" variant="outline" className="mt-2" onClick={() => set('items', [...(content.items || []), { icon: '⭐', title: '', desc: '' }])}>
                <Plus className="w-3 h-3 mr-1" /> Добавить элемент
              </Button>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.plans || []).map((plan: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <Input placeholder="Название" value={plan.name} onChange={e => {
                    const plans = [...(content.plans || [])]; plans[i] = { ...plans[i], name: e.target.value }; set('plans', plans);
                  }} />
                  <Input placeholder="Цена" value={plan.price} onChange={e => {
                    const plans = [...(content.plans || [])]; plans[i] = { ...plans[i], price: e.target.value }; set('plans', plans);
                  }} />
                  <Button size="icon" variant="ghost" onClick={() => set('plans', (content.plans || []).filter((_: any, j: number) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea placeholder="Функции (по одной на строку)" rows={3} value={(plan.features || []).join('\n')} onChange={e => {
                  const plans = [...(content.plans || [])]; plans[i] = { ...plans[i], features: e.target.value.split('\n') }; set('plans', plans);
                }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('plans', [...(content.plans || []), { name: '', price: '', features: [] }])}>
              <Plus className="w-3 h-3 mr-1" /> Добавить тариф
            </Button>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Подзаголовок</Label><Input value={content.subtitle || ''} onChange={e => set('subtitle', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={content.email || ''} onChange={e => set('email', e.target.value)} /></div>
            <div><Label>Телефон</Label><Input value={content.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
            <div><Label>Адрес</Label><Input value={content.address || ''} onChange={e => set('address', e.target.value)} /></div>
            <div><Label>Часы работы</Label><Input value={content.hours || ''} onChange={e => set('hours', e.target.value)} /></div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Имя" value={item.name} onChange={e => {
                    const items = [...(content.items || [])]; items[i] = { ...items[i], name: e.target.value }; set('items', items);
                  }} />
                  <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea placeholder="Отзыв" rows={2} value={item.text} onChange={e => {
                  const items = [...(content.items || [])]; items[i] = { ...items[i], text: e.target.value }; set('items', items);
                }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('items', [...(content.items || []), { name: '', text: '', rating: 5 }])}>
              <Plus className="w-3 h-3 mr-1" /> Добавить отзыв
            </Button>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.members || []).map((m: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Аватар (эмодзи)" value={m.avatar} onChange={e => {
                    const members = [...(content.members || [])]; members[i] = { ...members[i], avatar: e.target.value }; set('members', members);
                  }} className="w-24" />
                  <Input placeholder="Имя" value={m.name} onChange={e => {
                    const members = [...(content.members || [])]; members[i] = { ...members[i], name: e.target.value }; set('members', members);
                  }} />
                  <Button size="icon" variant="ghost" onClick={() => set('members', (content.members || []).filter((_: any, j: number) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input placeholder="Должность/роль" value={m.role} onChange={e => {
                  const members = [...(content.members || [])]; members[i] = { ...members[i], role: e.target.value }; set('members', members);
                }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('members', [...(content.members || []), { name: '', role: '', avatar: '👤' }])}>
              <Plus className="w-3 h-3 mr-1" /> Добавить участника
            </Button>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Вопрос" value={item.q} onChange={e => {
                    const items = [...(content.items || [])]; items[i] = { ...items[i], q: e.target.value }; set('items', items);
                  }} />
                  <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea placeholder="Ответ" rows={2} value={item.a} onChange={e => {
                  const items = [...(content.items || [])]; items[i] = { ...items[i], a: e.target.value }; set('items', items);
                }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('items', [...(content.items || []), { q: '', a: '' }])}>
              <Plus className="w-3 h-3 mr-1" /> Добавить вопрос
            </Button>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            <div><Label>URL видео (YouTube/Vimeo)</Label><Input value={content.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-3">
            <div><Label>Текст кнопки</Label><Input value={content.text || ''} onChange={e => set('text', e.target.value)} /></div>
            <div><Label>Ссылка</Label><Input value={content.href || ''} onChange={e => set('href', e.target.value)} /></div>
            <div><Label>Цвет кнопки</Label><Input type="color" value={content.bgColor || '#4f46e5'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
            <div><Label>Выравнивание</Label>
              <div className="flex gap-2 mt-1">
                {['left', 'center', 'right'].map(a => (
                  <Button key={a} size="sm" variant={content.align === a ? 'default' : 'outline'} onClick={() => set('align', a)}>
                    {a === 'left' ? 'Лево' : a === 'center' ? 'Центр' : 'Право'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Дата окончания</Label><Input type="datetime-local" value={content.targetDate ? new Date(content.targetDate).toISOString().slice(0, 16) : ''} onChange={e => set('targetDate', new Date(e.target.value).toISOString())} /></div>
          </div>
        );

      case 'html':
        return (
          <div className="space-y-3">
            <div><Label>HTML код</Label><Textarea value={content.code || ''} onChange={e => set('code', e.target.value)} rows={10} className="font-mono text-xs" placeholder="<div>Вставьте HTML код здесь</div>" /></div>
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-3">
            <div><Label>Название компании</Label><Input value={content.companyName || ''} onChange={e => set('companyName', e.target.value)} /></div>
            <div><Label>Копирайт</Label><Input value={content.copyright || ''} onChange={e => set('copyright', e.target.value)} /></div>
          </div>
        );

      default:
        return <p className="text-muted-foreground text-sm">Редактирование этого блока пока не поддерживается</p>;
    }
  };

  const BLOCK_LABELS: Record<string, string> = {
    hero: 'Герой-секция', navbar: 'Навигация', text: 'Текст', image: 'Изображение',
    gallery: 'Галерея', features: 'Преимущества', pricing: 'Тарифы', testimonials: 'Отзывы',
    contact: 'Контакты', video: 'Видео', button: 'Кнопка', countdown: 'Таймер',
    faq: 'FAQ', team: 'Команда', footer: 'Футер', divider: 'Разделитель', html: 'HTML код'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Редактировать: {BLOCK_LABELS[block.type] || block.type}</h3>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {renderEditor()}
        </div>
        <div className="flex gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
          <Button onClick={save} className="flex-1">Сохранить</Button>
        </div>
      </div>
    </div>
  );
}
