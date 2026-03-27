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

      case 'stats':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Фон</Label><Input type="color" value={content.bgColor || '#4f46e5'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
              <div><Label>Текст</Label><Input type="color" value={content.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} className="h-10" /></div>
            </div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Значение" value={item.value} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], value: e.target.value }; set('items', items); }} className="w-28" />
                <Input placeholder="Описание" value={item.label} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], label: e.target.value }; set('items', items); }} />
                <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('items', [...(content.items || []), { value: '0', label: '' }])}><Plus className="w-3 h-3 mr-1" /> Добавить</Button>
          </div>
        );

      case 'logos':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={content.grayscale || false} onChange={e => set('grayscale', e.target.checked)} />
              <Label className="mb-0">Чёрно-белые логотипы</Label>
            </div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Название" value={item.name} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], name: e.target.value }; set('items', items); }} />
                  <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Input placeholder="URL логотипа" value={item.logo} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], logo: e.target.value }; set('items', items); }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('items', [...(content.items || []), { name: '', logo: '' }])}><Plus className="w-3 h-3 mr-1" /> Добавить</Button>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Подзаголовок</Label><Textarea value={content.subtitle || ''} onChange={e => set('subtitle', e.target.value)} rows={2} /></div>
            <div><Label>Текст кнопки</Label><Input value={content.ctaText || ''} onChange={e => set('ctaText', e.target.value)} /></div>
            <div><Label>Ссылка кнопки</Label><Input value={content.ctaHref || ''} onChange={e => set('ctaHref', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Фон</Label><Input type="color" value={content.bgColor || '#7c3aed'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
              <div><Label>Текст</Label><Input type="color" value={content.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} className="h-10" /></div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Иконка" value={item.icon} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], icon: e.target.value }; set('items', items); }} className="w-20" />
                  <Input placeholder="Заголовок" value={item.title} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], title: e.target.value }; set('items', items); }} />
                  <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Input placeholder="Описание" value={item.desc} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], desc: e.target.value }; set('items', items); }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('items', [...(content.items || []), { icon: '', title: '', desc: '' }])}><Plus className="w-3 h-3 mr-1" /> Добавить шаг</Button>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.links || []).map((link: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Иконка" value={link.icon} onChange={e => { const links = [...(content.links || [])]; links[i] = { ...links[i], icon: e.target.value }; set('links', links); }} className="w-16" />
                <Input placeholder="Название" value={link.platform} onChange={e => { const links = [...(content.links || [])]; links[i] = { ...links[i], platform: e.target.value }; set('links', links); }} className="w-28" />
                <Input placeholder="URL" value={link.url} onChange={e => { const links = [...(content.links || [])]; links[i] = { ...links[i], url: e.target.value }; set('links', links); }} />
                <Button size="icon" variant="ghost" onClick={() => set('links', (content.links || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('links', [...(content.links || []), { platform: '', url: '', icon: '🔗' }])}><Plus className="w-3 h-3 mr-1" /> Добавить</Button>
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Подзаголовок</Label><Input value={content.subtitle || ''} onChange={e => set('subtitle', e.target.value)} /></div>
            <div><Label>Текст кнопки</Label><Input value={content.buttonText || ''} onChange={e => set('buttonText', e.target.value)} /></div>
            <div><Label>Цвет фона</Label><Input type="color" value={content.bgColor || '#f8fafc'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
          </div>
        );

      case 'banner':
        return (
          <div className="space-y-3">
            <div><Label>Текст баннера</Label><Input value={content.text || ''} onChange={e => set('text', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Фон</Label><Input type="color" value={content.bgColor || '#ef4444'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
              <div><Label>Текст</Label><Input type="color" value={content.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} className="h-10" /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={content.closable || false} onChange={e => set('closable', e.target.checked)} />
              <Label className="mb-0">Можно закрыть</Label>
            </div>
          </div>
        );

      case 'tabs':
        return (
          <div className="space-y-3">
            {(content.tabs || []).map((tab: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Заголовок вкладки" value={tab.title} onChange={e => { const tabs = [...(content.tabs || [])]; tabs[i] = { ...tabs[i], title: e.target.value }; set('tabs', tabs); }} />
                  <Button size="icon" variant="ghost" onClick={() => set('tabs', (content.tabs || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea placeholder="Содержимое" rows={3} value={tab.content} onChange={e => { const tabs = [...(content.tabs || [])]; tabs[i] = { ...tabs[i], content: e.target.value }; set('tabs', tabs); }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('tabs', [...(content.tabs || []), { title: '', content: '' }])}><Plus className="w-3 h-3 mr-1" /> Добавить вкладку</Button>
          </div>
        );

      case 'accordion':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Заголовок" value={item.title} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], title: e.target.value }; set('items', items); }} />
                  <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea placeholder="Содержимое" rows={3} value={item.content} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], content: e.target.value }; set('items', items); }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('items', [...(content.items || []), { title: '', content: '' }])}><Plus className="w-3 h-3 mr-1" /> Добавить раздел</Button>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Название" value={item.label} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], label: e.target.value }; set('items', items); }} />
                  <Input type="number" placeholder="%" min={0} max={100} value={item.value} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], value: parseInt(e.target.value) || 0 }; set('items', items); }} className="w-20" />
                  <Input type="color" value={item.color || '#4f46e5'} onChange={e => { const items = [...(content.items || [])]; items[i] = { ...items[i], color: e.target.value }; set('items', items); }} className="w-12 h-9" />
                  <Button size="icon" variant="ghost" onClick={() => set('items', (content.items || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('items', [...(content.items || []), { label: '', value: 50, color: '#4f46e5' }])}><Plus className="w-3 h-3 mr-1" /> Добавить</Button>
          </div>
        );

      case 'comparison':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Колонки (через запятую)</Label><Input value={(content.columns || []).join(', ')} onChange={e => set('columns', e.target.value.split(',').map((s: string) => s.trim()))} placeholder="Бесплатный, Про, Бизнес" /></div>
            <div><Label>Строки</Label></div>
            {(content.rows || []).map((row: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Функция" value={row.feature} onChange={e => { const rows = [...(content.rows || [])]; rows[i] = { ...rows[i], feature: e.target.value }; set('rows', rows); }} />
                  <Button size="icon" variant="ghost" onClick={() => set('rows', (content.rows || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Input placeholder="Значения (через запятую)" value={(row.values || []).join(', ')} onChange={e => { const rows = [...(content.rows || [])]; rows[i] = { ...rows[i], values: e.target.value.split(',').map((s: string) => s.trim()) }; set('rows', rows); }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('rows', [...(content.rows || []), { feature: '', values: [] }])}><Plus className="w-3 h-3 mr-1" /> Добавить строку</Button>
          </div>
        );

      case 'marquee':
        return (
          <div className="space-y-3">
            <div><Label>Текст</Label><Input value={content.text || ''} onChange={e => set('text', e.target.value)} /></div>
            <div><Label>Скорость (секунды)</Label><Input type="number" min={5} max={120} value={content.speed || 30} onChange={e => set('speed', parseInt(e.target.value) || 30)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Фон</Label><Input type="color" value={content.bgColor || '#fbbf24'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
              <div><Label>Текст</Label><Input type="color" value={content.textColor || '#1e293b'} onChange={e => set('textColor', e.target.value)} className="h-10" /></div>
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-3">
            <div><Label>Цитата</Label><Textarea value={content.text || ''} onChange={e => set('text', e.target.value)} rows={4} /></div>
            <div><Label>Автор</Label><Input value={content.author || ''} onChange={e => set('author', e.target.value)} /></div>
            <div><Label>Цвет фона</Label><Input type="color" value={content.bgColor || '#f1f5f9'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-3">
            <div><Label>Адрес</Label><Input value={content.address || ''} onChange={e => set('address', e.target.value)} /></div>
            <div><Label>Embed URL (Google Maps)</Label><Input value={content.embedUrl || ''} onChange={e => set('embedUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?..." /></div>
            <div><Label>Высота</Label><Input value={content.height || '400px'} onChange={e => set('height', e.target.value)} placeholder="400px" /></div>
          </div>
        );

      case 'columns':
        return (
          <div className="space-y-3">
            {(content.columns || []).map((col: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Заголовок" value={col.title} onChange={e => { const cols = [...(content.columns || [])]; cols[i] = { ...cols[i], title: e.target.value }; set('columns', cols); }} />
                  <Button size="icon" variant="ghost" onClick={() => set('columns', (content.columns || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea placeholder="Текст" rows={3} value={col.text} onChange={e => { const cols = [...(content.columns || [])]; cols[i] = { ...cols[i], text: e.target.value }; set('columns', cols); }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('columns', [...(content.columns || []), { title: '', text: '' }])}><Plus className="w-3 h-3 mr-1" /> Добавить колонку</Button>
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-3">
            <div><Label>Высота отступа</Label><Input value={content.height || '60px'} onChange={e => set('height', e.target.value)} placeholder="60px" /></div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div><Label>Текст кнопки</Label><Input value={content.buttonText || ''} onChange={e => set('buttonText', e.target.value)} /></div>
            <div><Label>Цвет фона</Label><Input type="color" value={content.bgColor || '#f8fafc'} onChange={e => set('bgColor', e.target.value)} className="h-10" /></div>
            <div><Label>Поля формы</Label></div>
            {(content.fields || []).map((field: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Название" value={field.label} onChange={e => { const fields = [...(content.fields || [])]; fields[i] = { ...fields[i], label: e.target.value }; set('fields', fields); }} />
                <select value={field.type || 'text'} onChange={e => { const fields = [...(content.fields || [])]; fields[i] = { ...fields[i], type: e.target.value }; set('fields', fields); }} className="px-2 py-1 border rounded text-sm">
                  <option value="text">Текст</option>
                  <option value="email">Email</option>
                  <option value="tel">Телефон</option>
                  <option value="number">Число</option>
                  <option value="textarea">Многостр.</option>
                </select>
                <Button size="icon" variant="ghost" onClick={() => set('fields', (content.fields || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('fields', [...(content.fields || []), { label: '', type: 'text' }])}><Plus className="w-3 h-3 mr-1" /> Добавить поле</Button>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-3">
            <div><Label>Заголовок</Label><Input value={content.title || ''} onChange={e => set('title', e.target.value)} /></div>
            {(content.images || []).map((img: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="URL изображения" value={img.url} onChange={e => { const images = [...(content.images || [])]; images[i] = { ...images[i], url: e.target.value }; set('images', images); }} />
                  <Button size="icon" variant="ghost" onClick={() => set('images', (content.images || []).filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Input placeholder="Подпись" value={img.caption || ''} onChange={e => { const images = [...(content.images || [])]; images[i] = { ...images[i], caption: e.target.value }; set('images', images); }} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set('images', [...(content.images || []), { url: '', caption: '' }])}><Plus className="w-3 h-3 mr-1" /> Добавить</Button>
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
      faq: 'FAQ', team: 'Команда', footer: 'Футер', divider: 'Разделитель', html: 'HTML код',
      stats: 'Статистика', logos: 'Партнёры', cta: 'Призыв (CTA)', timeline: 'Хронология',
      social: 'Соцсети', newsletter: 'Рассылка', banner: 'Баннер', tabs: 'Вкладки',
      accordion: 'Аккордеон', progress: 'Прогресс', comparison: 'Сравнение',
      marquee: 'Бегущая строка', quote: 'Цитата', map: 'Карта', columns: 'Колонки',
      spacer: 'Отступ', form: 'Форма'
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
