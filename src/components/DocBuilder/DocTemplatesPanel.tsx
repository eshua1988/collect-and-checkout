import { useState } from 'react';
import { DocTemplate, DOC_TEMPLATES } from './DocTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search } from 'lucide-react';

interface DocTemplatesPanelProps {
  onUse: (tpl: DocTemplate) => void;
  onMerge: (tpl: DocTemplate) => void;
  onClose: () => void;
}

const CATEGORIES = ['Все', 'Документы', 'Формы', 'Таблицы', 'Прочее'];

export function DocTemplatesPanel({ onUse, onMerge, onClose }: DocTemplatesPanelProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [confirm, setConfirm] = useState<DocTemplate | null>(null);

  const filtered = DOC_TEMPLATES.filter(t =>
    (category === 'Все' || t.category === category) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">📄 Шаблоны документов</h3>
          <p className="text-xs text-muted-foreground">{DOC_TEMPLATES.length} готовых шаблонов</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-sm" placeholder="Поиск шаблонов..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map(tpl => (
          <div key={tpl.id} className="border rounded-lg p-3 hover:border-primary/50 hover:bg-accent/30 transition-all">
            {confirm?.id === tpl.id ? (
              <div>
                <p className="text-sm font-medium mb-2">{tpl.icon} {tpl.name}</p>
                <p className="text-xs text-muted-foreground mb-3">Как добавить шаблон?</p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => { onUse(tpl); setConfirm(null); }}>
                    Заменить всё
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { onMerge(tpl); setConfirm(null); }}>
                    Добавить к тексту
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-lg">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{tpl.category}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs" onClick={() => setConfirm(tpl)}>
                  Использовать
                </Button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Шаблоны не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
