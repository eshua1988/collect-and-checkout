import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocsStorage } from '@/hooks/useDocsStorage';
import { DocData, DocBlock, DocTemplate } from '@/types/document';
import { DocBlockEditor } from '@/components/DocBuilder/DocBlockEditor';
import { DocTemplatesPanel } from '@/components/DocBuilder/DocTemplatesPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, FileText, Save, Eye, EyeOff, Download, Link, Copy,
  ExternalLink, Layout, ChevronDown, Settings, Printer
} from 'lucide-react';
import { toast } from 'sonner';

const gen = () => Math.random().toString(36).substring(2, 9);

const makeBlock = (type: DocBlock['type']): DocBlock => {
  const base: DocBlock = { id: gen(), type };
  if (type === 'table') {
    const cell = (c = '') => ({ id: gen(), content: c, bold: false });
    base.cols = 2;
    base.rows = [
      { id: gen(), cells: [cell('Столбец 1'), cell('Столбец 2')] },
      { id: gen(), cells: [cell(), cell()] },
    ];
  }
  if (type === 'list' || type === 'checkbox-list') {
    base.items = [{ id: gen(), text: '', checked: false }, { id: gen(), text: '', checked: false }];
  }
  if (type === 'field') {
    base.fieldLabel = 'Поле';
    base.fieldOptions = { type: 'text', placeholder: 'Введите значение...' };
  }
  return base;
};

const defaultDoc = (): DocData => ({
  id: gen(),
  title: 'Новый документ',
  blocks: [{ id: gen(), type: 'heading1', content: 'Заголовок документа', align: 'center' }],
  published: false,
  allowFill: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export default function DocumentEditor() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { getDoc, saveDoc, togglePublish } = useDocsStorage();

  const isNew = docId === 'new';
  const [doc, setDoc] = useState<DocData>(() => {
    if (!isNew && docId) {
      const existing = getDoc(docId);
      if (existing) return existing;
    }
    return defaultDoc();
  });

  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [showTemplates, setShowTemplates] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const updateBlock = (id: string, updates: Partial<DocBlock>) => {
    setDoc(d => ({ ...d, blocks: d.blocks.map(b => b.id === id ? { ...b, ...updates } : b) }));
  };

  const removeBlock = (id: string) => {
    setDoc(d => ({ ...d, blocks: d.blocks.filter(b => b.id !== id) }));
  };

  const moveBlock = (id: string, dir: 'up' | 'down') => {
    setDoc(d => {
      const idx = d.blocks.findIndex(b => b.id === id);
      if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === d.blocks.length - 1)) return d;
      const blocks = [...d.blocks];
      const ti = dir === 'up' ? idx - 1 : idx + 1;
      [blocks[idx], blocks[ti]] = [blocks[ti], blocks[idx]];
      return { ...d, blocks };
    });
  };

  const addBlockAfter = (afterId: string, type: DocBlock['type']) => {
    setDoc(d => {
      const idx = d.blocks.findIndex(b => b.id === afterId);
      const blocks = [...d.blocks];
      blocks.splice(idx + 1, 0, makeBlock(type));
      return { ...d, blocks };
    });
  };

  const addBlockAtEnd = (type: DocBlock['type']) => {
    setDoc(d => ({ ...d, blocks: [...d.blocks, makeBlock(type)] }));
  };

  const handleSave = () => {
    saveDoc(doc);
    toast.success('Документ сохранён');
    if (isNew) navigate(`/doc/${doc.id}`, { replace: true });
  };

  const handlePublish = () => {
    saveDoc(doc);
    const updated = togglePublish(doc.id);
    if (updated?.published) {
      const url = `${window.location.origin}/d/${doc.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Опубликован! Ссылка скопирована');
    } else {
      toast.info('Документ снят с публикации');
    }
    setDoc(prev => ({ ...prev, published: !prev.published }));
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/d/${doc.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: 'html' | 'pdf') => {
    if (format === 'pdf') {
      window.print();
      return;
    }
    // Export as HTML
    const content = printRef.current?.innerHTML ?? '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.title}</title><style>
      body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
      table { width: 100%; border-collapse: collapse; }
      td, th { border: 1px solid #ccc; padding: 6px 10px; }
      h1 { font-size: 24px; } h2 { font-size: 20px; } h3 { font-size: 16px; }
      img { max-width: 100%; }
      input, textarea, select { border: 1px solid #ccc; padding: 6px; width: 100%; box-sizing: border-box; }
      hr { border-top: 1px solid #ccc; margin: 16px 0; }
      canvas { border: 1px solid #ccc; width: 100%; }
    </style></head><body>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.title}.html`;
    a.click();
    toast.success('HTML-файл скачан');
  };

  const loadTemplate = (tpl: DocTemplate) => {
    setDoc(d => ({
      ...d,
      title: tpl.doc.title,
      blocks: tpl.doc.blocks.map(b => ({ ...b, id: gen() })),
      allowFill: tpl.doc.allowFill ?? false,
    }));
    setShowTemplates(false);
    toast.success(`Шаблон «${tpl.name}» загружен`);
  };

  const mergeTemplate = (tpl: DocTemplate) => {
    const newBlocks = tpl.doc.blocks.map(b => ({ ...b, id: gen() }));
    setDoc(d => ({ ...d, blocks: [...d.blocks, ...newBlocks] }));
    setShowTemplates(false);
    toast.success(`Шаблон «${tpl.name}» добавлен`);
  };

  const BLOCK_QUICK: Array<{ type: DocBlock['type']; label: string; icon: string }> = [
    { type: 'paragraph', label: 'Текст', icon: '¶' },
    { type: 'heading2', label: 'Заголовок', icon: 'H' },
    { type: 'table', label: 'Таблица', icon: '▦' },
    { type: 'image', label: 'Фото', icon: '🖼' },
    { type: 'video', label: 'Видео', icon: '▶' },
    { type: 'signature', label: 'Подпись', icon: '✍' },
    { type: 'field', label: 'Поле', icon: '⌨' },
    { type: 'list', label: 'Список', icon: '≡' },
    { type: 'checkbox-list', label: 'Чек-лист', icon: '☑' },
    { type: 'divider', label: 'Линия', icon: '—' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { border: none !important; box-shadow: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40 no-print">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <Input
              className="border-0 shadow-none text-base font-semibold h-8 px-1 focus-visible:ring-0 min-w-[120px] max-w-[300px]"
              value={doc.title}
              onChange={e => setDoc(d => ({ ...d, title: e.target.value }))}
              placeholder="Название документа..."
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Tab switcher */}
            <div className="border rounded-lg flex overflow-hidden">
              <button onClick={() => setTab('edit')} className={`px-3 py-1.5 text-sm transition-colors ${tab === 'edit' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                Редактор
              </button>
              <button onClick={() => setTab('preview')} className={`px-3 py-1.5 text-sm transition-colors ${tab === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Просмотр
              </button>
            </div>

            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowTemplates(s => !s)}>
              <Layout className="w-3.5 h-3.5 mr-1" />
              Шаблоны
            </Button>

            {/* Export dropdown */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="h-8">
                <Download className="w-3.5 h-3.5 mr-1" />
                Скачать
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg p-1 hidden group-hover:block w-44 z-50">
                <button className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2" onClick={() => handleExport('pdf')}>
                  <span>📄</span> PDF (Печать)
                </button>
                <button className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2" onClick={() => handleExport('html')}>
                  <span>🌐</span> HTML-файл
                </button>
                <button className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" /> Печать
                </button>
              </div>
            </div>

            {doc.published && (
              <Button variant="outline" size="sm" className="h-8" onClick={handleCopyLink}>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Ссылка
              </Button>
            )}
            {doc.published && (
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.open(`/d/${doc.id}`, '_blank')}>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant={doc.published ? 'outline' : 'secondary'} size="sm" className="h-8" onClick={handlePublish}>
              {doc.published ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Link className="w-3.5 h-3.5 mr-1" />}
              {doc.published ? 'Снять' : 'Публиковать'}
            </Button>
            <Button size="sm" className="h-8" onClick={handleSave}>
              <Save className="w-3.5 h-3.5 mr-1" />
              Сохранить
            </Button>
          </div>
        </div>
      </header>

      {/* Quick add toolbar */}
      {tab === 'edit' && (
        <div className="border-b bg-card no-print">
          <div className="container mx-auto px-4 h-10 flex items-center gap-1 overflow-x-auto">
            <span className="text-xs text-muted-foreground shrink-0 mr-1">Добавить:</span>
            {BLOCK_QUICK.map(b => (
              <button
                key={b.type}
                onClick={() => addBlockAtEnd(b.type)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs border hover:bg-accent hover:border-primary/30 transition-colors shrink-0"
              >
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div
          ref={printRef}
          className={`max-w-[800px] mx-auto bg-card rounded-xl shadow-sm border p-8 print-area ${tab === 'preview' ? 'pointer-events-none' : ''}`}
        >
          {doc.blocks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg mb-2">Документ пустой</p>
              <p className="text-sm">Используйте панель выше или шаблоны для добавления блоков</p>
            </div>
          ) : (
            <div className="space-y-4 pr-12">
              {doc.blocks.map((block, i) => (
                <DocBlockEditor
                  key={block.id}
                  block={block}
                  index={i}
                  total={doc.blocks.length}
                  readOnly={tab === 'preview'}
                  onChange={updates => updateBlock(block.id, updates)}
                  onRemove={() => removeBlock(block.id)}
                  onMove={dir => moveBlock(block.id, dir)}
                  onAddAfter={type => addBlockAfter(block.id, type)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showTemplates && (
        <DocTemplatesPanel
          onUse={loadTemplate}
          onMerge={mergeTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
