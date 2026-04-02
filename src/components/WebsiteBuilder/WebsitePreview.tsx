import { WebsiteBlock, WebsitePage, WebsiteBlockExtra, AppWebsite } from '@/types/website';
import { Trash2 } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';

/** Render embedded extras inline */
function RenderExtras({ extras, handleLink }: { extras?: WebsiteBlockExtra[]; handleLink?: (e: React.MouseEvent, href?: string) => void }) {
  if (!extras || extras.length === 0) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {extras.map((ex, i) => {
        const c = ex.content || {};
        const s = ex.styles || {};
        switch (ex.type) {
          case 'button':
            return <a key={i} href={c.href || '#'} onClick={e => handleLink?.(e, c.href)} style={{ padding: s.padding || '6px 16px', borderRadius: s.borderRadius || '6px', backgroundColor: c.variant === 'secondary' ? 'rgba(255,255,255,0.15)' : c.bgColor || 'rgba(255,255,255,0.2)', color: c.textColor || 'inherit', fontSize: s.fontSize || '13px' }} className="hover:opacity-80 transition-opacity cursor-pointer font-medium inline-block">{c.text || 'Кнопка'}</a>;
          case 'search':
            return <div key={i} className="flex items-center bg-white/10 rounded-lg overflow-hidden" style={{ maxWidth: s.maxWidth || '250px' }}><input type="text" placeholder={c.placeholder || 'Поиск...'} className="bg-transparent border-none outline-none px-3 py-1.5 text-sm w-full" style={{ color: 'inherit' }} />{c.buttonText && <span className="px-2 opacity-70 cursor-pointer hover:opacity-100">{c.buttonText}</span>}</div>;
          case 'text':
            return <span key={i} style={{ fontSize: s.fontSize || '14px', color: c.textColor || 'inherit' }}>{c.text}</span>;
          case 'link':
            return <a key={i} href={c.href || '#'} onClick={e => handleLink?.(e, c.href)} className="text-sm opacity-80 hover:opacity-100 cursor-pointer underline">{c.text || 'Ссылка'}</a>;
          case 'icon':
            return <span key={i} style={{ fontSize: c.size || '20px' }}>{c.emoji || '⭐'}</span>;
          case 'badge':
            return <span key={i} style={{ backgroundColor: c.bgColor || '#ef4444', color: c.textColor || '#fff', borderRadius: s.borderRadius || '99px', padding: s.padding || '2px 8px', fontSize: s.fontSize || '10px', fontWeight: 600 }}>{c.text || 'NEW'}</span>;
          case 'social':
            return <div key={i} className="flex items-center gap-1.5">{(c.links || []).map((sl: any, si: number) => <a key={si} href={sl.href || '#'} onClick={e => handleLink?.(e, sl.href)} className="opacity-70 hover:opacity-100 text-base cursor-pointer">{sl.icon || '🔗'}</a>)}</div>;
          case 'divider':
            return c.vertical ? <div key={i} className="w-px bg-current opacity-20" style={{ height: s.height || '24px' }} /> : <hr key={i} className="w-full opacity-20" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

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
  onEditBlock?: (blockId: string) => void;
  onBlockStyleUpdate?: (blockId: string, styles: Record<string, string>) => void;
  onBlockPositionUpdate?: (blockId: string, pos: { x: number; y: number }) => void;
  onDeleteBlock?: (blockId: string) => void;
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

/** Navbar link — supports two modes: direct navigation or mega-menu dropdown */
function NavLinkWithPreview({ link, pages, onNavigate, textColor, navBgColor }: {
  link: { label: string; href?: string; mode?: 'navigate' | 'megamenu'; sections?: { title: string; links: { label: string; href: string }[] }[]; description?: string };
  pages?: WebsitePage[];
  onNavigate?: (slug: string) => void;
  textColor?: string;
  navBgColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const slug = (link.href || '').replace(/^\//, '') || 'home';
  const mode = link.mode || (link.sections && link.sections.length > 0 ? 'megamenu' : 'navigate');

  const enter = () => { if (timer.current) clearTimeout(timer.current); if (mode === 'megamenu') setOpen(true); };
  const leave = () => { timer.current = setTimeout(() => setOpen(false), 250); };

  const goTo = (e: React.MouseEvent, href?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    const target = (href || link.href || '').replace(/^\//, '') || 'home';
    onNavigate?.(target);
  };

  // Auto-generate sections from page blocks when no sections defined
  const sections = link.sections && link.sections.length > 0
    ? link.sections
    : (() => {
        const targetPage = pages?.find(p => p.slug === slug);
        if (!targetPage || !targetPage.blocks?.length) return [];
        const contentBlocks = targetPage.blocks.filter(b => b.type !== 'navbar' && b.type !== 'footer' && b.type !== 'divider' && b.type !== 'spacer');
        if (contentBlocks.length === 0) return [];
        // Group blocks into 2-3 columns
        const perCol = Math.ceil(contentBlocks.length / 3);
        const cols: { title: string; links: { label: string; href: string }[] }[] = [];
        for (let i = 0; i < 3 && i * perCol < contentBlocks.length; i++) {
          const chunk = contentBlocks.slice(i * perCol, (i + 1) * perCol);
          const colTitle = chunk[0]?.content?.title || chunk[0]?.content?.heading || link.label;
          cols.push({
            title: i === 0 ? colTitle : (chunk[0]?.content?.title || chunk[0]?.content?.heading || ''),
            links: chunk.map(b => ({
              label: b.content?.title || b.content?.heading || b.content?.label || b.content?.name || b.type,
              href: link.href || '#'
            }))
          });
        }
        return cols;
      })();

  const description = link.description || '';

  // Navigate mode — simple link
  if (mode === 'navigate' || sections.length === 0) {
    return (
      <a
        href={link.href}
        onClick={(e) => goTo(e, link.href)}
        className="text-sm opacity-80 hover:opacity-100 cursor-pointer whitespace-nowrap py-2 block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all hover:after:w-full"
      >
        {link.label}
      </a>
    );
  }

  // Mega-menu mode
  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <a
        href={link.href}
        onClick={(e) => goTo(e, link.href)}
        className="text-sm opacity-80 hover:opacity-100 cursor-pointer whitespace-nowrap py-2 block relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-current after:transition-all"
        style={{ ['--tw-after-w' as any]: open ? '100%' : '0%' }}
      >
        {link.label}
        {open && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-600" />}
      </a>
      {open && (
        <div
          className="fixed left-0 right-0 z-50 bg-white shadow-2xl border-t border-gray-200"
          style={{ top: 'auto', marginTop: '8px' }}
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          <div className="max-w-6xl mx-auto px-8 py-10 grid gap-8" style={{ gridTemplateColumns: description ? `1fr ${sections.map(() => '1fr').join(' ')}` : sections.map(() => '1fr').join(' ') }}>
            {/* Description column (like "Our Mission") */}
            {description && (
              <div className="pr-8 border-r border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">{link.label}</h4>
                <p className="text-gray-500 text-sm leading-relaxed italic">{description}</p>
              </div>
            )}
            {/* Section columns */}
            {sections.map((section, si) => (
              <div key={si}>
                <h4 className="text-sm font-bold text-gray-900 mb-3">{section.title}</h4>
                <div className="space-y-2">
                  {(section.links || []).map((sl, li) => (
                    <a
                      key={li}
                      href={sl.href}
                      onClick={(e) => goTo(e, sl.href)}
                      className="block text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                    >
                      {sl.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderBlock(block: WebsiteBlock, onClick?: (id: string) => void, selectedId?: string | null, onNavigate?: (slug: string) => void, gs?: GlobalStyles, pages?: WebsitePage[], onStyleUpdate?: (blockId: string, styles: Record<string, string>) => void, onPositionUpdate?: (blockId: string, pos: { x: number; y: number }) => void, onEdit?: (id: string) => void, onDelete?: (id: string) => void) {
  const c = block.content || {} as any;
  const bs = block.styles || {}; // block-level styles override
  const isSelected = selectedId === block.id;
  const wrapperClass = `relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary ring-inset' : 'hover:ring-2 hover:ring-primary/40 hover:ring-inset'}`;

  // Merge block.styles into a CSSProperties object
  const blockStyle: React.CSSProperties = {};
  if (bs.bgColor || bs.backgroundColor) blockStyle.backgroundColor = bs.bgColor || bs.backgroundColor;
  if (bs.textColor || bs.color) blockStyle.color = bs.textColor || bs.color;
  if (bs.borderRadius) blockStyle.borderRadius = bs.borderRadius;
  if (bs.padding) blockStyle.padding = bs.padding;
  if (bs.margin) blockStyle.margin = bs.margin;
  if (bs.fontSize) blockStyle.fontSize = bs.fontSize;
  if (bs.fontWeight) blockStyle.fontWeight = bs.fontWeight;
  if (bs.fontFamily) blockStyle.fontFamily = bs.fontFamily;
  if (bs.boxShadow) blockStyle.boxShadow = bs.boxShadow;
  if (bs.border) blockStyle.border = bs.border;
  if (bs.opacity) blockStyle.opacity = bs.opacity;
  if (bs.backgroundImage) { blockStyle.backgroundImage = bs.backgroundImage; blockStyle.backgroundRepeat = 'no-repeat'; }
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

  const wrap = (node: React.ReactNode) => {
    const hasPosition = !!(block.position && (block.position.x || block.position.y));

    const startDrag = (axis: 'height' | 'width' | 'both') => (e: React.MouseEvent) => {
      if (!onStyleUpdate) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const el = (e.target as HTMLElement).closest('[data-block-wrap]') as HTMLElement;
      if (!el) return;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      const onMove = (ev: MouseEvent) => {
        const newStyles: Record<string, string> = { ...(block.styles || {}) };
        if (axis === 'height' || axis === 'both') {
          newStyles.minHeight = Math.max(40, startH + (ev.clientY - startY)) + 'px';
        }
        if (axis === 'width' || axis === 'both') {
          newStyles.maxWidth = Math.max(100, startW + (ev.clientX - startX)) + 'px';
        }
        onStyleUpdate(block.id, newStyles);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = axis === 'height' ? 'row-resize' : axis === 'width' ? 'col-resize' : 'nwse-resize';
      document.body.style.userSelect = 'none';
    };

    /** Drag block to move it on canvas — via move handle or long press */
    const startMove = (e: React.MouseEvent) => {
      if (!onPositionUpdate) return;
      const target = e.target as HTMLElement;
      // Ignore if clicking on resize handles or pencil/edit
      if (target.closest('[data-resize-handle]') || target.closest('[data-edit-btn]')) return;

      const isMoveHandle = !!target.closest('[data-move-handle]');
      if (isMoveHandle) {
        e.preventDefault();
        e.stopPropagation();
        beginDragMove(e.clientX, e.clientY);
        return;
      }

      // Long press: start drag after 300ms hold
      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      let moved = false;
      const cancelLongPress = () => {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        document.removeEventListener('mousemove', detectMove);
        document.removeEventListener('mouseup', cancelLongPress);
      };
      const detectMove = () => { moved = true; cancelLongPress(); };
      longPressTimer = setTimeout(() => {
        if (!moved) {
          beginDragMove(e.clientX, e.clientY);
        }
        cancelLongPress();
      }, 300);
      document.addEventListener('mousemove', detectMove, { once: true });
      document.addEventListener('mouseup', cancelLongPress, { once: true });
    };

    const beginDragMove = (startX: number, startY: number) => {
      const startPosX = block.position?.x || 0;
      const startPosY = block.position?.y || 0;
      // Get the block element position relative to canvas for non-positioned blocks
      const wrapEl = document.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement;
      const canvas = wrapEl?.closest('[data-canvas]') as HTMLElement;
      let offsetX = startPosX;
      let offsetY = startPosY;
      if (!block.position && wrapEl && canvas) {
        const wR = wrapEl.getBoundingClientRect();
        const cR = canvas.getBoundingClientRect();
        offsetX = wR.left - cR.left + canvas.scrollLeft;
        offsetY = wR.top - cR.top + canvas.scrollTop;
      }
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        onPositionUpdate!(block.id, { x: Math.max(0, offsetX + dx), y: Math.max(0, offsetY + dy) });
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    };

    const posStyle: React.CSSProperties = hasPosition
      ? { position: 'absolute', left: block.position!.x, top: block.position!.y, zIndex: isSelected ? 15 : 10 }
      : {};

    // Split: sizing on wrapper, visual styles on inner content wrapper
    const { maxWidth, minHeight, margin, ...visualStyle } = blockStyle;
    const sizeStyle: React.CSSProperties = {};
    if (maxWidth) sizeStyle.maxWidth = maxWidth;
    if (minHeight) sizeStyle.minHeight = minHeight;
    if (margin) sizeStyle.margin = margin;

    return (
      <div key={block.id} data-block-wrap data-block-id={block.id} className={wrapperClass} style={{ ...sizeStyle, ...posStyle }} onClick={() => onClick?.(block.id)} onMouseDown={startMove}>
        {onClick && (
          <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            {/* Move handle */}
            {onPositionUpdate && isSelected && (
              <div data-move-handle className="px-1.5 py-0.5 text-xs rounded bg-blue-500 text-white cursor-move select-none" title="Зажмите для перетаскивания">
                ✥
              </div>
            )}
            {/* Edit (pencil) button */}
            <div data-edit-btn className="px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80" onClick={(e) => { e.stopPropagation(); onEdit?.(block.id); }}>
              ✏️
            </div>
            {/* Delete button */}
            {onDelete && (
              <div data-edit-btn className="px-1.5 py-0.5 text-xs rounded bg-destructive text-destructive-foreground cursor-pointer hover:bg-destructive/80" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}
        <div style={visualStyle}>
          {/* Overlay image — top position */}
          {c.overlayImage && c.overlayPosition === 'top' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px' }}>
              <img src={c.overlayImage} alt="" style={{ maxWidth: c.overlayMaxWidth || '100%', borderRadius: c.overlayBorderRadius || '0', display: 'block' }} />
            </div>
          )}
          {node}
          {/* Overlay image — bottom/left/right/center */}
          {c.overlayImage && c.overlayPosition !== 'top' && (
            <div style={{ display: 'flex', justifyContent: c.overlayPosition === 'left' ? 'flex-start' : c.overlayPosition === 'right' ? 'flex-end' : 'center', padding: '8px 16px' }}>
              <img src={c.overlayImage} alt="" style={{ maxWidth: c.overlayMaxWidth || '100%', borderRadius: c.overlayBorderRadius || '0', display: 'block' }} />
            </div>
          )}
          {/* Render extras at bottom of any block (except navbar which renders inline) */}
          {block.type !== 'navbar' && block.extras && block.extras.length > 0 && (
            <div className="px-6 pb-4"><RenderExtras extras={block.extras} handleLink={handleLinkClick} /></div>
          )}
        </div>
        {/* Resize handles — only when block is selected and editable */}
        {isSelected && onStyleUpdate && (
          <>
            {/* Bottom edge */}
            <div data-resize-handle onMouseDown={startDrag('height')} className="absolute bottom-0 left-4 right-4 h-1.5 cursor-row-resize z-20 group/rh">
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/40 group-hover/rh:bg-primary group-hover/rh:h-1 transition-all" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-1.5 rounded-t bg-primary/60 opacity-0 group-hover/rh:opacity-100 transition-opacity" />
            </div>
            {/* Right edge */}
            <div data-resize-handle onMouseDown={startDrag('width')} className="absolute top-4 bottom-4 right-0 w-1.5 cursor-col-resize z-20 group/rw">
              <div className="absolute inset-y-0 right-0 w-0.5 bg-primary/40 group-hover/rw:bg-primary group-hover/rw:w-1 transition-all" />
              <div className="absolute top-1/2 -translate-y-1/2 right-0 h-8 w-1.5 rounded-l bg-primary/60 opacity-0 group-hover/rw:opacity-100 transition-opacity" />
            </div>
            {/* Corner */}
            <div data-resize-handle onMouseDown={startDrag('both')} className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-20 group/rc">
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b-2 border-r-2 border-primary/40 group-hover/rc:border-primary transition-colors" />
            </div>
            {/* Size / position indicator */}
            {(minHeight || maxWidth || hasPosition) && (
              <div className="absolute bottom-1 left-1 text-[9px] text-primary/60 bg-background/80 px-1 rounded z-20">
                {hasPosition && `X:${Math.round(block.position!.x)} Y:${Math.round(block.position!.y)}`}
                {hasPosition && (maxWidth || minHeight) && ' | '}
                {maxWidth && `W:${maxWidth}`}{maxWidth && minHeight && ' '}{minHeight && `H:${minHeight}`}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  switch (block.type) {
    case 'navbar':
      return wrap(
        <nav style={{ backgroundColor: c.bgColor || '#1e293b', color: c.textColor || '#fff' }} className="px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl cursor-pointer shrink-0" onClick={(e) => { e.stopPropagation(); onNavigate?.('home'); }}>{c.logo || 'Сайт'}</div>
          <div className="flex items-center gap-4 flex-wrap justify-end overflow-visible max-h-20">
            {(c.links || []).map((link: any, i: number) => (
              <NavLinkWithPreview key={i} link={link} pages={pages} onNavigate={onNavigate} textColor={c.textColor} navBgColor={c.bgColor} />
            ))}
            <RenderExtras extras={block.extras} handleLink={handleLinkClick} />
            {c.ctaText && <button onClick={(e) => { e.stopPropagation(); handleLinkClick(e as any, c.ctaHref); }} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors whitespace-nowrap">{c.ctaText}</button>}
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
      const cc = block.content || {} as any;
      const blockType = block.type?.toLowerCase() || '';
      return wrap(
        <div className="py-8 px-8" style={{ backgroundColor: cc.bgColor, color: cc.textColor }}>
          {/* Search bar */}
          {(blockType.includes('search') || cc.placeholder) && (
            <div className="flex items-center gap-2 max-w-xl mx-auto mb-4">
              <input type="text" placeholder={cc.placeholder || 'Поиск...'} className="flex-1 px-4 py-3 rounded-lg border bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-400" readOnly />
              {cc.buttonText && <button className="px-6 py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: gs?.primaryColor || '#2563eb' }}>{cc.buttonText}</button>}
            </div>
          )}
          {/* Image / banner */}
          {cc.imageUrl && <img src={cc.imageUrl} alt={cc.alt || cc.title || ''} className="w-full max-h-80 object-cover rounded-lg mb-4" />}
          {cc.src && !cc.imageUrl && <img src={cc.src} alt={cc.alt || cc.title || ''} className="w-full max-h-80 object-cover rounded-lg mb-4" />}
          {/* Title + subtitle + text */}
          {cc.title && <h2 className="text-2xl font-bold mb-4 text-center">{cc.title}</h2>}
          {cc.subtitle && <p className="text-center text-lg mb-4 opacity-80">{cc.subtitle}</p>}
          {cc.text && <p className="text-center mb-4">{cc.text}</p>}
          {cc.body && <p className="mb-4">{cc.body}</p>}
          {cc.description && !cc.text && !cc.body && <p className="text-center mb-4 opacity-80">{cc.description}</p>}
          {/* Buttons / links array */}
          {cc.buttons && Array.isArray(cc.buttons) && (
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {cc.buttons.map((btn: any, i: number) => (
                <a key={i} href={btn.href || btn.url || '#'} className="inline-block px-5 py-2.5 rounded-lg font-semibold transition" style={{ backgroundColor: btn.bgColor || gs?.primaryColor || '#2563eb', color: btn.textColor || '#fff' }}>{btn.label || btn.text || 'Кнопка'}</a>
              ))}
            </div>
          )}
          {cc.links && Array.isArray(cc.links) && !cc.buttons && (
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {cc.links.map((link: any, i: number) => (
                <a key={i} href={link.href || link.url || '#'} className="text-blue-500 hover:underline font-medium">{link.label || link.text || link.name || 'Ссылка'}</a>
              ))}
            </div>
          )}
          {/* Grid items */}
          {cc.items && Array.isArray(cc.items) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {cc.items.map((item: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border bg-white/5">
                  {item.icon && <span className="text-2xl">{item.icon}</span>}
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title || ''} className="w-full h-32 object-cover rounded mb-2" />}
                  {item.title && <h3 className="font-semibold mt-1">{item.title}</h3>}
                  {item.value && <p className="text-xl font-bold">{item.value}</p>}
                  {item.desc && <p className="text-sm opacity-70">{item.desc}</p>}
                  {item.description && !item.desc && <p className="text-sm opacity-70">{item.description}</p>}
                  {item.label && !item.title && <p className="text-sm">{item.label}</p>}
                  {item.name && <p className="font-medium">{item.name}</p>}
                  {item.text && <p className="text-sm opacity-80">{item.text}</p>}
                  {item.href && <a href={item.href} className="text-blue-500 text-sm hover:underline mt-1 inline-block">{item.linkText || 'Подробнее →'}</a>}
                </div>
              ))}
            </div>
          )}
          {/* Embed / iframe */}
          {cc.embedUrl && <iframe src={cc.embedUrl} className="w-full rounded-lg border mt-4" style={{ height: cc.height || '300px' }} title={cc.title || 'embed'} />}
          {/* CTA button */}
          {cc.ctaText && (
            <div className="text-center mt-6">
              <a href={cc.ctaHref || '#'} className="inline-block px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: gs?.primaryColor || '#2563eb', color: '#fff' }}>{cc.ctaText}</a>
            </div>
          )}
          {/* Form fields */}
          {cc.fields && Array.isArray(cc.fields) && (
            <div className="max-w-md mx-auto space-y-3 mt-4">
              {cc.fields.map((f: any, i: number) => (
                <div key={i}>
                  {f.label && <label className="block text-sm font-medium mb-1">{f.label}</label>}
                  <input type={f.type || 'text'} placeholder={f.placeholder || f.label || ''} className="w-full px-3 py-2 rounded border bg-white text-gray-900" readOnly />
                </div>
              ))}
              {cc.buttonText && <button className="w-full px-4 py-2.5 rounded-lg text-white font-semibold mt-2" style={{ backgroundColor: gs?.primaryColor || '#2563eb' }}>{cc.buttonText}</button>}
            </div>
          )}
          {/* Fallback: show type name if completely empty */}
          {!cc.title && !cc.text && !cc.items && !cc.buttons && !cc.placeholder && !cc.imageUrl && !cc.src && !cc.fields && !cc.embedUrl && !cc.body && !cc.links && (
            <p className="text-center text-muted-foreground">🧩 {block.type}</p>
          )}
        </div>
      );
  }
}

export function WebsitePreview({ blocks, pages, currentPageSlug, onPageNavigate, onBlockClick, onEditBlock, onBlockStyleUpdate, onBlockPositionUpdate, onDeleteBlock, selectedBlockId, globalStyles: gs }: WebsitePreviewProps) {
  // Determine which blocks to display: always use the blocks prop (already filtered by parent)
  const [activeSlug, setActiveSlug] = useState(currentPageSlug || 'home');

  // Sync with external currentPageSlug prop
  useEffect(() => {
    if (currentPageSlug) setActiveSlug(currentPageSlug);
  }, [currentPageSlug]);

  const hasPages = !!(pages && pages.length > 0);
  const displayBlocks = blocks;

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
  if (gs?.textColor) containerStyle.color = gs.textColor;
  if (gs?.fontFamily) containerStyle.fontFamily = gs.fontFamily;
  if (gs?.maxWidth) containerStyle.maxWidth = gs.maxWidth;

  // Separate flow blocks (no position) and absolutely positioned blocks
  const flowBlocks = displayBlocks.filter(b => !b.position || (!b.position.x && !b.position.y));
  const positionedBlocks = displayBlocks.filter(b => b.position && (b.position.x || b.position.y));

  return (
    <div className="relative min-h-full" style={containerStyle} data-canvas>
      {flowBlocks.map(block => renderBlock(block, onBlockClick, selectedBlockId, handleNavigate, gs, pages, onBlockStyleUpdate, onBlockPositionUpdate, onEditBlock, onDeleteBlock))}
      {positionedBlocks.map(block => renderBlock(block, onBlockClick, selectedBlockId, handleNavigate, gs, pages, onBlockStyleUpdate, onBlockPositionUpdate, onEditBlock, onDeleteBlock))}
    </div>
  );
}
