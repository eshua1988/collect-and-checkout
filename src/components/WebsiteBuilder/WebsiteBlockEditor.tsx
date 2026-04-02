import { useState } from 'react';
import { WebsiteBlock, WebsiteBlockExtra } from '@/types/website';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2 } from 'lucide-react';

export const EXTRA_TYPES: { type: WebsiteBlockExtra['type']; label: string; icon: string }[] = [
  { type: 'button', label: 'Кнопка', icon: '🔘' },
  { type: 'search', label: 'Поиск', icon: '🔍' },
  { type: 'text', label: 'Текст', icon: '📝' },
  { type: 'link', label: 'Ссылка', icon: '🔗' },
  { type: 'icon', label: 'Иконка', icon: '⭐' },
  { type: 'badge', label: 'Бейдж', icon: '🏷' },
  { type: 'social', label: 'Соцсети', icon: '💬' },
  { type: 'divider', label: 'Разделитель', icon: '—' },
];

export function newExtra(type: WebsiteBlockExtra['type']): WebsiteBlockExtra {
  switch (type) {
    case 'button': return { type, content: { text: 'Кнопка', href: '#', variant: 'primary' }, styles: { padding: '8px 20px', borderRadius: '8px' } };
    case 'search': return { type, content: { placeholder: 'Поиск...', buttonText: '🔍' }, styles: { maxWidth: '300px' } };
    case 'text': return { type, content: { text: 'Текст' }, styles: { fontSize: '14px' } };
    case 'link': return { type, content: { text: 'Ссылка', href: '#' }, styles: {} };
    case 'icon': return { type, content: { emoji: '⭐', size: '24px' }, styles: {} };
    case 'badge': return { type, content: { text: 'NEW', bgColor: '#ef4444', textColor: '#fff' }, styles: { borderRadius: '99px', padding: '2px 8px', fontSize: '10px' } };
    case 'social': return { type, content: { links: [{ icon: '📘', href: '#' }, { icon: '🐦', href: '#' }] }, styles: {} };
    case 'divider': return { type, content: { vertical: true }, styles: { height: '24px' } };
  }
}

interface WebsiteBlockEditorProps {
  block: WebsiteBlock;
  onUpdate: (block: WebsiteBlock) => void;
  onClose: () => void;
  inline?: boolean;
}

export function WebsiteBlockEditor({ block, onUpdate, onClose, inline }: WebsiteBlockEditorProps) {
  const [content, setContent] = useState({ ...block.content });
  const [styles, setStyles] = useState({ ...(block.styles || {}) });

  const save = () => onUpdate({ ...block, content, styles });

  const set = (key: string, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const setStyle = (key: string, value: any) => {
    setStyles(prev => ({ ...prev, [key]: value }));
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
          </div>
        );

      case 'navbar':
        return (
          <div className="space-y-3">
            <div><Label>Логотип / Название</Label><Input value={content.logo || ''} onChange={e => set('logo', e.target.value)} /></div>
            <div><Label>Текст кнопки CTA</Label><Input value={content.ctaText || ''} onChange={e => set('ctaText', e.target.value)} /></div>
            <div>
              <Label>Ссылки меню</Label>
              {(content.links || []).map((link: any, i: number) => (
                <div key={i} className="border rounded-lg p-3 mt-2 space-y-2 bg-muted/30">
                  <div className="flex gap-2">
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
                  {/* Mode selector */}
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground shrink-0">При наведении:</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant={(!link.mode || link.mode === 'navigate') ? 'default' : 'outline'} className="h-6 text-[10px] px-2" onClick={() => {
                        const links = [...(content.links || [])]; links[i] = { ...links[i], mode: 'navigate' }; set('links', links);
                      }}>Переход</Button>
                      <Button size="sm" variant={link.mode === 'megamenu' ? 'default' : 'outline'} className="h-6 text-[10px] px-2" onClick={() => {
                        const links = [...(content.links || [])];
                        links[i] = { ...links[i], mode: 'megamenu', sections: links[i].sections || [{ title: 'Раздел', links: [{ label: 'Ссылка', href: '#' }] }] };
                        set('links', links);
                      }}>Мега-меню</Button>
                    </div>
                  </div>
                  {/* Description for megamenu */}
                  {link.mode === 'megamenu' && (
                    <div>
                      <Label className="text-xs">Описание (слева)</Label>
                      <Textarea value={link.description || ''} onChange={e => {
                        const links = [...(content.links || [])]; links[i] = { ...links[i], description: e.target.value }; set('links', links);
                      }} rows={2} className="mt-1 text-xs" placeholder="Отображается как текст слева в мега-меню" />
                    </div>
                  )}
                  {/* Sections editor for megamenu */}
                  {link.mode === 'megamenu' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Колонки меню</Label>
                      {(link.sections || []).map((section: any, si: number) => (
                        <div key={si} className="border rounded p-2 space-y-1 bg-background">
                          <div className="flex gap-2 items-center">
                            <Input placeholder="Заголовок колонки" value={section.title || ''} className="h-7 text-xs font-semibold" onChange={e => {
                              const links = [...(content.links || [])];
                              const secs = [...(links[i].sections || [])]; secs[si] = { ...secs[si], title: e.target.value };
                              links[i] = { ...links[i], sections: secs }; set('links', links);
                            }} />
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                              const links = [...(content.links || [])];
                              links[i] = { ...links[i], sections: (links[i].sections || []).filter((_: any, j: number) => j !== si) };
                              set('links', links);
                            }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                          {(section.links || []).map((sl: any, li: number) => (
                            <div key={li} className="flex gap-1 items-center ml-2">
                              <Input placeholder="Текст" value={sl.label || ''} className="h-6 text-[11px]" onChange={e => {
                                const links = [...(content.links || [])];
                                const secs = [...(links[i].sections || [])];
                                const sLinks = [...(secs[si].links || [])]; sLinks[li] = { ...sLinks[li], label: e.target.value };
                                secs[si] = { ...secs[si], links: sLinks };
                                links[i] = { ...links[i], sections: secs }; set('links', links);
                              }} />
                              <Input placeholder="Ссылка" value={sl.href || ''} className="h-6 text-[11px] w-24" onChange={e => {
                                const links = [...(content.links || [])];
                                const secs = [...(links[i].sections || [])];
                                const sLinks = [...(secs[si].links || [])]; sLinks[li] = { ...sLinks[li], href: e.target.value };
                                secs[si] = { ...secs[si], links: sLinks };
                                links[i] = { ...links[i], sections: secs }; set('links', links);
                              }} />
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => {
                                const links = [...(content.links || [])];
                                const secs = [...(links[i].sections || [])];
                                secs[si] = { ...secs[si], links: (secs[si].links || []).filter((_: any, j: number) => j !== li) };
                                links[i] = { ...links[i], sections: secs }; set('links', links);
                              }}><Trash2 className="w-2.5 h-2.5" /></Button>
                            </div>
                          ))}
                          <Button size="sm" variant="ghost" className="h-5 text-[10px] ml-2" onClick={() => {
                            const links = [...(content.links || [])];
                            const secs = [...(links[i].sections || [])];
                            secs[si] = { ...secs[si], links: [...(secs[si].links || []), { label: 'Ссылка', href: '#' }] };
                            links[i] = { ...links[i], sections: secs }; set('links', links);
                          }}><Plus className="w-2.5 h-2.5 mr-1" /> Ссылка</Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => {
                        const links = [...(content.links || [])];
                        links[i] = { ...links[i], sections: [...(links[i].sections || []), { title: 'Раздел', links: [{ label: 'Ссылка', href: '#' }] }] };
                        set('links', links);
                      }}><Plus className="w-3 h-3 mr-1" /> Колонка</Button>
                    </div>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" className="mt-2" onClick={() => set('links', [...(content.links || []), { label: 'Ссылка', href: '#', mode: 'navigate' }])}>
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
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label>Изображение</Label>
              <div className="flex gap-1 mt-1">
                <Input value={content.src || ''} onChange={e => set('src', e.target.value)} placeholder="URL..." className="flex-1" />
                <label className="h-9 px-3 flex items-center gap-1 text-sm rounded border bg-muted/50 hover:bg-muted cursor-pointer shrink-0">
                  📁 Файл
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => set('src', ev.target?.result as string); r.readAsDataURL(f); } e.target.value = ''; }} />
                </label>
              </div>
              {content.src && <img src={content.src} className="mt-2 w-full h-24 object-contain rounded border" />}
            </div>
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
          </div>
        );

      case 'banner':
        return (
          <div className="space-y-3">
            <div><Label>Текст баннера</Label><Input value={content.text || ''} onChange={e => set('text', e.target.value)} /></div>
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
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-3">
            <div><Label>Цитата</Label><Textarea value={content.text || ''} onChange={e => set('text', e.target.value)} rows={4} /></div>
            <div><Label>Автор</Label><Input value={content.author || ''} onChange={e => set('author', e.target.value)} /></div>
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
        // Generic editor for custom AI-registered block types — edit all content properties dynamically
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm">🧩</span>
              <p className="text-xs text-muted-foreground">Кастомный блок <strong>{block.type}</strong> — все свойства доступны для редактирования</p>
            </div>

            {/* ─── Content properties ─── */}
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Содержимое</Label>
            {Object.entries(content).map(([key, val]) => (
              <div key={key}>
                <Label>{key}</Label>
                {typeof val === 'string' ? (
                  key.toLowerCase().includes('color') ? (
                    <Input type="color" value={val || '#000000'} onChange={e => set(key, e.target.value)} className="h-10 mt-1" />
                  ) : val.length > 80 ? (
                    <Textarea value={val} onChange={e => set(key, e.target.value)} rows={3} className="mt-1" />
                  ) : (
                    <Input value={val} onChange={e => set(key, e.target.value)} className="mt-1" />
                  )
                ) : typeof val === 'number' ? (
                  <Input type="number" value={val} onChange={e => set(key, Number(e.target.value))} className="mt-1" />
                ) : typeof val === 'boolean' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" checked={val} onChange={e => set(key, e.target.checked)} />
                    <span className="text-sm">{val ? 'Да' : 'Нет'}</span>
                  </div>
                ) : Array.isArray(val) ? (
                  <div className="space-y-2 mt-1">
                    {val.map((item: any, i: number) => (
                      <div key={i} className="border rounded-lg p-2 space-y-1">
                        {typeof item === 'object' && item !== null ? (
                          Object.entries(item).map(([ik, iv]) => (
                            <div key={ik} className="flex gap-2 items-center">
                              <span className="text-xs text-muted-foreground w-20 shrink-0">{ik}</span>
                              <Input value={String(iv ?? '')} onChange={e => {
                                const arr = [...val]; arr[i] = { ...arr[i], [ik]: e.target.value }; set(key, arr);
                              }} className="h-7 text-xs" />
                            </div>
                          ))
                        ) : (
                          <Input value={String(item)} onChange={e => { const arr = [...val]; arr[i] = e.target.value; set(key, arr); }} className="h-7 text-xs" />
                        )}
                        <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => set(key, val.filter((_: any, j: number) => j !== i))}>
                          <Trash2 className="w-3 h-3 mr-1" /> Удалить
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => {
                      const sample = val.length > 0 && typeof val[0] === 'object' ? Object.fromEntries(Object.keys(val[0]).map(k => [k, ''])) : '';
                      set(key, [...val, sample]);
                    }}><Plus className="w-3 h-3 mr-1" /> Добавить</Button>
                  </div>
                ) : typeof val === 'object' && val !== null ? (
                  <Textarea value={JSON.stringify(val, null, 2)} onChange={e => { try { set(key, JSON.parse(e.target.value)); } catch {} }} rows={4} className="mt-1 font-mono text-xs" />
                ) : null}
              </div>
            ))}
          </div>
        );
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

    const editorContent = (
      <>
        <div className={inline ? "flex items-center justify-between p-3 border-b" : "flex items-center justify-between p-4 border-b"}>
          <h3 className={inline ? "font-semibold text-sm truncate" : "font-semibold"}>{BLOCK_LABELS[block.type] || block.type}</h3>
          <Button size="icon" variant="ghost" onClick={onClose} className="shrink-0"><X className="w-4 h-4" /></Button>
        </div>
        <div className={inline ? "flex-1 overflow-y-auto p-3 space-y-3" : "flex-1 overflow-y-auto p-4 space-y-4"}>
          {renderEditor()}
        </div>
        <div className={inline ? "flex gap-2 p-3 border-t" : "flex gap-2 p-4 border-t"}>
          <Button variant="outline" onClick={onClose} className="flex-1" size={inline ? "sm" : "default"}>Отмена</Button>
          <Button onClick={save} className="flex-1" size={inline ? "sm" : "default"}>Сохранить</Button>
        </div>
      </>
    );

    if (inline) {
      return <div className="flex flex-col h-full">{editorContent}</div>;
    }

    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
          {editorContent}
        </div>
      </div>
    );
}
