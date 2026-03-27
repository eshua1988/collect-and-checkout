import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppWebsite, WebsiteBlock, WebsiteBlockType, WebsitePage } from '@/types/website';
import { useWebsitesStorage } from '@/hooks/useWebsitesStorage';
import { WebsitePreview } from '@/components/WebsiteBuilder/WebsitePreview';
import { WebsiteBlockEditor } from '@/components/WebsiteBuilder/WebsiteBlockEditor';
import { WEBSITE_TEMPLATES, TEMPLATE_CATEGORIES, TemplateCategory } from '@/components/WebsiteBuilder/WebsiteTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, Eye, Save, Copy, Link, GripVertical,
  Globe, Layout, Type, Image, Video, AlignLeft, Star, DollarSign,
  MessageSquare, Phone, Timer, Users, HelpCircle, Code2, Minus,
  ChevronUp, ChevronDown, Layers, ExternalLink, Smartphone, Monitor, Tablet,
  FileText
} from 'lucide-react';

const BLOCK_PALETTE: { type: WebsiteBlockType; label: string; icon: React.ReactNode; defaultContent: Record<string, any> }[] = [
  { type: 'navbar', label: 'Навигация', icon: <Layout className="w-4 h-4" />, defaultContent: { logo: 'Мой Сайт', links: [{ label: 'О нас', href: '#about' }, { label: 'Контакты', href: '#contact' }], bgColor: '#1e293b', textColor: '#ffffff' } },
  { type: 'hero', label: 'Герой-секция', icon: <Star className="w-4 h-4" />, defaultContent: { title: 'Заголовок страницы', subtitle: 'Краткое описание вашего продукта или услуги', ctaText: 'Начать', bgColor: '#1e293b', textColor: '#ffffff', align: 'center' } },
  { type: 'text', label: 'Текст', icon: <Type className="w-4 h-4" />, defaultContent: { title: 'Заголовок раздела', body: 'Опишите здесь ваш контент...', align: 'left' } },
  { type: 'image', label: 'Изображение', icon: <Image className="w-4 h-4" />, defaultContent: { src: '', caption: '' } },
  { type: 'gallery', label: 'Галерея', icon: <Layers className="w-4 h-4" />, defaultContent: { title: 'Галерея', images: [] } },
  { type: 'video', label: 'Видео', icon: <Video className="w-4 h-4" />, defaultContent: { url: '', title: '' } },
  { type: 'features', label: 'Преимущества', icon: <Star className="w-4 h-4" />, defaultContent: { title: 'Наши преимущества', items: [{ icon: '⭐', title: 'Преимущество 1', desc: 'Описание' }] } },
  { type: 'pricing', label: 'Тарифы', icon: <DollarSign className="w-4 h-4" />, defaultContent: { title: 'Тарифы', plans: [{ name: 'Базовый', price: '0₽', features: ['Функция 1'] }] } },
  { type: 'testimonials', label: 'Отзывы', icon: <MessageSquare className="w-4 h-4" />, defaultContent: { title: 'Отзывы клиентов', items: [{ name: 'Иван И.', text: 'Отличный продукт!', rating: 5 }] } },
  { type: 'team', label: 'Команда', icon: <Users className="w-4 h-4" />, defaultContent: { title: 'Наша команда', members: [{ name: 'Имя Фамилия', role: 'Должность', avatar: '👤' }] } },
  { type: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" />, defaultContent: { title: 'Часто задаваемые вопросы', items: [{ q: 'Вопрос?', a: 'Ответ' }] } },
  { type: 'countdown', label: 'Таймер', icon: <Timer className="w-4 h-4" />, defaultContent: { title: 'До события осталось', targetDate: new Date(Date.now() + 7 * 86400000).toISOString() } },
  { type: 'contact', label: 'Контакты', icon: <Phone className="w-4 h-4" />, defaultContent: { title: 'Свяжитесь с нами', email: '', phone: '' } },
  { type: 'button', label: 'Кнопка', icon: <AlignLeft className="w-4 h-4" />, defaultContent: { text: 'Нажмите здесь', href: '#', bgColor: '#4f46e5', align: 'center' } },
  { type: 'divider', label: 'Разделитель', icon: <Minus className="w-4 h-4" />, defaultContent: {} },
  { type: 'html', label: 'HTML код', icon: <Code2 className="w-4 h-4" />, defaultContent: { code: '<p>Вставьте HTML код</p>' } },
  { type: 'footer', label: 'Футер', icon: <AlignLeft className="w-4 h-4" />, defaultContent: { companyName: 'Моя Компания', copyright: `© ${new Date().getFullYear()} Все права защищены.`, links: [] } },
];

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type EditorTab = 'blocks' | 'templates' | 'settings';

interface WebsiteEditorProps {
  websiteId?: string;
}

export default function WebsiteEditor({ websiteId }: WebsiteEditorProps) {
  const navigate = useNavigate();
  const { saveWebsite, getWebsite, togglePublish } = useWebsitesStorage();

  const [website, setWebsite] = useState<AppWebsite>(() => {
    if (websiteId) {
      const existing = getWebsite(websiteId);
      if (existing) return existing;
    }
    return {
      id: `site_${Date.now()}`,
      name: 'Новый сайт',
      published: false,
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<WebsiteBlock | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeTab, setActiveTab] = useState<EditorTab>('blocks');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('all');
  const [showPreviewFull, setShowPreviewFull] = useState(false);
  const [currentPageSlug, setCurrentPageSlug] = useState('home');

  const hasPages = !!(website.pages && website.pages.length > 0);
  const currentPage = hasPages ? (website.pages!.find(p => p.slug === currentPageSlug) || website.pages![0]) : null;
  // Active blocks = current page's blocks (multi-page) or website.blocks (single-page)
  const activeBlocks = currentPage ? currentPage.blocks : website.blocks;

  const handleSave = () => {
    saveWebsite(website);
    toast.success('Сайт сохранён!');
  };

  const handlePublish = () => {
    const updated = { ...website, published: !website.published, updatedAt: Date.now() };
    setWebsite(updated);
    saveWebsite(updated);
    if (updated.published) {
      const url = `${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success('Сайт опубликован! Ссылка скопирована.');
    } else {
      toast.info('Сайт снят с публикации');
    }
  };

  const addBlock = (type: WebsiteBlockType, defaultContent: Record<string, any>) => {
    const newBlock: WebsiteBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      content: { ...defaultContent },
    };
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: [...p.blocks, newBlock] } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    }
    setSelectedBlockId(newBlock.id);
    toast.success(`Блок "${type}" добавлен`);
  };

  const deleteBlock = (id: string) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.filter(b => b.id !== id) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
    }
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, dir: 'up' | 'down') => {
    const updateBlocks = (blocks: WebsiteBlock[]) => {
      const arr = [...blocks];
      const idx = arr.findIndex(b => b.id === id);
      if (dir === 'up' && idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      if (dir === 'down' && idx < arr.length - 1) [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    };
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: updateBlocks(p.blocks) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: updateBlocks(prev.blocks) }));
    }
  };

  const updateBlock = (updated: WebsiteBlock) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.map(b => b.id === updated.id ? updated : b) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === updated.id ? updated : b) }));
    }
    setEditingBlock(null);
  };

  const addPage = () => {
    const slug = `page-${Date.now()}`;
    const newPage: WebsitePage = {
      id: `pg_${Date.now()}`,
      slug,
      title: 'Новая страница',
      blocks: [],
    };
    setWebsite(prev => ({
      ...prev,
      pages: [...(prev.pages || []), newPage],
    }));
    setCurrentPageSlug(slug);
    toast.success('Страница добавлена');
  };

  const deletePage = (slug: string) => {
    if (!hasPages) return;
    const remaining = website.pages!.filter(p => p.slug !== slug);
    if (remaining.length === 0) {
      toast.error('Нельзя удалить последнюю страницу');
      return;
    }
    setWebsite(prev => ({ ...prev, pages: remaining }));
    if (currentPageSlug === slug) setCurrentPageSlug(remaining[0].slug);
    toast.success('Страница удалена');
  };

  const renamePage = (slug: string, newTitle: string) => {
    setWebsite(prev => ({
      ...prev,
      pages: prev.pages!.map(p => p.slug === slug ? { ...p, title: newTitle } : p),
    }));
  };

  const loadTemplate = (templateId: string, mode: 'replace' | 'append') => {
    const tpl = WEBSITE_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    const newBlocks = tpl.blocks.map(b => ({ ...b, id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}` })) as WebsiteBlock[];
    if (mode === 'replace') {
      setWebsite(prev => ({ ...prev, name: tpl.name, blocks: newBlocks }));
      toast.success(`Шаблон "${tpl.name}" загружен`);
    } else {
      setWebsite(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));
      toast.success(`Блоки шаблона "${tpl.name}" добавлены`);
    }
  };

  const filteredTemplates = WEBSITE_TEMPLATES.filter(t => templateCategory === 'all' || t.category === templateCategory);

  const viewWidths: Record<ViewMode, string> = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto',
    mobile: 'max-w-[390px] mx-auto',
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="border-b bg-card px-4 h-14 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Globe className="w-5 h-5 text-primary" />
          <Input
            value={website.name}
            onChange={e => setWebsite(prev => ({ ...prev, name: e.target.value }))}
            className="h-8 w-48 font-semibold"
          />
        </div>

        {/* View mode */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreviewFull(true)}>
            <Eye className="w-4 h-4 mr-1" /> Просмотр
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> Сохранить
          </Button>
          <Button size="sm" onClick={handlePublish} variant={website.published ? 'secondary' : 'default'}>
            <Link className="w-4 h-4 mr-1" />
            {website.published ? 'Снять' : 'Опубликовать'}
          </Button>
          {website.published && (
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`); toast.success('Ссылка скопирована!'); }}>
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <aside className="w-72 border-r bg-card flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {([['blocks', 'Блоки'], ['templates', 'Шаблоны'], ['settings', 'Настройки']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* BLOCKS TAB */}
            {activeTab === 'blocks' && (
              <div className="p-3">
                {/* Page tabs for multi-page sites */}
                {hasPages && (
                  <div className="mb-3 pb-3 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">Страницы ({website.pages!.length})</p>
                      <button onClick={addPage} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Добавить</button>
                    </div>
                    <div className="space-y-1">
                      {website.pages!.map(page => (
                        <div
                          key={page.slug}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${currentPageSlug === page.slug ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}
                          onClick={() => { setCurrentPageSlug(page.slug); setSelectedBlockId(null); }}
                        >
                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-xs truncate font-medium">{page.title} <span className="text-muted-foreground font-normal">/{page.slug}</span></span>
                          {page.slug !== 'home' && (
                            <button onClick={e => { e.stopPropagation(); deletePage(page.slug); }} className="p-0.5 rounded hover:bg-destructive/20 text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mb-3">Нажмите на блок, чтобы добавить его на страницу{hasPages ? ` «${currentPage?.title}»` : ''}</p>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_PALETTE.map(({ type, label, icon, defaultContent }) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type, defaultContent)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-center group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {icon}
                      </div>
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Block list */}
                {activeBlocks.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Слои ({activeBlocks.length})</p>
                    <div className="space-y-1">
                      {activeBlocks.map((block, idx) => {
                        const palette = BLOCK_PALETTE.find(p => p.type === block.type);
                        return (
                          <div
                            key={block.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedBlockId === block.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}
                            onClick={() => setSelectedBlockId(block.id)}
                          >
                            <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="flex-1 text-xs truncate">{palette?.label || block.type}</span>
                            <div className="flex gap-0.5">
                              <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-30">
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={idx === activeBlocks.length - 1} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-30">
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); const b = activeBlocks.find(bl => bl.id === block.id); if (b) setEditingBlock(b); }} className="p-0.5 rounded hover:bg-primary/20 text-primary">
                                <AlignLeft className="w-3 h-3" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} className="p-0.5 rounded hover:bg-destructive/20 text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="p-3">
                <div className="flex flex-wrap gap-1 mb-3">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setTemplateCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${templateCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredTemplates.map(tpl => (
                    <div key={tpl.id} className="border rounded-xl p-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-3xl">{tpl.preview}</span>
                        <div>
                          <div className="font-medium text-sm">{tpl.name}</div>
                          <div className="text-xs text-muted-foreground">{tpl.description}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => loadTemplate(tpl.id, 'replace')}>Загрузить</Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => loadTemplate(tpl.id, 'append')}>Добавить</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="p-3 space-y-4">
                <div>
                  <Label className="text-xs">Название сайта</Label>
                  <Input value={website.name} onChange={e => setWebsite(prev => ({ ...prev, name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Описание</Label>
                  <Input value={website.description || ''} onChange={e => setWebsite(prev => ({ ...prev, description: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">SEO Заголовок</Label>
                  <Input value={website.seoTitle || ''} onChange={e => setWebsite(prev => ({ ...prev, seoTitle: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">SEO Описание</Label>
                  <Input value={website.seoDescription || ''} onChange={e => setWebsite(prev => ({ ...prev, seoDescription: e.target.value }))} className="mt-1" />
                </div>
                <div className="pt-3 border-t">
                  <Label className="text-xs font-semibold">Статус публикации</Label>
                  <div className={`mt-2 flex items-center gap-2 p-3 rounded-xl ${website.published ? 'bg-green-50 border border-green-200' : 'bg-muted border border-border'}`}>
                    <div className={`w-2 h-2 rounded-full ${website.published ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    <span className="text-sm">{website.published ? 'Опубликован' : 'Черновик'}</span>
                  </div>
                  {website.published && (
                    <div className="mt-2">
                      <Label className="text-xs">Ссылка на сайт</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={`${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`} readOnly className="text-xs" />
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`); toast.success('Скопировано!'); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`${import.meta.env.BASE_URL}site/${website.id}`, '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> Сохранить настройки
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4">
          <div className={`${viewWidths[viewMode]} transition-all duration-300 bg-background rounded-2xl shadow-xl overflow-hidden min-h-[600px] border`}>
            <WebsitePreview
              blocks={activeBlocks}
              pages={hasPages ? website.pages : undefined}
              currentPageSlug={currentPageSlug}
              onPageNavigate={(slug) => { setCurrentPageSlug(slug); setSelectedBlockId(null); }}
              onBlockClick={(id) => {
                setSelectedBlockId(id);
                const block = activeBlocks.find(b => b.id === id);
                if (block) setEditingBlock(block);
              }}
              selectedBlockId={selectedBlockId}
            />
            {activeBlocks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <Globe className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">Создайте свой сайт</h3>
                <p className="text-muted-foreground mb-6">Добавляйте блоки из панели слева или выберите готовый шаблон</p>
                <Button onClick={() => setActiveTab('templates')}>
                  <Layers className="w-4 h-4 mr-2" /> Выбрать шаблон
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Block Editor Modal */}
      {editingBlock && (
        <WebsiteBlockEditor
          block={editingBlock}
          onUpdate={updateBlock}
          onClose={() => setEditingBlock(null)}
        />
      )}

      {/* Full Preview Modal */}
      {showPreviewFull && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b bg-card">
            <span className="font-semibold">Предпросмотр: {website.name}</span>
            <Button variant="ghost" onClick={() => setShowPreviewFull(false)}>✕ Закрыть</Button>
          </div>
          <div className="flex-1 overflow-auto">
            <WebsitePreview blocks={activeBlocks} pages={hasPages ? website.pages : undefined} currentPageSlug={currentPageSlug} onPageNavigate={setCurrentPageSlug} />
          </div>
        </div>
      )}
    </div>
  );
}
