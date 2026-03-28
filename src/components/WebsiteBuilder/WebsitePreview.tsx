import { WebsiteBlock, WebsitePage, AppWebsite } from '@/types/website';
import { useEffect, useState } from 'react';

interface GlobalStyles {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headingFont?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  maxWidth?: string;
}

interface WebsitePreviewProps {
  blocks: WebsiteBlock[];
  pages?: WebsitePage[];
  currentPageSlug?: string;
  onPageNavigate?: (slug: string) => void;
  onBlockClick?: (blockId: string) => void;
  selectedBlockId?: string | null;
  globalStyles?: GlobalStyles;
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

function renderBlock(block: WebsiteBlock, onClick?: (id: string) => void, selectedId?: string | null, onNavigate?: (slug: string) => void, gs?: GlobalStyles) {
  const c = block.content;
  const bs = block.styles || {}; // block-level styles override
  const isSelected = selectedId === block.id;
  const wrapperClass = `relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-primary/40 hover:ring-offset-1'}`;

  // Merge block.styles into a CSSProperties object
  const blockStyle: React.CSSProperties = {};
  if (bs.borderRadius) blockStyle.borderRadius = bs.borderRadius;
  if (bs.padding) blockStyle.padding = bs.padding;
  if (bs.margin) blockStyle.margin = bs.margin;
  if (bs.fontSize) blockStyle.fontSize = bs.fontSize;
  if (bs.fontWeight) blockStyle.fontWeight = bs.fontWeight;
  if (bs.fontFamily) blockStyle.fontFamily = bs.fontFamily;
  if (bs.boxShadow) blockStyle.boxShadow = bs.boxShadow;
  if (bs.border) blockStyle.border = bs.border;
  if (bs.opacity) blockStyle.opacity = bs.opacity;
  if (bs.backgroundImage) blockStyle.backgroundImage = bs.backgroundImage;
  if (bs.backgroundSize) blockStyle.backgroundSize = bs.backgroundSize;
  if (bs.backgroundPosition) blockStyle.backgroundPosition = bs.backgroundPosition;
  if (bs.maxWidth) blockStyle.maxWidth = bs.maxWidth;
  if (bs.minHeight) blockStyle.minHeight = bs.minHeight;
  if (bs.overflow) blockStyle.overflow = bs.overflow as any;
  if (bs.textTransform) blockStyle.textTransform = bs.textTransform as any;
  if (bs.letterSpacing) blockStyle.letterSpacing = bs.letterSpacing;
  if (bs.lineHeight) blockStyle.lineHeight = bs.lineHeight;
  // Apply global font if no block-specific provided
  if (!blockStyle.fontFamily && gs?.fontFamily) blockStyle.fontFamily = gs.fontFamily;

  /** Handle link click — intercept internal page links (e.g. /about) */
  const handleLinkClick = (e: React.MouseEvent, href?: string) => {
    if (!href) return;
    // Internal page link: "/slug" format
    if (href.startsWith('/') && !href.startsWith('//') && onNavigate) {
      e.preventDefault();
      e.stopPropagation();
      const slug = href.replace(/^\//, '') || 'home';
      onNavigate(slug);
    }
    // Anchor links: "#section" — do nothing
    if (href.startsWith('#')) {
      e.preventDefault();
    }
  };

  const wrap = (node: React.ReactNode) => (
    <div key={block.id} className={wrapperClass} style={blockStyle} onClick={() => onClick?.(block.id)}>
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
          <div className="font-bold text-xl cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigate?.('home'); }}>{c.logo || 'Сайт'}</div>
          <div className="flex items-center gap-6">
            {(c.links || []).map((link: any, i: number) => (
              <a key={i} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className="text-sm opacity-80 hover:opacity-100 cursor-pointer">{link.label}</a>
            ))}
            {c.ctaText && <button onClick={(e) => { e.stopPropagation(); handleLinkClick(e as any, c.ctaHref); }} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors">{c.ctaText}</button>}
          </div>
        </nav>
      );

    case 'hero':
      return wrap(
        <section style={{ backgroundColor: c.bgColor || gs?.backgroundColor || '#1e293b', color: c.textColor || gs?.textColor || '#fff' }} className="py-20 px-8">
          <div className={`max-w-4xl mx-auto text-${c.align || 'center'}`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={gs?.headingFont ? { fontFamily: gs.headingFont } : undefined}>{c.title || 'Заголовок'}</h1>
            {c.subtitle && <p className="text-lg md:text-xl opacity-80 mb-8 max-w-2xl mx-auto">{c.subtitle}</p>}
            {c.ctaText && <a href={c.ctaHref || '#'} onClick={(e) => handleLinkClick(e, c.ctaHref)} style={gs?.accentColor ? { backgroundColor: gs.accentColor } : undefined} className="inline-block px-8 py-4 rounded-xl bg-white/20 hover:bg-white/30 font-semibold text-lg transition-colors cursor-pointer">{c.ctaText}</a>}
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
            <a href={c.href || '#'} onClick={(e) => handleLinkClick(e, c.href)} className="inline-block px-8 py-4 rounded-xl font-semibold text-white shadow-lg cursor-pointer" style={{ backgroundColor: c.bgColor || '#4f46e5' }}>{c.text || 'Кнопка'}</a>
          </div>
        </section>
      );

    case 'divider':
      return wrap(<div className="px-8 py-4"><hr className="border-border" /></div>);

    case 'spacer':
      return wrap(<div style={{ height: c.height || '40px' }} />);

    case 'stats':
      return wrap(
        <section style={{ backgroundColor: c.bgColor || '#4f46e5', color: c.textColor || '#fff' }} className="py-16 px-8">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-12 text-center">{c.title}</h2>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">{item.value}</div>
                  <div className="text-sm opacity-80">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'logos':
      return wrap(
        <section className="py-12 px-8">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-xl font-semibold mb-8 text-center text-muted-foreground">{c.title}</h2>}
            <div className="flex flex-wrap justify-center items-center gap-8">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className={`flex items-center gap-2 ${c.grayscale ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
                  {item.logo ? <img src={item.logo} alt={item.name} className="h-10 object-contain" /> : <div className="px-4 py-2 border rounded-lg text-sm font-medium text-muted-foreground">{item.name}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'cta':
      return wrap(
        <section style={{ backgroundColor: c.bgColor || '#7c3aed', color: c.textColor || '#fff' }} className="py-20 px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{c.title || 'Призыв к действию'}</h2>
            {c.subtitle && <p className="text-lg opacity-90 mb-8">{c.subtitle}</p>}
            {c.ctaText && <a href={c.ctaHref || '#'} onClick={(e) => handleLinkClick(e, c.ctaHref)} className="inline-block px-8 py-4 rounded-xl bg-white/20 hover:bg-white/30 font-semibold text-lg transition-colors cursor-pointer">{c.ctaText}</a>}
          </div>
        </section>
      );

    case 'timeline':
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-3xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-12 text-center">{c.title}</h2>}
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary/20" />
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="relative flex gap-6 mb-8 last:mb-0">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0 z-10">{item.icon || (i + 1)}</div>
                  <div className="pt-2">
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'social':
      return wrap(
        <section className="py-12 px-8 text-center">
          {c.title && <h2 className="text-2xl font-bold mb-6">{c.title}</h2>}
          <div className="flex justify-center gap-4">
            {(c.links || []).map((link: any, i: number) => (
              <a key={i} href={link.url || '#'} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-2xl transition-colors cursor-pointer" title={link.platform}>
                {link.icon || '🔗'}
              </a>
            ))}
          </div>
        </section>
      );

    case 'newsletter':
      return wrap(
        <section style={{ backgroundColor: c.bgColor || '#f8fafc' }} className="py-16 px-8">
          <div className="max-w-xl mx-auto text-center">
            {c.title && <h2 className="text-2xl font-bold mb-2">{c.title}</h2>}
            {c.subtitle && <p className="text-muted-foreground mb-6">{c.subtitle}</p>}
            <div className="flex gap-2 max-w-md mx-auto">
              <input type="email" placeholder="Ваш email" className="flex-1 px-4 py-3 rounded-xl border bg-background text-sm" readOnly />
              <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm">{c.buttonText || 'Подписаться'}</button>
            </div>
          </div>
        </section>
      );

    case 'banner':
      return wrap(
        <div style={{ backgroundColor: c.bgColor || '#ef4444', color: c.textColor || '#fff' }} className="py-3 px-6 text-center text-sm font-medium relative">
          <span>{c.text || 'Объявление'}</span>
          {c.closable && <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer opacity-70 hover:opacity-100">✕</span>}
        </div>
      );

    case 'tabs': {
      const tabItems = c.tabs || [];
      return wrap(
        <section className="py-12 px-8 max-w-4xl mx-auto">
          <div className="flex border-b mb-6">
            {tabItems.map((tab: any, i: number) => (
              <div key={i} className={`px-6 py-3 text-sm font-medium cursor-pointer border-b-2 ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>{tab.title}</div>
            ))}
          </div>
          {tabItems.length > 0 && <div className="text-muted-foreground whitespace-pre-wrap">{tabItems[0].content}</div>}
        </section>
      );
    }

    case 'accordion':
      return wrap(
        <section className="py-12 px-8 max-w-3xl mx-auto">
          {c.title && <h2 className="text-3xl font-bold mb-8 text-center">{c.title}</h2>}
          <div className="space-y-3">
            {(c.items || []).map((item: any, i: number) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 font-medium bg-muted/30 cursor-pointer">
                  <span>{item.title}</span>
                  <span className="text-muted-foreground">▼</span>
                </div>
                <div className="p-4 text-muted-foreground border-t">{item.content}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'progress':
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-3xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-10 text-center">{c.title}</h2>}
            <div className="space-y-6">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between mb-2 text-sm font-medium">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(item.value || 0, 100)}%`, backgroundColor: item.color || '#4f46e5' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'comparison':
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-4xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-10 text-center">{c.title}</h2>}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b font-semibold">Функция</th>
                    {(c.columns || []).map((col: string, i: number) => (
                      <th key={i} className="text-center p-3 border-b font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(c.rows || []).map((row: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-sm">{row.feature}</td>
                      {(row.values || []).map((val: string, j: number) => (
                        <td key={j} className="p-3 text-center text-sm">
                          {val === 'true' ? <span className="text-green-500">✓</span> : val === 'false' ? <span className="text-red-400">✗</span> : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      );

    case 'marquee':
      return wrap(
        <div style={{ backgroundColor: c.bgColor || '#fbbf24', color: c.textColor || '#1e293b' }} className="py-3 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee text-sm font-medium" style={{ animation: `marquee ${c.speed || 30}s linear infinite` }}>
            {c.text || 'Бегущая строка'} &nbsp;&nbsp;&nbsp; {c.text || 'Бегущая строка'} &nbsp;&nbsp;&nbsp;
          </div>
        </div>
      );

    case 'quote':
      return wrap(
        <section style={{ backgroundColor: c.bgColor || '#f1f5f9' }} className="py-16 px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-6xl text-primary/30 mb-4">"</div>
            <blockquote className="text-xl md:text-2xl font-medium italic leading-relaxed mb-6">{c.text || 'Цитата'}</blockquote>
            {c.author && <div className="text-muted-foreground font-medium">— {c.author}</div>}
          </div>
        </section>
      );

    case 'map':
      return wrap(
        <section className="py-8 px-8">
          <div className="max-w-4xl mx-auto">
            {c.embedUrl ? (
              <iframe src={c.embedUrl} className="w-full rounded-xl border-0" style={{ height: c.height || '400px' }} allowFullScreen loading="lazy" title="map" />
            ) : (
              <div className="w-full rounded-xl bg-muted flex flex-col items-center justify-center text-muted-foreground" style={{ height: c.height || '400px' }}>
                <span className="text-4xl mb-2">📍</span>
                <span className="text-sm">{c.address || 'Вставьте URL карты (Google Maps Embed)'}</span>
              </div>
            )}
          </div>
        </section>
      );

    case 'columns':
      return wrap(
        <section className="py-12 px-8">
          <div className="max-w-5xl mx-auto">
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min((c.columns || []).length, 4)} gap-6`}>
              {(c.columns || []).map((col: any, i: number) => (
                <div key={i} className="p-6 rounded-xl border bg-background">
                  {col.title && <h3 className="font-bold text-lg mb-3">{col.title}</h3>}
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{col.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'form':
      return wrap(
        <section style={{ backgroundColor: c.bgColor || '#f8fafc' }} className="py-16 px-8">
          <div className="max-w-xl mx-auto">
            {c.title && <h2 className="text-2xl font-bold mb-6 text-center">{c.title}</h2>}
            <div className="space-y-4">
              {(c.fields || []).map((field: any, i: number) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea className="w-full px-4 py-3 rounded-xl border bg-background text-sm" rows={3} readOnly placeholder={field.label} />
                  ) : (
                    <input type={field.type || 'text'} className="w-full px-4 py-3 rounded-xl border bg-background text-sm" readOnly placeholder={field.label} />
                  )}
                </div>
              ))}
              <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium">{c.buttonText || 'Отправить'}</button>
            </div>
          </div>
        </section>
      );

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
              {(c.links || []).map((link: any, i: number) => <a key={i} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">{link.label}</a>)}
            </div>
          )}
          <div className="text-sm text-muted-foreground">{c.copyright || '© 2024'}</div>
        </footer>
      );

    default:
      // Generic rendering for custom AI-registered block types
      const cc = block.content || {};
      return wrap(
        <div className="py-8 px-8" style={{ backgroundColor: cc.bgColor, color: cc.textColor }}>
          {cc.title && <h2 className="text-2xl font-bold mb-4 text-center">{cc.title}</h2>}
          {cc.subtitle && <p className="text-center text-lg mb-4 opacity-80">{cc.subtitle}</p>}
          {cc.text && <p className="text-center mb-4">{cc.text}</p>}
          {cc.body && <p className="mb-4">{cc.body}</p>}
          {cc.items && Array.isArray(cc.items) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {cc.items.map((item: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border bg-white/5">
                  {item.icon && <span className="text-2xl">{item.icon}</span>}
                  {item.title && <h3 className="font-semibold mt-1">{item.title}</h3>}
                  {item.value && <p className="text-xl font-bold">{item.value}</p>}
                  {item.desc && <p className="text-sm opacity-70">{item.desc}</p>}
                  {item.label && !item.title && <p className="text-sm">{item.label}</p>}
                  {item.name && <p className="font-medium">{item.name}</p>}
                  {item.text && <p className="text-sm opacity-80">{item.text}</p>}
                </div>
              ))}
            </div>
          )}
          {cc.ctaText && (
            <div className="text-center mt-6">
              <a href={cc.ctaHref || '#'} className="inline-block px-6 py-3 rounded-lg bg-white/20 font-semibold hover:bg-white/30 transition">{cc.ctaText}</a>
            </div>
          )}
          {!cc.title && !cc.text && !cc.items && (
            <p className="text-center text-muted-foreground">🧩 {block.type}</p>
          )}
        </div>
      );
  }
}

export function WebsitePreview({ blocks, pages, currentPageSlug, onPageNavigate, onBlockClick, selectedBlockId, globalStyles: gs }: WebsitePreviewProps) {
  // Determine which blocks to display: use pages if available
  const [activeSlug, setActiveSlug] = useState(currentPageSlug || 'home');

  // Sync with external currentPageSlug prop
  useEffect(() => {
    if (currentPageSlug) setActiveSlug(currentPageSlug);
  }, [currentPageSlug]);

  let displayBlocks = blocks;
  let hasPages = false;

  if (pages && pages.length > 0) {
    hasPages = true;
    const activePage = pages.find(p => p.slug === activeSlug) || pages[0];
    displayBlocks = activePage?.blocks || [];
  }

  const handleNavigate = (slug: string) => {
    if (hasPages) {
      setActiveSlug(slug);
      onPageNavigate?.(slug);
    }
  };

  if (displayBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="text-6xl mb-4">🌐</div>
        <h3 className="text-xl font-bold mb-2">Начните строить сайт</h3>
        <p className="text-muted-foreground">Добавьте блоки из панели слева или выберите готовый шаблон</p>
      </div>
    );
  }

  // Global container styles
  const containerStyle: React.CSSProperties = {};
  if (gs?.backgroundColor) containerStyle.backgroundColor = gs.backgroundColor;
  if (gs?.textColor) containerStyle.color = gs.textColor;
  if (gs?.fontFamily) containerStyle.fontFamily = gs.fontFamily;
  if (gs?.maxWidth) containerStyle.maxWidth = gs.maxWidth;

  return (
    <div className="min-h-screen bg-background" style={containerStyle}>
      {displayBlocks.map(block => renderBlock(block, onBlockClick, selectedBlockId, handleNavigate, gs))}
    </div>
  );
}
