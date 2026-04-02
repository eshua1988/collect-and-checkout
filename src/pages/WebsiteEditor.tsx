import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppWebsite, WebsiteBlock, WebsiteBlockType, WebsitePage } from '@/types/website';
import { useWebsitesStorage } from '@/hooks/useWebsitesStorage';
import { WebsitePreview } from '@/components/WebsiteBuilder/WebsitePreview';
import { WebsiteBlockEditor, EXTRA_TYPES, newExtra } from '@/components/WebsiteBuilder/WebsiteBlockEditor';
import { WEBSITE_TEMPLATES, TEMPLATE_CATEGORIES, TemplateCategory } from '@/components/WebsiteBuilder/WebsiteTemplates';
import { getCustomBlockTypes } from '@/components/AIAssistant/useAIAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, Eye, Save, Copy, Link, GripVertical,
  Globe, Layout, Type, Image, Video, AlignLeft, AlignCenter, AlignRight, Star, DollarSign,
  MessageSquare, Phone, Timer, Users, HelpCircle, Code2, Minus,
  ChevronUp, ChevronDown, ChevronRight, Layers, ExternalLink, Smartphone, Monitor, Tablet,
  FileText, BarChart3, Award, Megaphone, GitBranch, Share2, Mail,
  Bell, PanelTop, ChevronsRight, ListChecks, Table2, MoveHorizontal,
  Quote, MapPin, Columns3, ClipboardList, ArrowUpDown
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
  { type: 'stats', label: 'Статистика', icon: <BarChart3 className="w-4 h-4" />, defaultContent: { title: 'Наши достижения', items: [{ value: '500+', label: 'Клиентов' }, { value: '10', label: 'Лет опыта' }, { value: '99%', label: 'Довольных' }], bgColor: '#4f46e5', textColor: '#ffffff' } },
  { type: 'logos', label: 'Партнёры', icon: <Award className="w-4 h-4" />, defaultContent: { title: 'Нам доверяют', items: [{ name: 'Компания 1', logo: '' }, { name: 'Компания 2', logo: '' }], grayscale: true } },
  { type: 'cta', label: 'Призыв (CTA)', icon: <Megaphone className="w-4 h-4" />, defaultContent: { title: 'Готовы начать?', subtitle: 'Присоединяйтесь к тысячам довольных клиентов', ctaText: 'Начать сейчас', ctaHref: '#', bgColor: '#7c3aed', textColor: '#ffffff' } },
  { type: 'timeline', label: 'Хронология', icon: <GitBranch className="w-4 h-4" />, defaultContent: { title: 'Как мы работаем', items: [{ title: 'Шаг 1', desc: 'Заявка', icon: '1️⃣' }, { title: 'Шаг 2', desc: 'Обсуждение', icon: '2️⃣' }, { title: 'Шаг 3', desc: 'Результат', icon: '3️⃣' }] } },
  { type: 'social', label: 'Соцсети', icon: <Share2 className="w-4 h-4" />, defaultContent: { title: 'Мы в соцсетях', links: [{ platform: 'Telegram', url: '', icon: '✈️' }, { platform: 'VK', url: '', icon: '💙' }, { platform: 'YouTube', url: '', icon: '🎬' }] } },
  { type: 'newsletter', label: 'Рассылка', icon: <Mail className="w-4 h-4" />, defaultContent: { title: 'Подпишитесь на рассылку', subtitle: 'Будьте в курсе новостей и акций', buttonText: 'Подписаться', bgColor: '#f8fafc' } },
  { type: 'banner', label: 'Баннер', icon: <Bell className="w-4 h-4" />, defaultContent: { text: '🔥 Специальное предложение! Скидка 20% до конца месяца', bgColor: '#ef4444', textColor: '#ffffff', closable: true } },
  { type: 'tabs', label: 'Вкладки', icon: <PanelTop className="w-4 h-4" />, defaultContent: { tabs: [{ title: 'Вкладка 1', content: 'Содержимое первой вкладки' }, { title: 'Вкладка 2', content: 'Содержимое второй вкладки' }] } },
  { type: 'accordion', label: 'Аккордеон', icon: <ChevronsRight className="w-4 h-4" />, defaultContent: { title: 'Подробнее', items: [{ title: 'Раздел 1', content: 'Содержимое раздела 1' }, { title: 'Раздел 2', content: 'Содержимое раздела 2' }] } },
  { type: 'progress', label: 'Прогресс', icon: <ListChecks className="w-4 h-4" />, defaultContent: { title: 'Наши навыки', items: [{ label: 'Дизайн', value: 90, color: '#4f46e5' }, { label: 'Разработка', value: 85, color: '#7c3aed' }, { label: 'Маркетинг', value: 70, color: '#06b6d4' }] } },
  { type: 'comparison', label: 'Сравнение', icon: <Table2 className="w-4 h-4" />, defaultContent: { title: 'Сравнение тарифов', columns: ['Бесплатный', 'Про'], rows: [{ feature: 'Пользователи', values: ['1', 'Безлимит'] }, { feature: 'Хранилище', values: ['1 ГБ', '100 ГБ'] }] } },
  { type: 'marquee', label: 'Бегущая строка', icon: <MoveHorizontal className="w-4 h-4" />, defaultContent: { text: '⚡ Добро пожаловать! • Специальные предложения • Новинки каталога • Бесплатная доставка ⚡', speed: 30, bgColor: '#fbbf24', textColor: '#1e293b' } },
  { type: 'quote', label: 'Цитата', icon: <Quote className="w-4 h-4" />, defaultContent: { text: 'Лучший способ предсказать будущее — создать его.', author: 'Питер Друкер', bgColor: '#f1f5f9' } },
  { type: 'map', label: 'Карта', icon: <MapPin className="w-4 h-4" />, defaultContent: { address: 'Москва, Россия', embedUrl: '', height: '400px' } },
  { type: 'columns', label: 'Колонки', icon: <Columns3 className="w-4 h-4" />, defaultContent: { columns: [{ title: 'Колонка 1', text: 'Содержимое первой колонки' }, { title: 'Колонка 2', text: 'Содержимое второй колонки' }] } },
  { type: 'spacer', label: 'Отступ', icon: <ArrowUpDown className="w-4 h-4" />, defaultContent: { height: '60px' } },
  { type: 'form', label: 'Форма', icon: <ClipboardList className="w-4 h-4" />, defaultContent: { title: 'Оставьте заявку', fields: [{ label: 'Имя', type: 'text' }, { label: 'Email', type: 'email' }, { label: 'Сообщение', type: 'textarea' }], buttonText: 'Отправить', bgColor: '#f8fafc' } },
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
  const [expandedPages, setExpandedPages] = useState<Set<string>>(() => {
    try { const s = sessionStorage.getItem('ws_expandedPages'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const [sidebarWidth, setSidebarWidth] = useState(288); // 288px = w-72
  const isResizing = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dropIndicator, setDropIndicator] = useState<{ x: number; y: number } | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    try { const s = sessionStorage.getItem('ws_openSections'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const toggleSection = (key: string) => setOpenSections(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); sessionStorage.setItem('ws_openSections', JSON.stringify([...n])); return n; });

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const newW = Math.min(600, Math.max(180, startW + (ev.clientX - startX)));
      setSidebarWidth(newW);
    };
    const onUp = () => { isResizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  // Sync website state when AI updates it externally (REPLACE_WEBSITE, ADD_WEBSITE_BLOCKS, etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id === website.id) {
        const fresh = getWebsite(website.id);
        if (fresh && fresh.updatedAt !== website.updatedAt) {
          setWebsite(fresh);
        }
      }
    };
    window.addEventListener('websiteStorageUpdated', handler);
    return () => window.removeEventListener('websiteStorageUpdated', handler);
  }, [website.id, website.updatedAt, getWebsite]);

  // Custom AI-registered block types
  const [customBlocks, setCustomBlocks] = useState(() => getCustomBlockTypes());
  useEffect(() => {
    const handler = () => setCustomBlocks(getCustomBlockTypes());
    window.addEventListener('customBlockTypesUpdated', handler);
    return () => window.removeEventListener('customBlockTypesUpdated', handler);
  }, []);

  // Merge built-in + custom block palette
  const fullBlockPalette = [
    ...BLOCK_PALETTE,
    ...Object.entries(customBlocks).map(([type, meta]) => ({
      type: type as WebsiteBlockType,
      label: meta.label,
      icon: <span className="text-sm">{meta.icon || '🧩'}</span>,
      defaultContent: meta.defaultContent || {},
    })),
  ];

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
    setSelectedBlockId(null);
  };

  // Live position update (from drag move on canvas)
  const updateBlockPosition = useCallback((blockId: string, pos: { x: number; y: number }) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, position: pos } : b) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === blockId ? { ...b, position: pos } : b) }));
    }
  }, [hasPages, currentPage]);

  // Canvas drop handlers
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDropIndicator({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleCanvasDragLeave = useCallback(() => {
    setDropIndicator(null);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropIndicator(null);
    const raw = e.dataTransfer.getData('application/block-type');
    if (!raw) return;
    try {
      const { type, defaultContent: dc } = JSON.parse(raw);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newBlock: WebsiteBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type,
        content: { ...(dc || {}) },
        position: { x: Math.max(0, x - 80), y: Math.max(0, y - 20) },
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
    } catch {}
  }, [hasPages, currentPage]);

  // Live style update (from drag resize) — doesn't close editor
  const updateBlockStyles = useCallback((blockId: string, newStyles: Record<string, string>) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, styles: newStyles } : b) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === blockId ? { ...b, styles: newStyles } : b) }));
    }
  }, [hasPages, currentPage]);

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
        <aside style={{ width: sidebarWidth }} className="border-r bg-card flex flex-col shrink-0 overflow-hidden relative">
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
              <div className="p-3 space-y-2">
                {/* Page tabs for multi-page sites */}
                {hasPages && (
                  <div>
                    <button onClick={() => toggleSection('pages')} className="w-full flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-1.5">
                        {openSections.has('pages') ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span className="text-xs font-medium text-muted-foreground">Страницы ({website.pages!.length})</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); addPage(); }} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Добавить</button>
                    </button>
                    {openSections.has('pages') && (
                    <div className="space-y-0.5">
                      {website.pages!.map(page => {
                        const isExpanded = expandedPages.has(page.slug);
                        const isActive = currentPageSlug === page.slug;
                        const pageBlocks = page.blocks || [];
                        return (
                          <div key={page.slug}>
                            {/* Page header row */}
                            <div
                              className={`flex items-center gap-1 p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}
                              onClick={() => {
                                setCurrentPageSlug(page.slug);
                                setSelectedBlockId(null);
                              }}
                            >
                              <span
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} p-0.5 rounded hover:bg-muted-foreground/20`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPages(prev => {
                                    const next = new Set(prev);
                                    if (next.has(page.slug)) next.delete(page.slug); else next.add(page.slug);
                                    sessionStorage.setItem('ws_expandedPages', JSON.stringify([...next]));
                                    return next;
                                  });
                                }}
                              >
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              </span>
                              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="flex-1 text-xs truncate font-medium">{page.title}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{pageBlocks.length}</span>
                              {page.slug !== 'home' && (
                                <button onClick={e => { e.stopPropagation(); deletePage(page.slug); }} className="p-0.5 rounded hover:bg-destructive/20 text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {/* Expanded block list */}
                            {isExpanded && pageBlocks.length > 0 && (
                              <div className="ml-4 pl-2 border-l border-border/50 space-y-0.5 mt-0.5 mb-1">
                                {pageBlocks.map((block, idx) => {
                                  const palette = fullBlockPalette.find(p => p.type === block.type);
                                  const blockTitle = (block.content as any)?.title || (block.content as any)?.logo || (block.content as any)?.text?.slice?.(0, 20) || palette?.label || block.type;
                                  return (
                                    <div
                                      key={block.id}
                                      className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-xs ${selectedBlockId === block.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentPageSlug(page.slug);
                                        setSelectedBlockId(block.id);
                                      }}
                                    >
                                      <GripVertical className="w-2.5 h-2.5 shrink-0 opacity-50" />
                                      <span className="w-3 h-3 shrink-0 flex items-center justify-center">{palette?.icon}</span>
                                      <span className="flex-1 truncate">{blockTitle}</span>
                                      <div className="flex gap-0.5 shrink-0">
                                        <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-20">
                                          <ChevronUp className="w-2.5 h-2.5" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={idx === pageBlocks.length - 1} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-20">
                                          <ChevronDown className="w-2.5 h-2.5" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setEditingBlock(block); setActiveTab('settings'); }} className="p-0.5 rounded hover:bg-primary/20 text-primary">
                                          <AlignLeft className="w-2.5 h-2.5" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} className="p-0.5 rounded hover:bg-destructive/20 text-destructive">
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {isExpanded && pageBlocks.length === 0 && (
                              <p className="ml-6 text-[10px] text-muted-foreground py-1">Пусто — добавьте блоки ниже</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                )}

                {/* Single-page block list (no pages) */}
                {!hasPages && activeBlocks.length > 0 && (
                  <div>
                    <button onClick={() => toggleSection('blocklist')} className="w-full flex items-center gap-1.5 py-1.5">
                      {openSections.has('blocklist') ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="text-xs font-medium text-muted-foreground">Блоки ({activeBlocks.length})</span>
                    </button>
                    {openSections.has('blocklist') && (
                    <div className="space-y-0.5">
                      {activeBlocks.map((block, idx) => {
                        const palette = fullBlockPalette.find(p => p.type === block.type);
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
                              <button onClick={e => { e.stopPropagation(); setEditingBlock(block); setActiveTab('settings'); }} className="p-0.5 rounded hover:bg-primary/20 text-primary">
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
                    )}
                  </div>
                )}

                {/* Block palette — collapsible */}
                <div>
                  <button onClick={() => toggleSection('palette')} className="w-full flex items-center gap-1.5 py-1.5">
                    {openSections.has('palette') ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-xs font-medium text-muted-foreground">Добавить блок</span>
                  </button>
                  {openSections.has('palette') && (
                  <>
                <p className="text-xs text-muted-foreground mb-2">Нажмите или перетащите на канвас{hasPages ? ` «${currentPage?.title}»` : ''}</p>
                <div className="grid grid-cols-2 gap-2">
                  {fullBlockPalette.map(({ type, label, icon, defaultContent }) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type, defaultContent)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/block-type', JSON.stringify({ type, defaultContent }));
                        e.dataTransfer.setData('application/tool-config', JSON.stringify({ category: 'website', type, label }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-center group cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {icon}
                      </div>
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
                  </>
                  )}
                </div>
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="p-3 space-y-2">
                <div className="flex flex-wrap gap-1 mb-1">
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
                {filteredTemplates.map(tpl => (
                  <div key={tpl.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(`tpl-${tpl.id}`)}
                      className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {openSections.has(`tpl-${tpl.id}`) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <span className="text-lg">{tpl.preview}</span>
                      <span className="flex-1 truncate">{tpl.name}</span>
                    </button>
                    {openSections.has(`tpl-${tpl.id}`) && (
                      <div className="p-3 border-t space-y-2">
                        <p className="text-xs text-muted-foreground">{tpl.description}</p>
                        <div className="flex gap-1.5">
                          <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => loadTemplate(tpl.id, 'replace')}>Загрузить</Button>
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => loadTemplate(tpl.id, 'append')}>Добавить</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="p-3 space-y-2">
                {/* Block Editor — shown when editing a block */}
                {editingBlock && (
                  <div className="border rounded-lg overflow-hidden">
                    <WebsiteBlockEditor
                      key={editingBlock.id}
                      block={editingBlock}
                      onUpdate={updateBlock}
                      onClose={() => setEditingBlock(null)}
                      inline
                    />
                  </div>
                )}

                {/* ─── Размер / Стили / Встроенные — always visible, work on selected block ─── */}
                {(() => {
                  const selBlock = editingBlock || activeBlocks.find(b => b.id === selectedBlockId);
                  const blockStyles = selBlock?.styles || {};
                  const blockContent = selBlock?.content || {};
                  const blockExtras = selBlock?.extras || [];
                  const normPx = (v: string) => { const t = v.trim(); if (!t) return t; return t.split(/\s+/).map(s => /^\d+(\.\d+)?$/.test(s) ? s + 'px' : s).join(' '); };
                  const updateSelBlock = (updates: Partial<WebsiteBlock>) => {
                    if (!selBlock) return;
                    const updated = { ...selBlock, ...updates };
                    if (hasPages && currentPage) {
                      setWebsite(prev => ({
                        ...prev,
                        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.map(b => b.id === selBlock.id ? updated : b) } : p),
                      }));
                    } else {
                      setWebsite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === selBlock.id ? updated : b) }));
                    }
                    if (editingBlock?.id === selBlock.id) setEditingBlock(updated);
                  };
                  const setBlockStyle = (key: string, value: string) => updateSelBlock({ styles: { ...blockStyles, [key]: value } });
                  const setBlockContent = (key: string, value: any) => updateSelBlock({ content: { ...blockContent, [key]: value } });

                  return (
                    <>
                      {/* Размер */}
                      <div className="border rounded-lg overflow-hidden">
                        <button onClick={() => toggleSection('set-size')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                          {openSections.has('set-size') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          📐 Размер
                        </button>
                        {openSections.has('set-size') && (
                          <div className="p-3 space-y-3 border-t">
                            {selBlock ? (<>
                              <p className="text-[10px] text-muted-foreground">Блок: {selBlock.type}</p>
                              <div><Label className="text-xs">Отступы (padding)</Label><Input value={blockStyles.padding || ''} onChange={e => setBlockStyle('padding', e.target.value)} onBlur={e => { const n = normPx(e.target.value); if (n !== e.target.value) setBlockStyle('padding', n); }} placeholder="16px 24px" className="mt-1 text-xs" /></div>
                              <div><Label className="text-xs">Мин. высота</Label><Input value={blockStyles.minHeight || ''} onChange={e => setBlockStyle('minHeight', e.target.value)} onBlur={e => { const n = normPx(e.target.value); if (n !== e.target.value) setBlockStyle('minHeight', n); }} placeholder="200px" className="mt-1 text-xs" /></div>
                              <div><Label className="text-xs">Макс. ширина</Label><Input value={blockStyles.maxWidth || ''} onChange={e => setBlockStyle('maxWidth', e.target.value)} onBlur={e => { const n = normPx(e.target.value); if (n !== e.target.value) setBlockStyle('maxWidth', n); }} placeholder="1200px" className="mt-1 text-xs" /></div>
                            </>) : (
                              <p className="text-xs text-muted-foreground text-center py-2">Выберите блок</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Стили */}
                      <div className="border rounded-lg overflow-hidden">
                        <button onClick={() => toggleSection('set-styles')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                          {openSections.has('set-styles') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          🎨 Стили
                        </button>
                        {openSections.has('set-styles') && (
                          <div className="p-3 space-y-3 border-t">
                            {selBlock ? (<>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-xs">Фон</Label><Input type="color" value={blockContent.bgColor || blockStyles.bgColor || blockStyles.backgroundColor || '#ffffff'} onChange={e => updateSelBlock({ content: { ...blockContent, bgColor: e.target.value }, styles: { ...blockStyles, bgColor: e.target.value } })} className="h-9 mt-1 cursor-pointer" /></div>
                                <div><Label className="text-xs">Текст</Label><Input type="color" value={blockContent.textColor || blockStyles.textColor || blockStyles.color || '#1e293b'} onChange={e => updateSelBlock({ content: { ...blockContent, textColor: e.target.value }, styles: { ...blockStyles, textColor: e.target.value } })} className="h-9 mt-1 cursor-pointer" /></div>
                              </div>
                              {(blockContent.align !== undefined || ['hero', 'text', 'button', 'cta', 'newsletter', 'quote'].includes(selBlock.type)) && (
                                <div>
                                  <Label className="text-xs">Выравнивание</Label>
                                  <div className="flex gap-1 mt-1">
                                    {([['left', 'AlignLeft'], ['center', 'AlignCenter'], ['right', 'AlignRight']] as const).map(([a]) => (
                                      <Button key={a} size="icon" variant={blockContent.align === a ? 'default' : 'outline'} onClick={() => setBlockContent('align', a)} className="h-8 w-8">
                                        {a === 'left' ? <AlignLeft className="w-4 h-4" /> : a === 'center' ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-xs">Скругление</Label><Input value={blockStyles.borderRadius || ''} onChange={e => setBlockStyle('borderRadius', e.target.value)} onBlur={e => { const n = normPx(e.target.value); if (n !== e.target.value) setBlockStyle('borderRadius', n); }} placeholder="8px" className="mt-1 text-xs" /></div>
                                <div><Label className="text-xs">Тень</Label>
                                  <select value={blockStyles.boxShadow || ''} onChange={e => setBlockStyle('boxShadow', e.target.value)} className="w-full mt-1 h-8 text-xs rounded border bg-background px-2">
                                    <option value="">Нет</option>
                                    <option value="0 1px 3px rgba(0,0,0,0.1)">Лёгкая</option>
                                    <option value="0 4px 12px rgba(0,0,0,0.15)">Средняя</option>
                                    <option value="0 10px 30px rgba(0,0,0,0.2)">Большая</option>
                                  </select>
                                </div>
                              </div>
                              <div><Label className="text-xs">Рамка</Label><Input value={blockStyles.border || ''} onChange={e => setBlockStyle('border', e.target.value)} placeholder="1px solid #e2e8f0" className="mt-1 text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-xs">Размер шрифта</Label><Input value={blockStyles.fontSize || ''} onChange={e => setBlockStyle('fontSize', e.target.value)} onBlur={e => { const n = normPx(e.target.value); if (n !== e.target.value) setBlockStyle('fontSize', n); }} placeholder="16px" className="mt-1 text-xs" /></div>
                                <div><Label className="text-xs">Прозрачность</Label><Input type="range" min="0" max="1" step="0.05" value={blockStyles.opacity || '1'} onChange={e => setBlockStyle('opacity', e.target.value)} className="mt-2" /></div>
                              </div>
                              {/* Фоновое изображение */}
                              <div>
                                <Label className="text-xs">🖼️ Фоновое изображение</Label>
                                {blockStyles.backgroundImage ? (
                                  <div className="mt-1 space-y-1">
                                    <div className="relative w-full h-20 rounded border overflow-hidden">
                                      <img src={blockStyles.backgroundImage.replace(/^url\(['"]?|['"]?\)$/g, '')} className="w-full h-full object-cover" />
                                      <button onClick={() => { const s = { ...blockStyles }; delete s.backgroundImage; delete s.backgroundSize; delete s.backgroundPosition; updateSelBlock({ styles: s }); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/80">×</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      <select value={blockStyles.backgroundSize || 'cover'} onChange={e => setBlockStyle('backgroundSize', e.target.value)} className="h-7 text-[10px] rounded border bg-background px-1"><option value="cover">Cover</option><option value="contain">Contain</option><option value="auto">Auto</option></select>
                                      <select value={blockStyles.backgroundPosition || 'center'} onChange={e => setBlockStyle('backgroundPosition', e.target.value)} className="h-7 text-[10px] rounded border bg-background px-1"><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-1 flex gap-1">
                                    <Input value={''} onChange={e => { if (e.target.value) setBlockStyle('backgroundImage', `url(${e.target.value})`); }} placeholder="URL..." className="text-xs h-8 flex-1" />
                                    <label className="h-8 px-2 flex items-center gap-1 text-xs rounded border bg-muted/50 hover:bg-muted cursor-pointer shrink-0">
                                      📁
                                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => { setBlockStyle('backgroundImage', `url(${ev.target?.result})`); setBlockStyle('backgroundSize', 'cover'); setBlockStyle('backgroundPosition', 'center'); }; r.readAsDataURL(f); } e.target.value = ''; }} />
                                    </label>
                                  </div>
                                )}
                              </div>
                              {/* Картинка поверх блока */}
                              <div>
                                <Label className="text-xs">📷 Картинка в блоке</Label>
                                {blockContent.overlayImage ? (
                                  <div className="mt-1 space-y-1">
                                    <div className="relative w-full h-20 rounded border overflow-hidden">
                                      <img src={blockContent.overlayImage} className="w-full h-full object-contain" />
                                      <button onClick={() => setBlockContent('overlayImage', '')} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/80">×</button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                      <select value={blockContent.overlayPosition || 'bottom'} onChange={e => setBlockContent('overlayPosition', e.target.value)} className="h-7 text-[10px] rounded border bg-background px-1"><option value="top">Сверху</option><option value="bottom">Снизу</option><option value="left">Слева</option><option value="right">Справа</option><option value="center">Центр</option></select>
                                      <Input value={blockContent.overlayMaxWidth || '100%'} onChange={e => setBlockContent('overlayMaxWidth', e.target.value)} className="h-7 text-[10px]" placeholder="100%" />
                                      <Input value={blockContent.overlayBorderRadius || ''} onChange={e => setBlockContent('overlayBorderRadius', e.target.value)} className="h-7 text-[10px]" placeholder="8px" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-1 flex gap-1">
                                    <Input value={''} onChange={e => { if (e.target.value) setBlockContent('overlayImage', e.target.value); }} placeholder="URL..." className="text-xs h-8 flex-1" />
                                    <label className="h-8 px-2 flex items-center gap-1 text-xs rounded border bg-muted/50 hover:bg-muted cursor-pointer shrink-0">
                                      📁
                                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setBlockContent('overlayImage', ev.target?.result as string); r.readAsDataURL(f); } e.target.value = ''; }} />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </>) : (
                              <p className="text-xs text-muted-foreground text-center py-2">Выберите блок</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Встроенные элементы */}
                      <div className="border rounded-lg overflow-hidden">
                        <button onClick={() => toggleSection('set-extras')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                          {openSections.has('set-extras') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          ✨ Встроенные элементы ({selBlock ? blockExtras.length : 0})
                        </button>
                        {openSections.has('set-extras') && (
                          <div className="p-3 space-y-2 border-t">
                            {selBlock ? (<>
                              {blockExtras.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">Нет элементов. Добавьте кнопку, поиск, значок и др.</p>
                              )}
                              {blockExtras.map((extra, ei) => (
                                <div key={ei} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{EXTRA_TYPES.find(t => t.type === extra.type)?.icon || '📦'}</span>
                                    <span className="text-xs font-medium flex-1">{EXTRA_TYPES.find(t => t.type === extra.type)?.label || extra.type}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                      if (ei > 0) { const arr = [...blockExtras]; [arr[ei - 1], arr[ei]] = [arr[ei], arr[ei - 1]]; updateSelBlock({ extras: arr }); }
                                    }}>↑</Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                      if (ei < blockExtras.length - 1) { const arr = [...blockExtras]; [arr[ei], arr[ei + 1]] = [arr[ei + 1], arr[ei]]; updateSelBlock({ extras: arr }); }
                                    }}>↓</Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => updateSelBlock({ extras: blockExtras.filter((_, j) => j !== ei) })}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  {Object.entries(extra.content || {}).map(([k, v]) => (
                                    <div key={k} className="flex gap-2 items-center">
                                      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{k}</span>
                                      {typeof v === 'boolean' ? (
                                        <input type="checkbox" checked={v} onChange={e => {
                                          const arr = [...blockExtras]; arr[ei] = { ...arr[ei], content: { ...arr[ei].content, [k]: e.target.checked } }; updateSelBlock({ extras: arr });
                                        }} />
                                      ) : typeof v === 'string' && k.toLowerCase().includes('color') ? (
                                        <Input type="color" value={v || '#000000'} className="h-6 w-16" onChange={e => {
                                          const arr = [...blockExtras]; arr[ei] = { ...arr[ei], content: { ...arr[ei].content, [k]: e.target.value } }; updateSelBlock({ extras: arr });
                                        }} />
                                      ) : typeof v === 'string' || typeof v === 'number' ? (
                                        <Input value={String(v)} className="h-6 text-[11px]" onChange={e => {
                                          const arr = [...blockExtras]; arr[ei] = { ...arr[ei], content: { ...arr[ei].content, [k]: typeof v === 'number' ? Number(e.target.value) : e.target.value } }; updateSelBlock({ extras: arr });
                                        }} />
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ))}
                              {openSections.has('set-extras-add') ? (
                                <div className="grid grid-cols-4 gap-1 p-2 border rounded-lg bg-background">
                                  {EXTRA_TYPES.map(et => (
                                    <button key={et.type} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted transition-colors text-center" onClick={() => {
                                      updateSelBlock({ extras: [...blockExtras, newExtra(et.type)] });
                                      toggleSection('set-extras-add');
                                    }}>
                                      <span className="text-lg">{et.icon}</span>
                                      <span className="text-[10px]">{et.label}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" className="w-full" onClick={() => toggleSection('set-extras-add')}>
                                  <Plus className="w-3 h-3 mr-1" /> Добавить элемент
                                </Button>
                              )}
                            </>) : (
                              <p className="text-xs text-muted-foreground text-center py-2">Выберите блок</p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* ─── Страница ─── */}
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleSection('set-page')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                    {openSections.has('set-page') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    📄 Страница
                  </button>
                  {openSections.has('set-page') && (
                    <div className="p-3 space-y-3 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Фон страницы</Label><Input type="color" value={website.globalStyles?.backgroundColor || '#ffffff'} onChange={e => setWebsite(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, backgroundColor: e.target.value } }))} className="h-9 mt-1 cursor-pointer" /></div>
                        <div><Label className="text-xs">Цвет текста</Label><Input type="color" value={website.globalStyles?.textColor || '#1e293b'} onChange={e => setWebsite(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, textColor: e.target.value } }))} className="h-9 mt-1 cursor-pointer" /></div>
                      </div>
                      <div><Label className="text-xs">Шрифт</Label>
                        <select value={website.globalStyles?.fontFamily || ''} onChange={e => setWebsite(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, fontFamily: e.target.value } }))} className="w-full mt-1 h-8 text-xs rounded border bg-background px-2">
                          <option value="">По умолчанию</option>
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="'Roboto', sans-serif">Roboto</option>
                          <option value="'Open Sans', sans-serif">Open Sans</option>
                          <option value="'Montserrat', sans-serif">Montserrat</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="'Merriweather', serif">Merriweather</option>
                          <option value="'Fira Code', monospace">Fira Code</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="'Comic Sans MS', cursive">Comic Sans</option>
                        </select>
                      </div>
                      <div><Label className="text-xs">Макс. ширина контента</Label><Input value={website.globalStyles?.maxWidth || ''} onChange={e => setWebsite(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, maxWidth: e.target.value } }))} onBlur={e => { const t = e.target.value.trim(); if (t && /^\d+(\.\d+)?$/.test(t)) setWebsite(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, maxWidth: t + 'px' } })); }} placeholder="1200px" className="mt-1 text-xs" /></div>
                      <div><Label className="text-xs">Скругление (глобальное)</Label><Input value={website.globalStyles?.borderRadius || ''} onChange={e => setWebsite(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, borderRadius: e.target.value } }))} onBlur={e => { const t = e.target.value.trim(); if (t && /^\d+(\.\d+)?$/.test(t)) setWebsite(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, borderRadius: t + 'px' } })); }} placeholder="8px" className="mt-1 text-xs" /></div>
                    </div>
                  )}
                </div>

                {/* ─── Проект ─── */}
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleSection('set-project')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                    {openSections.has('set-project') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    📁 Проект
                  </button>
                  {openSections.has('set-project') && (
                  <div className="p-3 space-y-2 border-t">
                    {/* Основные */}
                    <div className="border rounded-lg overflow-hidden">
                      <button onClick={() => toggleSection('set-basic')} className="w-full flex items-center gap-2 p-2 text-left text-[11px] font-medium hover:bg-muted/50 transition-colors">
                        {openSections.has('set-basic') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        📝 Основные
                      </button>
                      {openSections.has('set-basic') && (
                      <div className="p-3 space-y-3 border-t">
                        <div>
                          <Label className="text-xs">Название сайта</Label>
                          <Input value={website.name} onChange={e => setWebsite(prev => ({ ...prev, name: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Описание</Label>
                          <Input value={website.description || ''} onChange={e => setWebsite(prev => ({ ...prev, description: e.target.value }))} className="mt-1" />
                        </div>
                      </div>
                      )}
                    </div>
                    {/* SEO */}
                    <div className="border rounded-lg overflow-hidden">
                      <button onClick={() => toggleSection('set-seo')} className="w-full flex items-center gap-2 p-2 text-left text-[11px] font-medium hover:bg-muted/50 transition-colors">
                        {openSections.has('set-seo') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        🔍 SEO
                      </button>
                      {openSections.has('set-seo') && (
                      <div className="p-3 space-y-3 border-t">
                        <div>
                          <Label className="text-xs">SEO Заголовок</Label>
                          <Input value={website.seoTitle || ''} onChange={e => setWebsite(prev => ({ ...prev, seoTitle: e.target.value }))} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">SEO Описание</Label>
                          <Input value={website.seoDescription || ''} onChange={e => setWebsite(prev => ({ ...prev, seoDescription: e.target.value }))} className="mt-1" />
                        </div>
                      </div>
                      )}
                    </div>
                    {/* Публикация */}
                    <div className="border rounded-lg overflow-hidden">
                      <button onClick={() => toggleSection('set-publish')} className="w-full flex items-center gap-2 p-2 text-left text-[11px] font-medium hover:bg-muted/50 transition-colors">
                        {openSections.has('set-publish') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        🌐 Публикация
                      </button>
                      {openSections.has('set-publish') && (
                      <div className="p-3 space-y-3 border-t">
                        <div className={`flex items-center gap-2 p-3 rounded-xl ${website.published ? 'bg-green-50 border border-green-200' : 'bg-muted border border-border'}`}>
                          <div className={`w-2 h-2 rounded-full ${website.published ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                          <span className="text-sm">{website.published ? 'Опубликован' : 'Черновик'}</span>
                        </div>
                        {website.published && (
                          <div>
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
                      )}
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" /> Сохранить настройки
                    </Button>
                  </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Resize Handle */}
        <div
          onMouseDown={startResize}
          className="w-1.5 hover:w-2 bg-transparent hover:bg-primary/20 active:bg-primary/40 cursor-col-resize shrink-0 transition-all relative group"
          title="Перетащите для изменения ширины"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-border group-hover:bg-primary/40 transition-colors" />
        </div>

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4">
          <div
            ref={canvasRef}
            className={`${viewWidths[viewMode]} transition-[max-width] duration-300 rounded-2xl shadow-xl border relative`}
            style={{ backgroundColor: website.globalStyles?.backgroundColor || 'var(--background)' }}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            <WebsitePreview
              blocks={activeBlocks}
              pages={hasPages ? website.pages : undefined}
              currentPageSlug={currentPageSlug}
              onPageNavigate={(slug) => { setCurrentPageSlug(slug); setSelectedBlockId(null); }}
              onBlockClick={(id) => {
                setSelectedBlockId(id);
              }}
              onEditBlock={(id) => {
                setSelectedBlockId(id);
                const block = activeBlocks.find(b => b.id === id);
                if (block) { setEditingBlock(block); setActiveTab('settings'); }
              }}
              onBlockStyleUpdate={updateBlockStyles}
              onBlockPositionUpdate={updateBlockPosition}
              onDeleteBlock={deleteBlock}
              selectedBlockId={selectedBlockId}
              globalStyles={website.globalStyles}
            />
            {activeBlocks.length === 0 && !dropIndicator && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <Globe className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">Создайте свой сайт</h3>
                <p className="text-muted-foreground mb-6">Добавляйте блоки из панели слева или выберите готовый шаблон</p>
                <Button onClick={() => setActiveTab('templates')}>
                  <Layers className="w-4 h-4 mr-2" /> Выбрать шаблон
                </Button>
              </div>
            )}
            {/* Drop indicator */}
            {dropIndicator && (
              <div
                className="absolute pointer-events-none border-2 border-dashed border-primary rounded-lg bg-primary/10 z-30 flex items-center justify-center"
                style={{ left: Math.max(0, dropIndicator.x - 80), top: Math.max(0, dropIndicator.y - 20), width: 160, height: 40 }}
              >
                <span className="text-xs text-primary font-medium">+ Разместить здесь</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Full Preview Modal */}
      {showPreviewFull && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b bg-card">
            <span className="font-semibold">Предпросмотр: {website.name}</span>
            <Button variant="ghost" onClick={() => setShowPreviewFull(false)}>✕ Закрыть</Button>
          </div>
          <div className="flex-1 overflow-auto">
            <WebsitePreview blocks={activeBlocks} pages={hasPages ? website.pages : undefined} currentPageSlug={currentPageSlug} onPageNavigate={setCurrentPageSlug} globalStyles={website.globalStyles} />
          </div>
        </div>
      )}
    </div>
  );
}
