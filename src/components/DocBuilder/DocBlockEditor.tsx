import { useRef, useState, useCallback } from 'react';
import { DocBlock, DocData, DocTableRow, DocTableCell, DocListItem } from '@/types/document';
import { SignaturePad } from './SignaturePad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Trash2, ChevronUp, ChevronDown, Plus, Image as ImageIcon,
  Video, PlusCircle, MinusCircle, Type, Columns, Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const gen = () => Math.random().toString(36).substring(2, 9);

interface DocBlockEditorProps {
  block: DocBlock;
  index: number;
  total: number;
  readOnly?: boolean;
  onChange: (updates: Partial<DocBlock>) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onAddAfter: (type: DocBlock['type']) => void;
}

function EditableText({
  value, onChange, placeholder, className, multiline = false,
}: { value?: string; onChange: (v: string) => void; placeholder?: string; className?: string; multiline?: boolean }) {
  if (multiline) {
    return (
      <textarea
        className={cn('w-full bg-transparent outline-none resize-none min-h-[60px]', className)}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className={cn('w-full bg-transparent outline-none', className)}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
}

export function DocBlockEditor({ block, index, total, readOnly, onChange, onRemove, onMove, onAddAfter }: DocBlockEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onChange({ src: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const updateCell = (rowIdx: number, cellIdx: number, updates: Partial<DocTableCell>) => {
    const rows = (block.rows ?? []).map((r, ri) => ri === rowIdx
      ? { ...r, cells: r.cells.map((c, ci) => ci === cellIdx ? { ...c, ...updates } : c) }
      : r
    );
    onChange({ rows });
  };

  const addTableRow = () => {
    const cols = block.cols ?? 2;
    const newRow: DocTableRow = { id: gen(), cells: Array.from({ length: cols }, () => ({ id: gen(), content: '', bold: false })) };
    onChange({ rows: [...(block.rows ?? []), newRow] });
  };

  const removeTableRow = (idx: number) => {
    onChange({ rows: (block.rows ?? []).filter((_, i) => i !== idx) });
  };

  const addTableCol = () => {
    onChange({
      cols: (block.cols ?? 2) + 1,
      rows: (block.rows ?? []).map(r => ({ ...r, cells: [...r.cells, { id: gen(), content: '', bold: false }] })),
    });
  };

  const removeTableCol = () => {
    if ((block.cols ?? 2) <= 1) return;
    onChange({
      cols: (block.cols ?? 2) - 1,
      rows: (block.rows ?? []).map(r => ({ ...r, cells: r.cells.slice(0, -1) })),
    });
  };

  const updateListItem = (id: string, updates: Partial<DocListItem>) => {
    onChange({ items: (block.items ?? []).map(it => it.id === id ? { ...it, ...updates } : it) });
  };

  const addListItem = () => {
    onChange({ items: [...(block.items ?? []), { id: gen(), text: '', checked: false }] });
  };

  const removeListItem = (id: string) => {
    onChange({ items: (block.items ?? []).filter(it => it.id !== id) });
  };

  const formatBtn = (label: React.ReactNode, active: boolean, onClick: () => void) => (
    <button
      className={cn('px-1.5 py-0.5 rounded text-xs border transition-colors', active ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent')}
      onClick={onClick}
    >{label}</button>
  );

  const renderBlock = () => {
    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3': {
        const sizeMap = { heading1: 'text-2xl font-bold', heading2: 'text-xl font-semibold', heading3: 'text-lg font-medium' };
        return (
          <EditableText
            value={block.content}
            onChange={v => onChange({ content: v })}
            placeholder={`Заголовок ${block.type.replace('heading', '')}`}
            className={cn(sizeMap[block.type], block.italic && 'italic', block.underline && 'underline',
              block.align === 'center' && 'text-center', block.align === 'right' && 'text-right')}
          />
        );
      }
      case 'paragraph':
        return (
          <EditableText
            value={block.content}
            onChange={v => onChange({ content: v })}
            placeholder="Введите текст..."
            multiline
            className={cn('text-sm leading-relaxed', block.bold && 'font-bold', block.italic && 'italic',
              block.underline && 'underline', block.align === 'center' && 'text-center', block.align === 'right' && 'text-right')}
          />
        );
      case 'divider':
        return <hr className="border-border" />;
      case 'page-break':
        return (
          <div className="border-dashed border-2 border-muted-foreground/30 py-2 text-center text-xs text-muted-foreground">
            — Разрыв страницы —
          </div>
        );
      case 'list':
        return (
          <div className="space-y-1">
            {(block.items ?? []).map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0">•</span>
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  value={item.text}
                  placeholder="Пункт списка..."
                  onChange={e => updateListItem(item.id, { text: e.target.value })}
                />
                {!readOnly && (
                  <button onClick={() => removeListItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Minus className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addListItem}>
                <Plus className="w-3 h-3 mr-1" /> Пункт
              </Button>
            )}
          </div>
        );
      case 'checkbox-list':
        return (
          <div className="space-y-1">
            {(block.items ?? []).map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={e => updateListItem(item.id, { checked: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  value={item.text}
                  placeholder="Задача..."
                  onChange={e => updateListItem(item.id, { text: e.target.value })}
                  style={{ textDecoration: item.checked ? 'line-through' : undefined, opacity: item.checked ? 0.6 : 1 }}
                />
                {!readOnly && (
                  <button onClick={() => removeListItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Minus className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addListItem}>
                <Plus className="w-3 h-3 mr-1" /> Задача
              </Button>
            )}
          </div>
        );
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {(block.rows ?? []).map((row, ri) => (
                  <tr key={row.id} className="group/row">
                    {row.cells.map((cell, ci) => (
                      <td key={cell.id} className="border border-border px-2 py-1 min-w-[80px]" style={{ backgroundColor: cell.bg || undefined }}>
                        <input
                          className={cn('w-full bg-transparent outline-none', cell.bold && 'font-bold',
                            cell.align === 'center' && 'text-center', cell.align === 'right' && 'text-right')}
                          value={cell.content}
                          onChange={e => updateCell(ri, ci, { content: e.target.value })}
                        />
                      </td>
                    ))}
                    {!readOnly && (
                      <td className="border-0 px-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button onClick={() => removeTableRow(ri)} className="text-destructive hover:bg-destructive/10 rounded p-0.5">
                          <Minus className="w-3 h-3" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!readOnly && (
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addTableRow}>
                  <Plus className="w-3 h-3 mr-1" /> Строка
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addTableCol}>
                  <Columns className="w-3 h-3 mr-1" /> Столбец
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={removeTableCol}>
                  <MinusCircle className="w-3 h-3 mr-1" /> Столбец
                </Button>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            {block.src ? (
              <div className="relative group">
                <img src={block.src} alt={block.alt || ''} className="max-w-full rounded" style={{ width: block.width ? `${block.width}%` : '100%' }} />
                {!readOnly && (
                  <Button variant="outline" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs"
                    onClick={() => onChange({ src: '' })}>
                    Заменить
                  </Button>
                )}
              </div>
            ) : (
              <button
                className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">Нажмите для загрузки изображения</span>
                <span className="text-xs">JPG, PNG, GIF, WEBP</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            {block.src && !readOnly && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground text-xs">Ширина:</span>
                <input type="range" min={20} max={100} value={block.width ?? 100}
                  onChange={e => onChange({ width: Number(e.target.value) })} className="flex-1" />
                <span className="text-xs text-muted-foreground">{block.width ?? 100}%</span>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            {block.src ? (
              <video src={block.src} controls className="w-full rounded" />
            ) : (
              <button
                className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                onClick={() => videoRef.current?.click()}
              >
                <Video className="w-8 h-8" />
                <span className="text-sm">Загрузить видео</span>
                <span className="text-xs">MP4, WEBM, OGV</span>
              </button>
            )}
            <input ref={videoRef} type="file" accept="video/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = URL.createObjectURL(f);
                onChange({ src: url });
              }} />
          </div>
        );
      case 'signature':
        return (
          <SignaturePad
            value={block.signatureData}
            onChange={v => onChange({ signatureData: v })}
            label={block.content || 'Подпись'}
            readOnly={readOnly}
          />
        );
      case 'field':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium min-w-fit">
                {block.fieldLabel || 'Поле'}
                {block.fieldOptions?.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {!readOnly && (
                <input
                  className="text-sm font-medium bg-transparent outline-none flex-1 text-primary"
                  value={block.fieldLabel ?? ''}
                  placeholder="Название поля..."
                  onChange={e => onChange({ fieldLabel: e.target.value })}
                />
              )}
            </div>
            {block.fieldOptions?.type === 'textarea' ? (
              <textarea className="w-full border rounded px-3 py-2 text-sm min-h-[80px] bg-background"
                placeholder={block.fieldOptions?.placeholder} readOnly={readOnly} />
            ) : block.fieldOptions?.type === 'select' ? (
              <select className="w-full border rounded px-3 py-2 text-sm bg-background">
                <option value="">Выберите...</option>
                {block.fieldOptions?.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={block.fieldOptions?.type || 'text'}
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                placeholder={block.fieldOptions?.placeholder}
                readOnly={readOnly}
              />
            )}
          </div>
        );
      default:
        return <div className="text-muted-foreground text-sm">Неизвестный блок</div>;
    }
  };

  const showFormatBar = ['heading1', 'heading2', 'heading3', 'paragraph'].includes(block.type);

  return (
    <div
      className={cn('group/block relative border rounded-lg p-3 transition-all bg-card', hover && !readOnly && 'border-primary/40 shadow-sm')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Format bar */}
      {showFormatBar && !readOnly && (
        <div className={cn('flex items-center gap-1 mb-2 opacity-0 group-hover/block:opacity-100 transition-opacity flex-wrap')}>
          {formatBtn(<Bold className="w-3 h-3" />, !!block.bold, () => onChange({ bold: !block.bold }))}
          {formatBtn(<Italic className="w-3 h-3" />, !!block.italic, () => onChange({ italic: !block.italic }))}
          {formatBtn(<Underline className="w-3 h-3" />, !!block.underline, () => onChange({ underline: !block.underline }))}
          <div className="w-px h-4 bg-border mx-0.5" />
          {formatBtn(<AlignLeft className="w-3 h-3" />, block.align === 'left' || !block.align, () => onChange({ align: 'left' }))}
          {formatBtn(<AlignCenter className="w-3 h-3" />, block.align === 'center', () => onChange({ align: 'center' }))}
          {formatBtn(<AlignRight className="w-3 h-3" />, block.align === 'right', () => onChange({ align: 'right' }))}
          <div className="w-px h-4 bg-border mx-0.5" />
          <select
            className="text-xs border rounded px-1 py-0.5 bg-background h-6"
            value={block.type}
            onChange={e => onChange({ type: e.target.value as DocBlock['type'] })}
          >
            <option value="heading1">Заголовок 1</option>
            <option value="heading2">Заголовок 2</option>
            <option value="heading3">Заголовок 3</option>
            <option value="paragraph">Абзац</option>
          </select>
        </div>
      )}

      {renderBlock()}

      {/* Block controls */}
      {!readOnly && (
        <div className={cn('absolute -right-10 top-1 flex flex-col gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity')}>
          <button
            disabled={index === 0}
            onClick={() => onMove('up')}
            className="w-8 h-8 rounded border bg-card hover:bg-accent flex items-center justify-center disabled:opacity-30"
          ><ChevronUp className="w-3.5 h-3.5" /></button>
          <button
            disabled={index === total - 1}
            onClick={() => onMove('down')}
            className="w-8 h-8 rounded border bg-card hover:bg-accent flex items-center justify-center disabled:opacity-30"
          ><ChevronDown className="w-3.5 h-3.5" /></button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded border bg-card hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive flex items-center justify-center text-muted-foreground"
          ><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Add block after */}
      {!readOnly && (
        <div className="absolute -bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
          <AddBlockMenu onAdd={onAddAfter} />
        </div>
      )}
    </div>
  );
}

const BLOCK_TYPES: Array<{ type: DocBlock['type']; label: string; icon: string }> = [
  { type: 'paragraph', label: 'Текст', icon: '¶' },
  { type: 'heading1', label: 'Заголовок 1', icon: 'H1' },
  { type: 'heading2', label: 'Заголовок 2', icon: 'H2' },
  { type: 'heading3', label: 'Заголовок 3', icon: 'H3' },
  { type: 'table', label: 'Таблица', icon: '▦' },
  { type: 'list', label: 'Список', icon: '≡' },
  { type: 'checkbox-list', label: 'Чек-лист', icon: '☑' },
  { type: 'image', label: 'Изображение', icon: '🖼' },
  { type: 'video', label: 'Видео', icon: '▶' },
  { type: 'signature', label: 'Подпись', icon: '✍' },
  { type: 'field', label: 'Поле формы', icon: '⌨' },
  { type: 'divider', label: 'Разделитель', icon: '—' },
  { type: 'page-break', label: 'Разрыв стр.', icon: '⊞' },
];

function AddBlockMenu({ onAdd }: { onAdd: (type: DocBlock['type']) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 hover:bg-primary hover:text-primary-foreground text-primary flex items-center justify-center text-xs transition-all"
      >+</button>
      {open && (
        <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-card border rounded-lg shadow-xl p-2 grid grid-cols-3 gap-1 min-w-[220px] z-20">
          {BLOCK_TYPES.map(b => (
            <button
              key={b.type}
              onClick={() => { onAdd(b.type); setOpen(false); }}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded hover:bg-accent text-xs transition-colors"
            >
              <span className="text-base">{b.icon}</span>
              <span className="text-muted-foreground leading-tight text-center">{b.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
