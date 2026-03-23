import { WebsiteBlock } from '@/types/website';
import { useEffect, useState } from 'react';

interface WebsitePreviewProps {
  blocks: WebsiteBlock[];
  onBlockClick?: (blockId: string) => void;
  selectedBlockId?: string | null;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return (
    <div className="flex gap-4 justify-center my-4">
      {[{ v: timeLeft.d, l: 'Дней' }, { v: timeLeft.h, l: 'Часов' }, { v: timeLeft.m, l: 'Минут' }, { v: timeLeft.s, l: 'Секунд' }].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="text-4xl font-bold bg-primary text-primary-foreground rounded-xl px-4 py-2 min-w-[72px]">{String(v).padStart(2, '0')}</div>
          <div className="text-xs mt-1 text-muted-foreground">{l}</div>
        </div>
      ))}
    </div>
  );
}

function renderBlock(block: WebsiteBlock, onClick?: (id: string) => void, selectedId?: string | null) {
  const c = block.content;
  const isSelected = selectedId === block.id;
  const wrapperClass = `relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-primary/40 hover:ring-offset-1'}`;

  const wrap = (node: React.ReactNode) => (
    <div key={block.id} className={wrapperClass} onClick={() => onClick?.(block.id)}>
      {onClick && (
        <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
          ✏️ Редактировать
        </div>
      )}
      {node}
    </div>
  );

  switch (block.type) {
    case 'navbar':
      return wrap(
        <nav style={{ backgroundColor: c.bgColor || '#1e293b', color: c.textColor || '#fff' }} className="px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl">{c.logo || 'Сайт'}</div>
          <div className="flex items-center gap-6">
            {(c.links || []).map((link: any, i: number) => (
              <a key={i} href={link.href} className="text-sm opacity-80 hover:opacity-100">{link.label}</a>
            ))}
            {c.ctaText && <button className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors">{c.ctaText}</button>}
          </div>
        </nav>
      );

    case 'hero':
      return wrap(
        <section style={{ backgroundColor: c.bgColor || '#1e293b', color: c.textColor || '#fff' }} className="py-20 px-8">
          <div className={`max-w-4xl mx-auto text-${c.align || 'center'}`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{c.title || 'Заголовок'}</h1>
            {c.subtitle && <p className="text-lg md:text-xl opacity-80 mb-8 max-w-2xl mx-auto">{c.subtitle}</p>}
            {c.ctaText && <a href={c.ctaHref || '#'} className="inline-block px-8 py-4 rounded-xl bg-white/20 hover:bg-white/30 font-semibold text-lg transition-colors">{c.ctaText}</a>}
          </div>
        </section>
      );

    case 'text':
      return wrap(
        <section className="py-12 px-8 max-w-4xl mx-auto">
          {c.title && <h2 className={`text-3xl font-bold mb-4 text-${c.align || 'left'}`}>{c.title}</h2>}
          <p className={`text-muted-foreground leading-relaxed text-${c.align || 'left'} whitespace-pre-wrap`}>{c.body || ''}</p>
        </section>
      );

    case 'image':
      return wrap(
        <section className="py-8 px-8">
          <div className="max-w-4xl mx-auto text-center">
            {c.src ? <img src={c.src} alt={c.caption || ''} className="w-full rounded-xl shadow-lg" /> : <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">🖼️ Нет изображения</div>}
            {c.caption && <p className="mt-2 text-sm text-muted-foreground">{c.caption}</p>}
          </div>
        </section>
      );

    case 'gallery':
      return wrap(
        <section className="py-12 px-8 max-w-5xl mx-auto">
          {c.title && <h2 className="text-3xl font-bold mb-8 text-center">{c.title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(c.images || []).map((img: any, i: number) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-md">
                <img src={img.url} alt={img.caption || ''} className="w-full h-48 object-cover" />
                {img.caption && <div className="p-2 text-sm text-center text-muted-foreground">{img.caption}</div>}
              </div>
            ))}
          </div>
        </section>
      );

    case 'features':
      return wrap(
        <section className="py-16 px-8 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-12 text-center">{c.title}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-background shadow-sm">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'pricing':
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-12 text-center">{c.title}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(c.plans || []).map((plan: any, i: number) => (
                <div key={i} className={`rounded-2xl p-6 border-2 ${plan.highlighted ? 'border-primary bg-primary/5 shadow-xl' : 'border-border bg-background'}`}>
                  {plan.highlighted && <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">Популярный</div>}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-6 text-primary">{plan.price}</div>
                  <ul className="space-y-2 mb-6">
                    {(plan.features || []).map((f: string, j: number) => <li key={j} className="text-sm flex gap-2"><span className="text-green-500">✓</span>{f}</li>)}
                  </ul>
                  <button className={`w-full py-2 rounded-xl font-medium ${plan.highlighted ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>Выбрать</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'testimonials':
      return wrap(
        <section className="py-16 px-8 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-12 text-center">{c.title}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="bg-background rounded-2xl p-6 shadow-sm">
                  <div className="flex mb-3">{Array.from({ length: item.rating || 5 }).map((_, j) => <span key={j} className="text-yellow-400">★</span>)}</div>
                  <p className="text-muted-foreground mb-4 italic">"{item.text}"</p>
                  <div className="font-semibold">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'contact':
      return wrap(
        <section className="py-16 px-8 bg-primary text-primary-foreground">
          <div className="max-w-2xl mx-auto text-center">
            {c.title && <h2 className="text-3xl font-bold mb-4">{c.title}</h2>}
            {c.subtitle && <p className="opacity-80 mb-8">{c.subtitle}</p>}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {c.email && <a href={`mailto:${c.email}`} className="opacity-90 hover:opacity-100">📧 {c.email}</a>}
              {c.phone && <a href={`tel:${c.phone}`} className="opacity-90 hover:opacity-100">📞 {c.phone}</a>}
              {c.address && <span>📍 {c.address}</span>}
              {c.hours && <span>🕐 {c.hours}</span>}
            </div>
          </div>
        </section>
      );

    case 'video':
      const getEmbedUrl = (url: string) => {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        return url;
      };
      return wrap(
        <section className="py-12 px-8 max-w-4xl mx-auto">
          {c.title && <h2 className="text-3xl font-bold mb-6 text-center">{c.title}</h2>}
          {c.url ? (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
              <iframe src={getEmbedUrl(c.url)} className="w-full h-full" allowFullScreen title="video" />
            </div>
          ) : <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">🎬 Вставьте URL видео</div>}
        </section>
      );

    case 'countdown':
      return wrap(
        <section className="py-12 px-8 bg-muted/30 text-center">
          {c.title && <h2 className="text-2xl font-bold mb-6">{c.title}</h2>}
          {c.targetDate ? <CountdownTimer targetDate={c.targetDate} /> : <p className="text-muted-foreground">Укажите дату окончания</p>}
        </section>
      );

    case 'team':
      return wrap(
        <section className="py-16 px-8 max-w-5xl mx-auto">
          {c.title && <h2 className="text-3xl font-bold mb-12 text-center">{c.title}</h2>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(c.members || []).map((m: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-6xl mb-3">{m.avatar || '👤'}</div>
                <div className="font-bold">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.role}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return wrap(
        <section className="py-16 px-8 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-12 text-center">{c.title}</h2>}
            <div className="space-y-4">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="bg-background rounded-xl p-6 shadow-sm">
                  <div className="font-semibold mb-2">❓ {item.q}</div>
                  <p className="text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'button':
      return wrap(
        <section className="py-8 px-8">
          <div className={`text-${c.align || 'center'}`}>
            <a href={c.href || '#'} className="inline-block px-8 py-4 rounded-xl font-semibold text-white shadow-lg" style={{ backgroundColor: c.bgColor || '#4f46e5' }}>{c.text || 'Кнопка'}</a>
          </div>
        </section>
      );

    case 'divider':
      return wrap(<div className="px-8 py-4"><hr className="border-border" /></div>);

    case 'spacer':
      return wrap(<div style={{ height: c.height || '40px' }} />);

    case 'html':
      return wrap(
        <div className="py-4 px-8" dangerouslySetInnerHTML={{ __html: c.code || '<!-- HTML блок -->' }} />
      );

    case 'footer':
      return wrap(
        <footer className="bg-muted/50 py-8 px-8 text-center">
          {c.companyName && <div className="font-bold text-lg mb-2">{c.companyName}</div>}
          {(c.links || []).length > 0 && (
            <div className="flex justify-center gap-4 mb-4">
              {(c.links || []).map((link: any, i: number) => <a key={i} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">{link.label}</a>)}
            </div>
          )}
          <div className="text-sm text-muted-foreground">{c.copyright || '© 2024'}</div>
        </footer>
      );

    default:
      return wrap(<div className="py-8 px-8 text-center text-muted-foreground">Блок: {block.type}</div>);
  }
}

export function WebsitePreview({ blocks, onBlockClick, selectedBlockId }: WebsitePreviewProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="text-6xl mb-4">🌐</div>
        <h3 className="text-xl font-bold mb-2">Начните строить сайт</h3>
        <p className="text-muted-foreground">Добавьте блоки из панели слева или выберите готовый шаблон</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {blocks.map(block => renderBlock(block, onBlockClick, selectedBlockId))}
    </div>
  );
}
