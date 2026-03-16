import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocsStorage } from '@/hooks/useDocsStorage';
import { DocBlockEditor } from '@/components/DocBuilder/DocBlockEditor';
import { DocBlock } from '@/types/document';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer } from 'lucide-react';

export default function DocView() {
  const { docId } = useParams<{ docId: string }>();
  const { getDoc } = useDocsStorage();
  const doc = docId ? getDoc(docId) : undefined;
  const [blocks, setBlocks] = useState<DocBlock[]>(doc?.blocks ?? []);

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="text-2xl font-bold mb-2">Документ не найден</h1>
          <p className="text-muted-foreground">Документ не существует или был удалён</p>
        </div>
      </div>
    );
  }

  if (!doc.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="text-2xl font-bold mb-2">Документ недоступен</h1>
          <p className="text-muted-foreground">Этот документ ещё не опубликован</p>
        </div>
      </div>
    );
  }

  const updateBlock = (id: string, updates: Partial<DocBlock>) => {
    if (!doc.allowFill) return;
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleExportHTML = () => {
    const content = document.getElementById('doc-content')?.innerHTML ?? '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.title}</title>
    <style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px}
    img{max-width:100%}input,textarea,select{border:1px solid #ccc;padding:6px;width:100%;box-sizing:border-box}
    </style></head><body>${content}</body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = `${doc.title}.html`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <header className="bg-card border-b py-3 px-4 no-print">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold">{doc.title}</h1>
            {doc.allowFill && (
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Форма для заполнения</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1" /> Печать / PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportHTML}>
              <Download className="w-3.5 h-3.5 mr-1" /> HTML
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto py-8 px-4">
        <div id="doc-content" className="bg-card rounded-xl shadow p-8 space-y-4">
          {blocks.map((block, i) => (
            <DocBlockEditor
              key={block.id}
              block={block}
              index={i}
              total={blocks.length}
              readOnly={!doc.allowFill}
              onChange={updates => updateBlock(block.id, updates)}
              onRemove={() => {}}
              onMove={() => {}}
              onAddAfter={() => {}}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
