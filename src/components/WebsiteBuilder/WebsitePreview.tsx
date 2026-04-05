import { WebsiteBlock, WebsitePage, WebsiteBlockExtra, AppWebsite } from '@/types/website';
import { Trash2, Type } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';

/** Inline rich text editor with floating format toolbar */
const EDITOR_FONT_SIZES = [
  { label: '8', value: '8px' }, { label: '9', value: '9px' }, { label: '10', value: '10px' },
  { label: '11', value: '11px' }, { label: '12', value: '12px' }, { label: '14', value: '14px' },
  { label: '16', value: '16px' }, { label: '18', value: '18px' }, { label: '20', value: '20px' },
  { label: '22', value: '22px' }, { label: '24', value: '24px' }, { label: '28', value: '28px' },
  { label: '32', value: '32px' }, { label: '36', value: '36px' }, { label: '42', value: '42px' },
  { label: '48', value: '48px' }, { label: '56', value: '56px' }, { label: '64', value: '64px' },
  { label: '72', value: '72px' }, { label: '84', value: '84px' }, { label: '96', value: '96px' },
  { label: '120', value: '120px' },
];

const EDITOR_FONT_GROUPS: { group: string; fonts: { label: string; value: string }[] }[] = [
  { group: 'Системные', fonts: [
    { label: 'По умолчанию', value: 'inherit' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Courier New', value: "'Courier New', monospace" },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  ]},
  { group: 'Без засечек / Кириллица', fonts: [
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: "'Open Sans', sans-serif" },
    { label: 'Lato', value: 'Lato, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Poppins', value: 'Poppins, sans-serif' },
    { label: 'Nunito', value: 'Nunito, sans-serif' },
    { label: 'Raleway', value: 'Raleway, sans-serif' },
    { label: 'Ubuntu', value: 'Ubuntu, sans-serif' },
    { label: 'Fira Sans', value: "'Fira Sans', sans-serif" },
    { label: 'Exo 2', value: "'Exo 2', sans-serif" },
    { label: 'PT Sans', value: "'PT Sans', sans-serif" },
    { label: 'Noto Sans', value: "'Noto Sans', sans-serif" },
    { label: 'Source Sans 3', value: "'Source Sans 3', sans-serif" },
    { label: 'Mulish', value: 'Mulish, sans-serif' },
    { label: 'Rubik', value: 'Rubik, sans-serif' },
    { label: 'Work Sans', value: "'Work Sans', sans-serif" },
    { label: 'Manrope', value: 'Manrope, sans-serif' },
    { label: 'DM Sans', value: "'DM Sans', sans-serif" },
    { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
    { label: 'Outfit', value: 'Outfit, sans-serif' },
    { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
    { label: 'Barlow', value: 'Barlow, sans-serif' },
    { label: 'IBM Plex Sans', value: "'IBM Plex Sans', sans-serif" },
    { label: 'Nunito Sans', value: "'Nunito Sans', sans-serif" },
    { label: 'Figtree', value: 'Figtree, sans-serif' },
    { label: 'Lexend', value: 'Lexend, sans-serif' },
    { label: 'Josefin Sans', value: "'Josefin Sans', sans-serif" },
    { label: 'Karla', value: 'Karla, sans-serif' },
    { label: 'Hind', value: 'Hind, sans-serif' },
    { label: 'Cabin', value: 'Cabin, sans-serif' },
    { label: 'Quicksand', value: 'Quicksand, sans-serif' },
  ]},
  { group: 'С засечками / Кириллица', fonts: [
    { label: 'Playfair Display', value: "'Playfair Display', serif" },
    { label: 'Merriweather', value: 'Merriweather, serif' },
    { label: 'PT Serif', value: "'PT Serif', serif" },
    { label: 'Lora', value: 'Lora, serif' },
    { label: 'Noto Serif', value: "'Noto Serif', serif" },
    { label: 'EB Garamond', value: "'EB Garamond', serif" },
    { label: 'Cormorant', value: 'Cormorant, serif' },
    { label: 'Spectral', value: 'Spectral, serif' },
    { label: 'Libre Baskerville', value: "'Libre Baskerville', serif" },
    { label: 'Crimson Pro', value: "'Crimson Pro', serif" },
    { label: 'Bitter', value: 'Bitter, serif' },
    { label: 'Frank Ruhl Libre', value: "'Frank Ruhl Libre', serif" },
    { label: 'Bodoni Moda', value: "'Bodoni Moda', serif" },
    { label: 'Cardo', value: 'Cardo, serif' },
    { label: 'GFS Didot', value: "'GFS Didot', serif" },
  ]},
  { group: 'Декоративные', fonts: [
    { label: 'Oswald', value: 'Oswald, sans-serif' },
    { label: 'Russo One', value: "'Russo One', sans-serif" },
    { label: 'Bebas Neue', value: "'Bebas Neue', cursive" },
    { label: 'Righteous', value: 'Righteous, cursive' },
    { label: 'Lobster', value: 'Lobster, cursive' },
    { label: 'Pacifico', value: 'Pacifico, cursive' },
    { label: 'Fredoka One', value: "'Fredoka One', cursive" },
    { label: 'Comfortaa', value: 'Comfortaa, cursive' },
    { label: 'Press Start 2P', value: "'Press Start 2P', cursive" },
    { label: 'Bungee', value: 'Bungee, cursive' },
    { label: 'Lilita One', value: "'Lilita One', cursive" },
    { label: 'Abril Fatface', value: "'Abril Fatface', cursive" },
    { label: 'Anton', value: 'Anton, sans-serif' },
    { label: 'Titan One', value: "'Titan One', cursive" },
    { label: 'Dela Gothic One', value: "'Dela Gothic One', cursive" },
    { label: 'Graduate', value: 'Graduate, cursive' },
    { label: 'Teko', value: 'Teko, sans-serif' },
    { label: 'Black Ops One', value: "'Black Ops One', cursive" },
    { label: 'Bangers', value: 'Bangers, cursive' },
    { label: 'Exo', value: 'Exo, sans-serif' },
    { label: 'Racing Sans One', value: "'Racing Sans One', cursive" },
    { label: 'Fugaz One', value: "'Fugaz One', cursive" },
  ]},
  { group: 'Рукописные', fonts: [
    { label: 'Dancing Script', value: "'Dancing Script', cursive" },
    { label: 'Caveat', value: 'Caveat, cursive' },
    { label: 'Indie Flower', value: "'Indie Flower', cursive" },
    { label: 'Shadows Into Light', value: "'Shadows Into Light', cursive" },
    { label: 'Patrick Hand', value: "'Patrick Hand', cursive" },
    { label: 'Kalam', value: 'Kalam, cursive' },
    { label: 'Architects Daughter', value: "'Architects Daughter', cursive" },
    { label: 'Comic Sans', value: "'Comic Sans MS', cursive" },
    { label: 'Great Vibes', value: "'Great Vibes', cursive" },
    { label: 'Sacramento', value: 'Sacramento, cursive' },
    { label: 'Permanent Marker', value: "'Permanent Marker', cursive" },
    { label: 'Handlee', value: 'Handlee, cursive' },
    { label: 'Satisfy', value: 'Satisfy, cursive' },
    { label: 'Yellowtail', value: 'Yellowtail, cursive' },
    { label: 'Allura', value: 'Allura, cursive' },
    { label: 'Cookie', value: 'Cookie, cursive' },
  ]},
  { group: 'Моноширинные', fonts: [
    { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
    { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    { label: 'Fira Code', value: "'Fira Code', monospace" },
    { label: 'Space Mono', value: "'Space Mono', monospace" },
    { label: 'Roboto Mono', value: "'Roboto Mono', monospace" },
    { label: 'DM Mono', value: "'DM Mono', monospace" },
    { label: 'Overpass Mono', value: "'Overpass Mono', monospace" },
    { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
    { label: 'Inconsolata', value: 'Inconsolata, monospace' },
  ]},
  { group: 'Переменные шрифты (Variable)', fonts: [
    { label: 'Roboto Flex', value: "'Roboto Flex', sans-serif" },
    { label: 'Fraunces', value: 'Fraunces, serif' },
    { label: 'Recursive', value: 'Recursive, sans-serif' },
    { label: 'Literata', value: 'Literata, serif' },
    { label: 'Encode Sans', value: "'Encode Sans', sans-serif" },
    { label: 'League Spartan', value: "'League Spartan', sans-serif" },
    { label: 'Chivo', value: 'Chivo, sans-serif' },
    { label: 'Bricolage Grotesque', value: "'Bricolage Grotesque', sans-serif" },
  ]},
];

/** Font weight presets */
const EDITOR_FONT_WEIGHTS = [
  { label: 'Thin 100', value: '100' },
  { label: 'ExtraLight 200', value: '200' },
  { label: 'Light 300', value: '300' },
  { label: 'Regular 400', value: '400' },
  { label: 'Medium 500', value: '500' },
  { label: 'SemiBold 600', value: '600' },
  { label: 'Bold 700', value: '700' },
  { label: 'ExtraBold 800', value: '800' },
  { label: 'Black 900', value: '900' },
];

/** Gradient text presets — uses background-clip: text */
const EDITOR_GRADIENT_TEXT = [
  { label: 'Нет', css: '' },
  { label: 'Закат 🌅', css: 'linear-gradient(135deg,#f97316,#db2777,#a855f7)' },
  { label: 'Океан 🌊', css: 'linear-gradient(135deg,#06b6d4,#2563eb,#6366f1)' },
  { label: 'Лес 🌿', css: 'linear-gradient(135deg,#22c55e,#0891b2)' },
  { label: 'Золото ✨', css: 'linear-gradient(135deg,#fbbf24,#f97316,#ef4444)' },
  { label: 'Радуга 🌈', css: 'linear-gradient(90deg,#ef4444,#f97316,#fbbf24,#22c55e,#2563eb,#a855f7)' },
  { label: 'Мрамор 🤍', css: 'linear-gradient(135deg,#e5e7eb,#6b7280,#1f2937)' },
  { label: 'Неон 💜', css: 'linear-gradient(135deg,#22c55e,#06b6d4,#6366f1)' },
  { label: 'Розовый 🌸', css: 'linear-gradient(135deg,#f43f5e,#a855f7)' },
  { label: 'Кобальт', css: 'linear-gradient(135deg,#1e3a5f,#60a5fa)' },
  { label: 'Огонь 🔥', css: 'linear-gradient(135deg,#991b1b,#dc2626,#f97316,#fbbf24)' },
  { label: 'Перламутр', css: 'linear-gradient(135deg,#c4b5fd,#93c5fd,#6ee7b7)' },
];

/** Text stroke (outline) presets using -webkit-text-stroke */
const EDITOR_TEXT_STROKE = [
  { label: 'Нет', value: '' },
  { label: '1px ⚫', value: '1px #000000' },
  { label: '1px ⚪', value: '1px #ffffff' },
  { label: '2px ⚫', value: '2px #000000' },
  { label: '2px ⚪', value: '2px #ffffff' },
  { label: '1px 🔵', value: '1px #3b82f6' },
  { label: '1px 🔴', value: '1px #ef4444' },
  { label: '2px ✨', value: '2px #f59e0b' },
  { label: '3px ⚫', value: '3px #000000' },
];

const EDITOR_SHADOWS = [
  { label: 'Нет', value: 'none' },
  { label: 'Чёрная', value: '1px 1px 2px rgba(0,0,0,0.8)' },
  { label: 'Белая', value: '1px 1px 2px rgba(255,255,255,0.9),-1px -1px 2px rgba(255,255,255,0.9)' },
  { label: 'Мягкая', value: '2px 2px 4px rgba(0,0,0,0.4)' },
  { label: 'Глубокая', value: '3px 3px 0 rgba(0,0,0,0.4),5px 5px 10px rgba(0,0,0,0.3)' },
  { label: 'Неон 🔵', value: '0 0 5px #3b82f6,0 0 15px #3b82f6,0 0 30px #3b82f6' },
  { label: 'Неон 🔴', value: '0 0 5px #ef4444,0 0 15px #ef4444,0 0 30px #ef4444' },
  { label: 'Неон 🟢', value: '0 0 5px #22c55e,0 0 15px #22c55e,0 0 30px #22c55e' },
  { label: 'Неон 🟡', value: '0 0 5px #f59e0b,0 0 15px #f59e0b,0 0 30px #f59e0b' },
  { label: 'Неон 🟣', value: '0 0 5px #8b5cf6,0 0 15px #8b5cf6,0 0 30px #8b5cf6' },
  { label: 'Ретро', value: '2px 2px 0 #ff6b6b,4px 4px 0 #4ecdc4' },
  { label: 'Контур', value: '-1px -1px 0 rgba(0,0,0,0.9),1px -1px 0 rgba(0,0,0,0.9),-1px 1px 0 rgba(0,0,0,0.9),1px 1px 0 rgba(0,0,0,0.9)' },
  { label: 'Золото', value: '1px 1px 0 #b8860b,2px 2px 4px rgba(184,134,11,0.5),0 0 8px rgba(255,215,0,0.3)' },
  { label: '3D', value: '1px 1px 0 #555,2px 2px 0 #555,3px 3px 0 #555,4px 4px 0 #555' },
];

const EDITOR_HIGHLIGHT_COLORS = [
  'transparent',
  // Стандартные маркеры
  '#fef08a','#bbf7d0','#bfdbfe','#fecaca','#e9d5ff','#fed7aa','#fce7f3','#a7f3d0',
  // Насыщенные
  '#facc15','#4ade80','#60a5fa','#f87171','#c084fc','#fb923c','#f472b6','#34d399',
  // Тёмные
  '#000000','#1f2937','#b45309','#065f46','#1e40af','#7c3aed','#9f1239','#ffffff',
];

const EDITOR_COLOR_PALETTE = [
  // Blacks & Whites
  '#000000','#111827','#1f2937','#374151','#4b5563','#6b7280',
  '#9ca3af','#d1d5db','#e5e7eb','#f3f4f6','#f9fafb','#ffffff',
  // Reds & Pinks
  '#7f1d1d','#991b1b','#b91c1c','#dc2626','#ef4444','#f87171',
  '#fca5a5','#fecaca','#ec4899','#f43f5e','#fb7185','#fda4af',
  // Oranges & Yellows
  '#7c2d12','#c2410c','#ea580c','#f97316','#fb923c','#fdba74',
  '#78350f','#b45309','#d97706','#f59e0b','#fbbf24','#fde68a',
  // Greens
  '#14532d','#15803d','#16a34a','#22c55e','#4ade80','#86efac',
  '#bbf7d0','#134e4a','#0f766e','#14b8a6','#2dd4bf','#99f6e4',
  // Blues & Cyans
  '#1e3a5f','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd',
  '#0e7490','#0891b2','#06b6d4','#67e8f9','#a5f3fc','#cffafe',
  // Purples & Indigos
  '#3730a3','#4338ca','#4f46e5','#6366f1','#818cf8','#a5b4fc',
  '#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe',
];

function loadEditorFonts() {
  const id = 'copilot-editor-gfonts';
  if (document.getElementById(id)) return;
  // All Google Fonts used in EDITOR_FONT_GROUPS — loaded with full weight range for variable fonts
  const list = [
    'Inter:wght@100;200;300;400;500;600;700;800;900',
    'Roboto:wght@100;300;400;500;700;900',
    'Open+Sans:wght@300;400;500;600;700;800',
    'Lato:wght@100;300;400;700;900',
    'Montserrat:wght@100;200;300;400;500;600;700;800;900',
    'Poppins:wght@100;200;300;400;500;600;700;800;900',
    'Nunito:wght@200;300;400;500;600;700;800;900',
    'Raleway:wght@100;200;300;400;500;600;700;800;900',
    'Ubuntu:wght@300;400;500;700',
    'Fira+Sans:wght@100;200;300;400;500;600;700;800;900',
    'Exo+2:wght@100;200;300;400;500;600;700;800;900',
    'PT+Sans:wght@400;700',
    'Noto+Sans:wght@100;200;300;400;500;600;700;800;900',
    'Source+Sans+3:wght@200;300;400;500;600;700;800;900',
    'Mulish:wght@200;300;400;500;600;700;800;900',
    'Rubik:wght@300;400;500;600;700;800;900',
    'Work+Sans:wght@100;200;300;400;500;600;700;800;900',
    'Manrope:wght@200;300;400;500;600;700;800',
    'DM+Sans:wght@100;200;300;400;500;600;700;800;900',
    'Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800',
    'Outfit:wght@100;200;300;400;500;600;700;800;900',
    'Space+Grotesk:wght@300;400;500;600;700',
    'Barlow:wght@100;200;300;400;500;600;700;800;900',
    'IBM+Plex+Sans:wght@100;200;300;400;500;600;700',
    'Nunito+Sans:wght@200;300;400;500;600;700;800;900',
    'Figtree:wght@300;400;500;600;700;800;900',
    'Lexend:wght@100;200;300;400;500;600;700;800;900',
    'Josefin+Sans:wght@100;200;300;400;500;600;700',
    'Karla:wght@200;300;400;500;600;700;800',
    'Hind:wght@300;400;500;600;700',
    'Cabin:wght@400;500;600;700',
    'Quicksand:wght@300;400;500;600;700',
    'Playfair+Display:wght@400;500;600;700;800;900',
    'Merriweather:wght@300;400;700;900',
    'PT+Serif:wght@400;700',
    'Lora:wght@400;500;600;700',
    'Noto+Serif:wght@100;200;300;400;500;600;700;800;900',
    'EB+Garamond:wght@400;500;600;700;800',
    'Cormorant:wght@300;400;500;600;700',
    'Spectral:wght@200;300;400;500;600;700;800',
    'Libre+Baskerville:wght@400;700',
    'Crimson+Pro:wght@200;300;400;500;600;700;800;900',
    'Bitter:wght@100;200;300;400;500;600;700;800;900',
    'Frank+Ruhl+Libre:wght@300;400;500;600;700;800;900',
    'Bodoni+Moda:wght@400;500;600;700;800;900',
    'Cardo:wght@400;700',
    'GFS+Didot:wght@400',
    'Oswald:wght@200;300;400;500;600;700',
    'Russo+One:wght@400',
    'Bebas+Neue:wght@400',
    'Righteous:wght@400',
    'Lobster:wght@400',
    'Pacifico:wght@400',
    'Fredoka+One:wght@400',
    'Comfortaa:wght@300;400;500;600;700',
    'Press+Start+2P:wght@400',
    'Bungee:wght@400',
    'Lilita+One:wght@400',
    'Abril+Fatface:wght@400',
    'Anton:wght@400',
    'Titan+One:wght@400',
    'Dela+Gothic+One:wght@400',
    'Graduate:wght@400',
    'Teko:wght@300;400;500;600;700',
    'Black+Ops+One:wght@400',
    'Bangers:wght@400',
    'Exo:wght@100;200;300;400;500;600;700;800;900',
    'Racing+Sans+One:wght@400',
    'Fugaz+One:wght@400',
    'Dancing+Script:wght@400;500;600;700',
    'Caveat:wght@400;500;600;700',
    'Indie+Flower:wght@400',
    'Shadows+Into+Light:wght@400',
    'Patrick+Hand:wght@400',
    'Kalam:wght@300;400;700',
    'Architects+Daughter:wght@400',
    'Great+Vibes:wght@400',
    'Sacramento:wght@400',
    'Permanent+Marker:wght@400',
    'Handlee:wght@400',
    'Satisfy:wght@400',
    'Yellowtail:wght@400',
    'Allura:wght@400',
    'Cookie:wght@400',
    'Source+Code+Pro:wght@200;300;400;500;600;700;800;900',
    'JetBrains+Mono:wght@100;200;300;400;500;600;700;800',
    'Fira+Code:wght@300;400;500;600;700',
    'Space+Mono:wght@400;700',
    'Roboto+Mono:wght@100;200;300;400;500;600;700',
    'DM+Mono:wght@300;400;500',
    'Overpass+Mono:wght@300;400;500;600;700;800;900',
    'IBM+Plex+Mono:wght@100;200;300;400;500;600;700',
    'Inconsolata:wght@200;300;400;500;600;700;800;900',
    'Roboto+Flex:wght@100;200;300;400;500;600;700;800;900',
    'Fraunces:wght@100;200;300;400;500;600;700;800;900',
    'Recursive:wght@300;400;500;600;700;800;900',
    'Literata:wght@200;300;400;500;600;700;800;900',
    'Encode+Sans:wght@100;200;300;400;500;600;700;800;900',
    'League+Spartan:wght@100;200;300;400;500;600;700;800;900',
    'Chivo:wght@100;200;300;400;500;600;700;800;900',
    'Bricolage+Grotesque:wght@200;300;400;500;600;700;800',
  ];
  const params = list.map(f => `family=${f}`).join('&');
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
  document.head.appendChild(link);
}

function InlineTextEditor({ blockId, initialHtml, onSave, onClose }: { blockId: string; initialHtml: string; onSave: (html: string) => void; onClose: () => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [currentHighlight, setCurrentHighlight] = useState('transparent');
  const showToolbarRef = useRef(false);

  // Load Google Fonts once
  useEffect(() => { loadEditorFonts(); }, []);

  // Set content ONCE on mount — avoids dangerouslySetInnerHTML resetting on every re-render
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editorRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreRange = useCallback(() => {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
  }, []);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) {
      if (showToolbarRef.current) { showToolbarRef.current = false; setShowToolbar(false); }
      return;
    }
    saveRange();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.closest('[data-block-wrap]')?.getBoundingClientRect();
    if (editorRect) {
      setToolbarPos({
        x: Math.max(310, Math.min(rect.left - editorRect.left + rect.width / 2, editorRect.width - 310)),
        y: rect.top - editorRect.top,
      });
    }
    if (!showToolbarRef.current) { showToolbarRef.current = true; setShowToolbar(true); }
  }, [saveRange]);

  useEffect(() => {
    document.addEventListener('selectionchange', checkSelection);
    return () => document.removeEventListener('selectionchange', checkSelection);
  }, [checkSelection]);

  const cmd = (command: string, value?: string) => {
    restoreRange();
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  /** Wrap selected text in a span with a CSS style property */
  const applySpanStyle = useCallback((prop: string, value: string) => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { editorRef.current?.focus(); return; }
    const range = sel.getRangeAt(0);
    if (range.collapsed) { editorRef.current?.focus(); return; }
    try {
      const fragment = range.extractContents();
      const span = document.createElement('span');
      (span.style as any)[prop] = value;
      span.appendChild(fragment);
      range.insertNode(span);
    } catch { /* ignore */ }
    editorRef.current?.focus();
  }, [restoreRange]);

  const applyColor = (color: string) => {
    setCurrentColor(color);
    restoreRange();
    document.execCommand('foreColor', false, color);
    editorRef.current?.focus();
  };

  const applyHighlight = (color: string) => {
    setCurrentHighlight(color);
    restoreRange();
    if (color === 'transparent') {
      document.execCommand('hiliteColor', false, 'rgba(0,0,0,0)');
    } else {
      const applied = document.execCommand('hiliteColor', false, color);
      if (!applied) applySpanStyle('backgroundColor', color);
    }
    editorRef.current?.focus();
  };

  const applyFontSize = (px: string) => {
    applySpanStyle('fontSize', px);
  };

  const applyFont = (family: string) => {
    if (family === 'inherit') { cmd('removeFormat'); return; }
    applySpanStyle('fontFamily', family);
  };

  const applyShadow = (shadow: string) => {
    applySpanStyle('textShadow', shadow === 'none' ? '' : shadow);
  };

  /** Apply gradient text using background-clip: text */
  const applyGradientText = useCallback((gradient: string) => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { editorRef.current?.focus(); return; }
    const range = sel.getRangeAt(0);
    if (range.collapsed) { editorRef.current?.focus(); return; }
    try {
      const fragment = range.extractContents();
      const span = document.createElement('span');
      if (!gradient) {
        // Remove gradient
        span.style.backgroundImage = '';
        (span.style as any).webkitBackgroundClip = '';
        (span.style as any).webkitTextFillColor = '';
        (span.style as any).backgroundClip = '';
      } else {
        span.style.backgroundImage = gradient;
        (span.style as any).webkitBackgroundClip = 'text';
        (span.style as any).webkitTextFillColor = 'transparent';
        (span.style as any).backgroundClip = 'text';
      }
      span.appendChild(fragment);
      range.insertNode(span);
    } catch { /* ignore */ }
    editorRef.current?.focus();
  }, [restoreRange]);

  /** Apply text stroke (outline) using -webkit-text-stroke */
  const applyTextStroke = useCallback((stroke: string) => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { editorRef.current?.focus(); return; }
    const range = sel.getRangeAt(0);
    if (range.collapsed) { editorRef.current?.focus(); return; }
    try {
      const fragment = range.extractContents();
      const span = document.createElement('span');
      (span.style as any).WebkitTextStroke = stroke;
      span.appendChild(fragment);
      range.insertNode(span);
    } catch { /* ignore */ }
    editorRef.current?.focus();
  }, [restoreRange]);

  const insertLink = () => {
    const url = window.prompt('Введите URL ссылки:', 'https://');
    if (url) cmd('createLink', url);
  };

  const handleSave = () => {
    if (editorRef.current) onSave(editorRef.current.innerHTML);
    onClose();
  };

  const TB = ({ onClick, title, children, className = '' }: { onClick: () => void; title?: string; children: React.ReactNode; className?: string }) => (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
      onClick={e => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`h-7 min-w-[24px] px-1 rounded hover:bg-muted text-xs flex items-center justify-center shrink-0 ${className}`}
    >{children}</button>
  );

  return (
    <>
      {showToolbar && (
        <div
          ref={toolbarRef}
          className="absolute z-50 bg-popover border rounded-xl shadow-2xl p-2"
          style={{ left: toolbarPos.x, top: toolbarPos.y, transform: 'translateX(-50%) translateY(-105%)', width: '620px', maxWidth: '96vw' }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
        >
          {/* ── Row 1: Block format · Font · Weight · Size · B/I/U/S/O · Undo/Redo · Remove ── */}
          <div className="flex flex-wrap items-center gap-0.5">
            <TB onClick={() => cmd('formatBlock', 'h1')} title="H1" className="font-extrabold text-[11px]">H1</TB>
            <TB onClick={() => cmd('formatBlock', 'h2')} title="H2" className="font-bold text-[11px]">H2</TB>
            <TB onClick={() => cmd('formatBlock', 'h3')} title="H3" className="font-semibold text-[11px]">H3</TB>
            <TB onClick={() => cmd('formatBlock', 'h4')} title="H4" className="font-semibold text-[10px]">H4</TB>
            <TB onClick={() => cmd('formatBlock', 'h5')} title="H5" className="text-[10px]">H5</TB>
            <TB onClick={() => cmd('formatBlock', 'h6')} title="H6" className="text-[10px] text-muted-foreground">H6</TB>
            <TB onClick={() => cmd('formatBlock', 'p')} title="Параграф">¶</TB>
            <TB onClick={() => cmd('formatBlock', 'blockquote')} title="Цитата" className="italic text-[10px]">❝</TB>
            <TB onClick={() => cmd('formatBlock', 'pre')} title="Код/Preformatted" className="font-mono text-[9px]">&lt;/&gt;</TB>
            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Font family — grouped with optgroup */}
            <select title="Шрифт" onMouseDown={e => e.stopPropagation()} onChange={e => { if (e.target.value) applyFont(e.target.value); }} defaultValue=""
              className="h-7 text-[11px] rounded border bg-background px-1 cursor-pointer w-[130px]">
              <option value="" disabled>Шрифт</option>
              {EDITOR_FONT_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.fonts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </optgroup>
              ))}
            </select>

            {/* Font weight */}
            <select title="Насыщенность" onMouseDown={e => e.stopPropagation()} onChange={e => { if (e.target.value) applySpanStyle('fontWeight', e.target.value); }} defaultValue=""
              className="h-7 text-[11px] rounded border bg-background px-1 cursor-pointer w-[90px]">
              <option value="" disabled>Жирность</option>
              {EDITOR_FONT_WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>

            {/* Font size px */}
            <select title="Размер (px)" onMouseDown={e => e.stopPropagation()} onChange={e => { if (e.target.value) applyFontSize(e.target.value); }} defaultValue=""
              className="h-7 text-[11px] rounded border bg-background px-1 cursor-pointer w-[56px]">
              <option value="" disabled>px</option>
              {EDITOR_FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="w-px h-5 bg-border mx-0.5" />

            <TB onClick={() => cmd('bold')} title="Жирный" className="font-bold">B</TB>
            <TB onClick={() => cmd('italic')} title="Курсив" className="italic">I</TB>
            <TB onClick={() => cmd('underline')} title="Подчёркнутый" className="underline">U</TB>
            <TB onClick={() => cmd('strikeThrough')} title="Зачёркнутый" className="line-through">S</TB>
            <TB onClick={() => applySpanStyle('textDecoration', 'overline')} title="Надчёркнутый" className="text-[11px] [text-decoration:overline]">O</TB>
            <div className="w-px h-5 bg-border mx-0.5" />

            <TB onClick={() => cmd('undo')} title="Отменить">↩</TB>
            <TB onClick={() => cmd('redo')} title="Повторить">↪</TB>
            <div className="w-px h-5 bg-border mx-0.5" />
            <TB onClick={() => cmd('removeFormat')} title="Убрать форматирование" className="text-muted-foreground text-[10px]">✕</TB>
          </div>

          {/* ── Row 2: Align · Lists · Indent · Super/Sub · Transform · Variant · Spacing · Link ── */}
          <div className="flex flex-wrap items-center gap-0.5 mt-0.5 pt-0.5 border-t border-border/30">
            <TB onClick={() => cmd('justifyLeft')} title="По левому краю">⬅</TB>
            <TB onClick={() => cmd('justifyCenter')} title="По центру">↔</TB>
            <TB onClick={() => cmd('justifyRight')} title="По правому краю">➡</TB>
            <TB onClick={() => cmd('justifyFull')} title="По ширине" className="text-[10px]">☰</TB>
            <div className="w-px h-5 bg-border mx-0.5" />
            <TB onClick={() => cmd('insertUnorderedList')} title="Маркированный список" className="text-[10px]">•≡</TB>
            <TB onClick={() => cmd('insertOrderedList')} title="Нумерованный список" className="text-[10px]">1≡</TB>
            <TB onClick={() => cmd('outdent')} title="Уменьшить отступ" className="text-[10px]">←|</TB>
            <TB onClick={() => cmd('indent')} title="Увеличить отступ" className="text-[10px]">|→</TB>
            <div className="w-px h-5 bg-border mx-0.5" />
            <TB onClick={() => cmd('superscript')} title="Надстрочный (x²)" className="text-[10px]">X²</TB>
            <TB onClick={() => cmd('subscript')} title="Подстрочный (x₂)" className="text-[10px]">X₂</TB>
            <div className="w-px h-5 bg-border mx-0.5" />
            <TB onClick={() => applySpanStyle('textTransform', 'uppercase')} title="ВСЕ ЗАГЛАВНЫЕ" className="font-semibold text-[10px]">AA</TB>
            <TB onClick={() => applySpanStyle('textTransform', 'capitalize')} title="Каждое Слово" className="text-[10px]">Aa</TB>
            <TB onClick={() => applySpanStyle('textTransform', 'lowercase')} title="все строчные" className="text-[10px]">aa</TB>
            <TB onClick={() => applySpanStyle('fontVariant', 'small-caps')} title="Малые заглавные (Small Caps)" className="text-[9px]">Sc</TB>
            <TB onClick={() => applySpanStyle('textTransform', 'none')} title="Обычный" className="text-[9px] text-muted-foreground">—T</TB>
            <div className="w-px h-5 bg-border mx-0.5" />
            <TB onClick={insertLink} title="Вставить ссылку" className="text-[11px]">🔗</TB>
            <TB onClick={() => cmd('unlink')} title="Удалить ссылку" className="text-[10px] text-muted-foreground">✂🔗</TB>
            <div className="w-px h-5 bg-border mx-0.5" />
            {/* Letter spacing */}
            <span className="text-[9px] text-muted-foreground shrink-0">A↔A:</span>
            {[{l:'–',v:'-0.05em',t:'Тесно'},{l:'·',v:'normal',t:'Норма'},{l:'+',v:'0.08em',t:'Шире'},{l:'++',v:'0.15em',t:'Широко'},{l:'+++',v:'0.25em',t:'Очень широко'}].map(({l,v,t}) => (
              <button key={v} title={t} onMouseDown={e=>{e.preventDefault();e.stopPropagation();}} onClick={e=>{e.preventDefault();e.stopPropagation();applySpanStyle('letterSpacing',v);}}
                className="h-6 px-1 rounded text-[9px] hover:bg-muted border border-border/40">{l}</button>
            ))}
            <div className="w-px h-5 bg-border mx-0.5" />
            {/* Line height */}
            <span className="text-[9px] text-muted-foreground shrink-0">↕:</span>
            {[{l:'1',v:'1'},{l:'1.2',v:'1.2'},{l:'1.5',v:'1.5'},{l:'1.8',v:'1.8'},{l:'2',v:'2'},{l:'2.5',v:'2.5'}].map(({l,v}) => (
              <button key={v} title={`Межстрочный: ${v}`} onMouseDown={e=>{e.preventDefault();e.stopPropagation();}} onClick={e=>{e.preventDefault();e.stopPropagation();applySpanStyle('lineHeight',v);}}
                className="h-6 px-1 rounded text-[9px] hover:bg-muted border border-border/40">{l}</button>
            ))}
            <div className="w-px h-5 bg-border mx-0.5" />
            {/* Word spacing */}
            <span className="text-[9px] text-muted-foreground shrink-0">W↔:</span>
            {[{l:'—',v:'normal',t:'Норма'},{l:'+',v:'4px',t:'Шире'},{l:'++',v:'8px',t:'Широко'},{l:'+++',v:'16px',t:'Очень широко'}].map(({l,v,t}) => (
              <button key={v} title={t} onMouseDown={e=>{e.preventDefault();e.stopPropagation();}} onClick={e=>{e.preventDefault();e.stopPropagation();applySpanStyle('wordSpacing',v);}}
                className="h-6 px-1 rounded text-[9px] hover:bg-muted border border-border/40">{l}</button>
            ))}
          </div>

          {/* ── Row 3: Text shadows ── */}
          <div className="flex flex-wrap items-center gap-0.5 mt-0.5 pt-0.5 border-t border-border/30">
            <span className="text-[9px] text-muted-foreground mr-0.5 shrink-0">Тень:</span>
            {EDITOR_SHADOWS.map(s => (
              <button key={s.value} title={s.label}
                onMouseDown={e=>{e.preventDefault();e.stopPropagation();}}
                onClick={e=>{e.preventDefault();e.stopPropagation();applyShadow(s.value);}}
                className="h-6 px-1.5 rounded text-[10px] hover:bg-muted border border-border/40 whitespace-nowrap"
                style={{ textShadow: s.value === 'none' ? 'none' : s.value }}
              >{s.label}</button>
            ))}
          </div>

          {/* ── Row 4: Gradient text + Text stroke ── */}
          <div className="flex flex-wrap items-center gap-0.5 mt-0.5 pt-0.5 border-t border-border/30">
            <span className="text-[9px] text-muted-foreground mr-0.5 shrink-0">Градиент:</span>
            {EDITOR_GRADIENT_TEXT.map(g => (
              <button key={g.css} title={g.label}
                onMouseDown={e=>{e.preventDefault();e.stopPropagation();}}
                onClick={e=>{e.preventDefault();e.stopPropagation();applyGradientText(g.css);}}
                className="h-6 px-1.5 rounded text-[10px] hover:bg-muted border border-border/40 whitespace-nowrap font-semibold"
                style={g.css ? {
                  backgroundImage: g.css,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : {}}
              >{g.label}</button>
            ))}
            <div className="w-px h-5 bg-border mx-0.5" />
            <span className="text-[9px] text-muted-foreground shrink-0">Обводка:</span>
            {EDITOR_TEXT_STROKE.map(s => (
              <button key={s.value} title={s.label}
                onMouseDown={e=>{e.preventDefault();e.stopPropagation();}}
                onClick={e=>{e.preventDefault();e.stopPropagation();applyTextStroke(s.value);}}
                className="h-6 px-1.5 rounded text-[10px] hover:bg-muted border border-border/40 whitespace-nowrap"
              >{s.label}</button>
            ))}
          </div>

          {/* ── Row 5: Text colour ── */}
          <div className="border-t border-border/50 mt-1 pt-1 flex items-start gap-1.5">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <input type="color" value={currentColor} title="Цвет текста"
                onMouseDown={e=>{e.stopPropagation();saveRange();}} onChange={e=>applyColor(e.target.value)}
                className="w-8 h-7 rounded cursor-pointer border border-border p-0.5 shrink-0" />
              <span className="text-[8px] text-muted-foreground leading-none">текст</span>
            </div>
            <div className="grid gap-0.5 flex-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
              {EDITOR_COLOR_PALETTE.map(col => (
                <button key={col} title={col}
                  onMouseDown={e=>{e.preventDefault();e.stopPropagation();}}
                  onClick={e=>{e.preventDefault();e.stopPropagation();applyColor(col);}}
                  className="w-full aspect-square rounded-sm border border-black/10 hover:scale-125 hover:z-10 transition-transform shrink-0"
                  style={{ backgroundColor: col, outline: currentColor===col ? '2px solid #3b82f6' : 'none', outlineOffset: '1px' }} />
              ))}
            </div>
          </div>

          {/* ── Row 6: Highlight / background colour ── */}
          <div className="border-t border-border/30 mt-1 pt-1 flex items-center gap-1.5">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <input type="color" value={currentHighlight === 'transparent' ? '#fef08a' : currentHighlight} title="Фон текста (маркер)"
                onMouseDown={e=>{e.stopPropagation();saveRange();}} onChange={e=>applyHighlight(e.target.value)}
                className="w-8 h-7 rounded cursor-pointer border border-border p-0.5 shrink-0" />
              <span className="text-[8px] text-muted-foreground leading-none">маркер</span>
            </div>
            <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
              {EDITOR_HIGHLIGHT_COLORS.map(col => (
                <button key={col} title={col === 'transparent' ? 'Без фона' : col}
                  onMouseDown={e=>{e.preventDefault();e.stopPropagation();}}
                  onClick={e=>{e.preventDefault();e.stopPropagation();applyHighlight(col);}}
                  className="w-5 h-5 rounded border border-black/20 hover:scale-110 transition-transform shrink-0"
                  style={{
                    backgroundColor: col === 'transparent' ? 'transparent' : col,
                    outline: currentHighlight===col ? '2px solid #3b82f6' : 'none',
                    backgroundImage: col === 'transparent' ? 'repeating-linear-gradient(45deg,#ccc 0,#ccc 2px,#fff 0,#fff 50%)' : 'none',
                    backgroundSize: '6px 6px',
                  }} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="outline-none min-h-[2em] cursor-text rounded-lg border border-primary/30 bg-background/50 p-3 focus:border-primary focus:ring-1 focus:ring-primary"
        style={{ whiteSpace: 'pre-wrap' }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
        onMouseUp={checkSelection}
      />
      <div className="flex justify-end gap-1 mt-2 px-2 pb-2" onClick={e => e.stopPropagation()}>
        <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onClose(); }} className="px-3 py-1 text-xs rounded bg-muted hover:bg-muted/80">Отмена</button>
        <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); handleSave(); }} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/80">Сохранить</button>
      </div>
    </>
  );
}


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
  onBlockContentUpdate?: (blockId: string, content: Record<string, any>) => void;
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

/** Build initial HTML for the inline editor from existing block content fields */
function getBlockInitialHtml(block: WebsiteBlock): string {
  const c = block.content || {} as any;
  if (c.richText) return c.richText;
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const parts: string[] = [];
  if (c.title) parts.push(`<h2 style="font-size:1.5em;font-weight:700;margin-bottom:6px">${esc(c.title)}</h2>`);
  if (c.subtitle && c.subtitle !== c.title) parts.push(`<p style="margin-bottom:6px;opacity:0.8">${esc(c.subtitle)}</p>`);
  if (c.body) parts.push(`<p>${esc(c.body)}</p>`);
  if (c.text && typeof c.text === 'string' && c.text !== c.title && c.text !== c.body) parts.push(`<p>${esc(c.text)}</p>`);
  if (c.description && c.description !== c.subtitle && c.description !== c.body) parts.push(`<p style="margin-top:6px">${esc(c.description)}</p>`);
  if (c.logo && !c.title) parts.push(`<strong>${esc(c.logo)}</strong>`);
  // Capture additional AI-generated block fields
  if (c.copyright) parts.push(`<p style="margin-top:6px">${esc(c.copyright)}</p>`);
  if (c.tagline && c.tagline !== c.subtitle) parts.push(`<p>${esc(c.tagline)}</p>`);
  if (c.heading && c.heading !== c.title) parts.push(`<h3>${esc(c.heading)}</h3>`);
  if (c.content && typeof c.content === 'string' && c.content !== c.body) parts.push(`<p>${esc(c.content)}</p>`);
  // Capture items/links as a list
  if (!parts.length && c.items && Array.isArray(c.items)) {
    parts.push('<ul style="list-style:disc;padding-left:20px">');
    c.items.forEach((item: any) => {
      const label = item.title || item.text || item.name || item.label || '';
      if (label) parts.push(`<li>${esc(label)}${item.desc ? ` — ${esc(item.desc)}` : ''}</li>`);
    });
    parts.push('</ul>');
  }
  if (!parts.length && c.links && Array.isArray(c.links)) {
    parts.push('<ul style="list-style:disc;padding-left:20px">');
    c.links.forEach((link: any) => {
      const label = link.label || link.text || link.name || link.href || '';
      if (label) parts.push(`<li>${esc(label)}</li>`);
    });
    parts.push('</ul>');
  }
  // Last resort: collect all top-level string values (excluding URL-like and color fields)
  if (!parts.length) {
    const skip = new Set(['richText','bgColor','textColor','heroImage','image','imageUrl','src','overlayImage','embedUrl','href','url','link','ctaHref','icon','iconUrl']);
    Object.entries(c).forEach(([k, v]) => {
      if (!skip.has(k) && typeof v === 'string' && v.length > 0 && v.length < 500 && !v.startsWith('http') && !v.startsWith('#') && !v.startsWith('data:')) {
        parts.push(`<p><strong>${esc(k)}:</strong> ${esc(v)}</p>`);
      }
    });
  }
  return parts.length ? parts.join('') : '<p>Начните вводить текст...</p>';
}

/** Slideshow background: cycles through multiple images with fade */
function SlideshowBg({ urls, interval }: { urls: string[]; interval: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (urls.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % urls.length), interval * 1000);
    return () => clearInterval(t);
  }, [urls.length, interval]);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {urls.map((url, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${url.trim()})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: i === idx ? 1 : 0, transition: 'opacity 0.9s ease' }} />
      ))}
    </div>
  );
}

/** YouTube/video iframe as block background */
function VideoBgLayer({ url }: { url: string }) {
  const ytId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\s?#]+)/)?.[1];
  if (ytId) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&disablekb=1`} allow="autoplay; encrypted-media" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '177.78vh', height: '100vh', minWidth: '100%', minHeight: '56.25vw', border: 'none' }} title="bg-video" />
      </div>
    );
  }
  // Native video (mp4/webm direct URL)
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <video autoPlay muted loop playsInline style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', minWidth: '100%', minHeight: '100%', objectFit: 'cover', border: 'none' }} src={url} />
      </div>
    );
  }
  return null;
}

function renderBlock(block: WebsiteBlock, onClick?: (id: string) => void, selectedId?: string | null, onNavigate?: (slug: string) => void, gs?: GlobalStyles, pages?: WebsitePage[], onStyleUpdate?: (blockId: string, styles: Record<string, string>) => void, onPositionUpdate?: (blockId: string, pos: { x: number; y: number }) => void, onEdit?: (id: string) => void, onDelete?: (id: string) => void, onContentUpdate?: (blockId: string, content: Record<string, any>) => void, inlineEditId?: string | null, setInlineEditId?: (id: string | null) => void) {
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
  // Scroll-animation data attributes (not CSS — applied via data-* on wrapper div)
  const animateIn = bs.animateIn as string | undefined;
  const animateDelay = bs.animateDelay as string | undefined;
  const animateDuration = bs.animateDuration as string | undefined;
  const animateOut = bs.animateOut as string | undefined;

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
    const { maxWidth, minHeight, margin, backgroundImage: blockBgImage, backgroundSize: blockBgSize, backgroundPosition: blockBgPos, backgroundRepeat: blockBgRepeat, ...visualStyle } = blockStyle;
    const sizeStyle: React.CSSProperties = {};
    if (maxWidth) sizeStyle.maxWidth = maxWidth;
    if (minHeight) sizeStyle.minHeight = minHeight;
    if (margin) sizeStyle.margin = margin;
    const hasBlockBgImage = !!blockBgImage;
    // Video background and slideshow
    const backgroundVideo = bs.backgroundVideo as string | undefined;
    const backgroundSlideshow = bs.backgroundSlideshow as string | undefined;
    const backgroundSlideshowInterval = Number(bs.backgroundSlideshowInterval || 5);
    const slideshowUrls = backgroundSlideshow ? backgroundSlideshow.split('\n').map((u: string) => u.trim()).filter(Boolean) : [];
    const hasSpecialBg = hasBlockBgImage || !!backgroundVideo || slideshowUrls.length > 0;

    return (
      <div key={block.id} data-block-wrap data-block-id={block.id} {...(animateIn ? { 'data-animate': animateIn } : {})} {...(animateDelay ? { 'data-animate-delay': animateDelay } : {})} {...(animateDuration ? { 'data-animate-duration': animateDuration } : {})} {...(animateOut ? { 'data-animate-out': animateOut } : {})} className={wrapperClass} style={{ ...sizeStyle, ...posStyle }} onClick={() => onClick?.(block.id)} onMouseDown={startMove}>
        {onClick && (
          <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            {/* Move handle */}
            {onPositionUpdate && isSelected && (
              <div data-move-handle className="px-1.5 py-0.5 text-xs rounded bg-blue-500 text-white cursor-move select-none" title="Зажмите для перетаскивания">
                ✥
              </div>
            )}
            {/* Edit (pencil) button */}
            <div data-edit-btn className="px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); onEdit?.(block.id); }}>
              ✏️
            </div>
            {/* Inline text edit (T) button */}
            {onContentUpdate && (
              <div data-edit-btn className="px-1.5 py-0.5 text-xs rounded bg-indigo-500 text-white cursor-pointer hover:bg-indigo-600 font-bold" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); setInlineEditId?.(inlineEditId === block.id ? null : block.id); }} title="Редактировать текст">
                <Type className="w-3.5 h-3.5" />
              </div>
            )}
            {/* Delete button */}
            {onDelete && (
              <div data-edit-btn className="px-1.5 py-0.5 text-xs rounded bg-destructive text-destructive-foreground cursor-pointer hover:bg-destructive/80" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}
        <div style={{ ...visualStyle, ...(hasSpecialBg ? { position: 'relative', overflow: 'hidden' } : {}) }}>
          {hasBlockBgImage && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: blockBgImage, backgroundSize: blockBgSize || 'cover', backgroundPosition: blockBgPos || 'center', backgroundRepeat: blockBgRepeat || 'no-repeat' }} />
          )}
          {backgroundVideo && <VideoBgLayer url={backgroundVideo} />}
          {slideshowUrls.length > 0 && <SlideshowBg urls={slideshowUrls} interval={backgroundSlideshowInterval} />}
          <div style={hasSpecialBg ? { position: 'relative', zIndex: 1 } : undefined}>
          {(() => {
            // When T-editor is open for non-text/hero blocks, REPLACE block content with the editor
            const isInlineEditing = inlineEditId === block.id && block.type !== 'text' && block.type !== 'hero';
            if (isInlineEditing && onContentUpdate) {
              return (
                <div className="px-4 pb-4 pt-2">
                  <InlineTextEditor
                    key={block.id}
                    blockId={block.id}
                    initialHtml={getBlockInitialHtml(block)}
                    onSave={(html) => onContentUpdate(block.id, { richText: html })}
                    onClose={() => setInlineEditId?.(null)}
                  />
                </div>
              );
            }
            return (
              <>
                {/* Overlay image — top position (before content) */}
                {c.overlayImage && (c.overlayPosition === 'top') && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px' }}>
                    <img src={c.overlayImage} alt="" style={{ maxWidth: c.overlayMaxWidth || '100%', borderRadius: c.overlayBorderRadius || '0', display: 'block' }} />
                  </div>
                )}
                {/* If richText exists (block was T-edited), show it instead of structural content */}
                {c.richText && block.type !== 'text' && block.type !== 'hero' ? (
                  <div className="px-6 py-4" dangerouslySetInnerHTML={{ __html: c.richText }} />
                ) : (
                  <>
                    {/* Overlay image — left/right wraps content side-by-side */}
                    {c.overlayImage && (c.overlayPosition === 'left' || c.overlayPosition === 'right') ? (
                      <div style={{ display: 'flex', flexDirection: c.overlayPosition === 'left' ? 'row' : 'row-reverse', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flexShrink: 0, maxWidth: c.overlayMaxWidth || '40%', padding: '8px' }}>
                          <img src={c.overlayImage} alt="" style={{ width: '100%', borderRadius: c.overlayBorderRadius || '0', display: 'block' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>{node}</div>
                      </div>
                    ) : (
                      <>{node}</>
                    )}
                  </>
                )}
                {/* Overlay image — bottom/center position (after content, always shown) */}
                {c.overlayImage && (c.overlayPosition === 'bottom' || c.overlayPosition === 'center' || (!c.overlayPosition)) && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px' }}>
                    <img src={c.overlayImage} alt="" style={{ maxWidth: c.overlayMaxWidth || '100%', borderRadius: c.overlayBorderRadius || '0', display: 'block' }} />
                  </div>
                )}
                {/* Overlay image — top position is already handled above, skip here */}
                {/* Render extras at bottom of any block (except navbar) */}
                {block.type !== 'navbar' && block.extras && block.extras.length > 0 && (
                  <div className="px-6 pb-4"><RenderExtras extras={block.extras} handleLink={handleLinkClick} /></div>
                )}
              </>
            );
          })()}
          </div>
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
        <nav style={{ backgroundColor: c.bgColor || '#1e293b', color: c.textColor || '#fff' }} className={`px-6 py-4 flex items-center justify-between ${c.sticky ? 'sticky top-0 z-50' : ''}`}>
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
        <section style={{ backgroundColor: c.bgColor || gs?.backgroundColor || '#1e293b', color: c.textColor || gs?.textColor || '#fff', backgroundImage: c.heroImage ? `url(${c.heroImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }} className="py-20 px-8">
          {c.heroImage && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${c.overlay ?? 0.4})` }} />}
          <div className={`max-w-4xl mx-auto text-${c.align || 'center'} relative z-10`}>
            {inlineEditId === block.id && onContentUpdate ? (
              <div className="my-4">
                <InlineTextEditor
                  key={block.id}
                  blockId={block.id}
                  initialHtml={getBlockInitialHtml(block)}
                  onSave={(html) => { onContentUpdate(block.id, { richText: html }); setInlineEditId?.(null); }}
                  onClose={() => setInlineEditId?.(null)}
                />
              </div>
            ) : c.richText ? (
              <div dangerouslySetInnerHTML={{ __html: c.richText }} className="mb-6" />
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={gs?.headingFont ? { fontFamily: gs.headingFont } : undefined}>{c.title || 'Заголовок'}</h1>
                {c.subtitle && <p className="text-lg md:text-xl opacity-80 mb-8 max-w-2xl mx-auto">{c.subtitle}</p>}
              </>
            )}
            {inlineEditId !== block.id && c.ctaText && <a href={c.ctaHref || '#'} onClick={(e) => handleLinkClick(e, c.ctaHref)} style={gs?.accentColor ? { backgroundColor: gs.accentColor } : undefined} className="inline-block px-8 py-4 rounded-xl bg-white/20 hover:bg-white/30 font-semibold text-lg transition-colors cursor-pointer">{c.ctaText}</a>}
            {inlineEditId !== block.id && (c.searchFields || []).length > 0 && (
              <div className="flex flex-wrap items-end gap-3 mt-8 max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                {(c.searchFields || []).map((f: any, i: number) => (
                  <div key={i} className="flex-1 min-w-[140px]">
                    {f.label && <label className="block text-xs font-medium mb-1 opacity-80">{f.label}</label>}
                    <input type={f.type || 'text'} placeholder={f.placeholder || ''} className="w-full px-4 py-3 rounded-lg border-0 bg-white text-gray-900 text-sm" readOnly />
                  </div>
                ))}
                <button className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: gs?.primaryColor || '#2563eb' }}>{c.searchButtonText || 'Найти'}</button>
              </div>
            )}
          </div>
        </section>
      );

    case 'text':
      return wrap(
        <section className="py-12 px-8 max-w-4xl mx-auto">
          {inlineEditId === block.id && onContentUpdate ? (
            <InlineTextEditor
              key={block.id}
              blockId={block.id}
              initialHtml={getBlockInitialHtml(block)}
              onSave={(html) => { onContentUpdate(block.id, { richText: html }); setInlineEditId?.(null); }}
              onClose={() => setInlineEditId?.(null)}
            />
          ) : c.richText ? (
            <div className={`text-${c.align || 'left'}`} dangerouslySetInnerHTML={{ __html: c.richText }} />
          ) : (
            <>
              {c.title && <h2 className={`text-3xl font-bold mb-4 text-${c.align || 'left'}`}>{c.title}</h2>}
              <p className={`text-muted-foreground leading-relaxed text-${c.align || 'left'} whitespace-pre-wrap`}>{c.body || ''}</p>
            </>
          )}
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
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${c.columns || 4} gap-6`}>
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-background shadow-sm">
                  {item.image ? <img src={item.image} alt={item.title} className="w-16 h-16 object-contain mx-auto mb-3" /> : <div className="text-4xl mb-3">{item.icon}</div>}
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
                  <div className="flex items-center gap-3">
                    {item.avatar && <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover" />}
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      {item.role && <div className="text-xs text-muted-foreground">{item.role}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'contact':
      return wrap(
        <section className="py-16 px-8 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
            <div className={`flex-1 ${c.image ? 'text-left' : 'text-center w-full'}`}>
              {c.title && <h2 className="text-3xl font-bold mb-4">{c.title}</h2>}
              {c.subtitle && <p className="opacity-80 mb-6">{c.subtitle}</p>}
              <div className={`flex flex-wrap ${c.image ? 'justify-start' : 'justify-center'} gap-4 text-sm mb-4`}>
                {c.phone && <a href={`tel:${c.phone}`} className="opacity-90 hover:opacity-100 text-lg font-semibold">📞 {c.phone}</a>}
              </div>
              {c.buttonText && <a href={c.buttonHref || '#'} onClick={(e) => handleLinkClick(e, c.buttonHref)} className="inline-block px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 font-medium cursor-pointer mb-4">{c.buttonText}</a>}
              <div className={`flex flex-wrap ${c.image ? 'justify-start' : 'justify-center'} gap-4 text-sm`}>
                {c.email && <a href={`mailto:${c.email}`} className="opacity-90 hover:opacity-100">📧 {c.email}</a>}
                {c.address && <span>📍 {c.address}</span>}
                {c.hours && <span>🕐 {c.hours}</span>}
              </div>
            </div>
            {c.image && <div className="md:w-1/3 shrink-0"><img src={c.image} alt={c.title || ''} className="w-full rounded-2xl object-cover" /></div>}
          </div>
        </section>
      );

    case 'video': {
      const getVideoEmbedUrl = (url: string) => {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        return url;
      };
      return wrap(
        <section className="py-12 px-8 max-w-4xl mx-auto">
          {c.title && <h2 className="text-3xl font-bold mb-6 text-center">{c.title}</h2>}
          {c.url ? (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
              <iframe src={getVideoEmbedUrl(c.url)} className="w-full h-full" allowFullScreen title="video" />
            </div>
          ) : <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">🎬 Вставьте URL видео</div>}
        </section>
      );
    }

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
        <footer style={{ backgroundColor: c.bgColor || undefined, color: c.textColor || undefined }} className="py-12 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-10 mb-8">
              {/* Brand column */}
              <div className="md:w-1/3 shrink-0">
                {c.companyName && <div className="font-bold text-xl mb-3" style={{ color: c.linkColor || c.textColor || undefined }}>{c.companyName}</div>}
                {c.description && <p className="text-sm opacity-70 mb-5">{c.description}</p>}
                {(c.socialLinks || []).length > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    {(c.socialLinks || []).map((s: any, i: number) => {
                      const icons: Record<string, string> = { youtube: '▶', instagram: '📷', telegram: '✈', facebook: '𝐟', twitter: '𝕏', tiktok: '♪', vk: 'VK' };
                      return <a key={i} href={s.url || '#'} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-current/30 flex items-center justify-center text-sm hover:opacity-80 transition-opacity cursor-pointer" title={s.platform}>{icons[s.platform] || s.icon || '🔗'}</a>;
                    })}
                  </div>
                )}
              </div>
              {/* Multi-column links */}
              {(c.columns || []).length > 0 ? (
                <div className="flex-1 grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min((c.columns || []).length, 4)}, minmax(0, 1fr))` }}>
                  {(c.columns || []).map((col: any, ci: number) => (
                    <div key={ci}>
                      {col.title && <div className="font-semibold text-sm mb-4 tracking-widest uppercase opacity-60">{col.title}</div>}
                      <div className="flex flex-col gap-2">
                        {(col.links || []).map((link: any, li: number) => (
                          <a key={li} href={link.href || '#'} onClick={(e) => handleLinkClick(e, link.href)} className="text-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style={{ color: c.linkColor || undefined }}>{link.label}</a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (c.links || []).length > 0 ? (
                <div className="flex-1 flex flex-wrap gap-4 justify-end items-start">
                  {(c.links || []).map((link: any, i: number) => <a key={i} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className="text-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer">{link.label}</a>)}
                </div>
              ) : null}
            </div>
            <div className="border-t border-current/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="text-sm opacity-50">{c.copyright || '© 2024'}</div>
              {(c.paymentIcons || []).length > 0 && (
                <div className="flex gap-2">
                  {(c.paymentIcons || []).map((icon: any, i: number) => (
                    icon.image ? <img key={i} src={icon.image} alt={icon.name || ''} className="h-6 object-contain" /> : <span key={i} className="px-2 py-1 border border-current/20 rounded text-xs font-medium opacity-60">{icon.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </footer>
      );

    case 'cards':
      return wrap(
        <section className="py-12 px-8">
          {c.title && <h2 className="text-2xl font-bold mb-2 text-center">{c.title}</h2>}
          {c.subtitle && <p className="text-muted-foreground text-center mb-8">{c.subtitle}</p>}
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${c.columns || 3}, minmax(0, 1fr))` }}>
            {(c.items || []).map((item: any, i: number) => (
              <a key={i} href={item.link || '#'} onClick={(e) => handleLinkClick(e, item.link)} className="group rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                {item.image && <div className="relative aspect-[4/3] overflow-hidden"><img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />{item.badge && <span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground">{item.badge}</span>}</div>}
                <div className="p-4">
                  {item.title && <h3 className="font-semibold mb-1">{item.title}</h3>}
                  {item.desc && <p className="text-sm text-muted-foreground">{item.desc}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      );

    case 'carousel':
      return wrap(
        <section className="py-12 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              {c.iconImage && <img src={c.iconImage} alt="" className="w-12 h-12 object-contain" />}
              <div className="flex-1">
                {c.title && <h2 className="text-2xl font-bold">{c.title}</h2>}
                {c.subtitle && <p className="text-muted-foreground text-sm mt-1">{c.subtitle}</p>}
              </div>
              {c.linkText && <a href={c.linkHref || '#'} onClick={(e) => handleLinkClick(e, c.linkHref)} className="text-sm font-medium text-primary hover:underline cursor-pointer whitespace-nowrap">{c.linkText} →</a>}
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {(c.items || []).map((item: any, i: number) => (
              <a key={i} href={item.link || '#'} onClick={(e) => handleLinkClick(e, item.link)} className="snap-start shrink-0 w-72 rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                {item.image && <div className="aspect-[4/3] overflow-hidden"><img src={item.image} alt={item.title} className="w-full h-full object-cover" /></div>}
                <div className="p-4">
                  {item.title && <h3 className="font-semibold mb-1">{item.title}</h3>}
                  {item.desc && <p className="text-sm text-muted-foreground">{item.desc}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      );

    case 'product':
      return wrap(
        <section className="py-12 px-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 border rounded-2xl overflow-hidden bg-card shadow">
            <div className="md:w-1/2 flex gap-2 overflow-x-auto p-4 snap-x snap-mandatory">
              {(c.images || ['']).map((src: string, i: number) => (
                <div key={i} className="snap-start shrink-0 w-full aspect-square rounded-xl overflow-hidden bg-muted">
                  {src ? <img src={src} alt={c.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Нет фото</div>}
                </div>
              ))}
            </div>
            <div className="md:w-1/2 p-6 flex flex-col">
              {c.badge && <span className="self-start mb-2 px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground">{c.badge}</span>}
              <h2 className="text-2xl font-bold mb-4">{c.title || 'Товар'}</h2>
              {(c.specs || []).length > 0 && (
                <div className="space-y-1 mb-4 text-sm">
                  {(c.specs || []).map((s: any, i: number) => (
                    <div key={i} className="flex justify-between border-b py-1"><span className="text-muted-foreground">{s.label}</span><span className="font-medium">{s.value}</span></div>
                  ))}
                </div>
              )}
              <div className="mt-auto">
                <div className="text-3xl font-bold mb-1">{c.price || ''}</div>
                {c.priceNote && <div className="text-sm text-muted-foreground mb-3">{c.priceNote}</div>}
                {c.ctaText && <a href={c.ctaHref || '#'} onClick={(e) => handleLinkClick(e, c.ctaHref)} className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 cursor-pointer">{c.ctaText}</a>}
              </div>
            </div>
          </div>
        </section>
      );

    case 'linkList':
      return wrap(
        <section className="py-12 px-8">
          {c.title && <h2 className="text-2xl font-bold mb-8 text-center">{c.title}</h2>}
          <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${c.columns || 3}, minmax(0, 1fr))` }}>
            {(c.groups || []).map((group: any, i: number) => (
              <div key={i}>
                {group.heading && <h3 className="font-semibold mb-3">{group.heading}</h3>}
                <ul className="space-y-1">
                  {(group.links || []).map((link: any, j: number) => (
                    <li key={j}><a href={link.href || '#'} onClick={(e) => handleLinkClick(e, link.href)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );

    case 'searchBar':
      return wrap(
        <section className="py-8 px-8" style={{ backgroundColor: c.bgColor }}>
          {c.title && <h2 className="text-xl font-bold mb-4 text-center">{c.title}</h2>}
          <div className="flex flex-wrap items-end gap-3 max-w-4xl mx-auto">
            {(c.fields || []).map((field: any, i: number) => (
              <div key={i} className="flex-1 min-w-[160px]">
                {field.label && <label className="block text-xs font-medium mb-1">{field.label}</label>}
                <input type={field.type || 'text'} placeholder={field.placeholder || ''} className="w-full px-4 py-3 rounded-lg border bg-background text-sm" readOnly />
              </div>
            ))}
            <button className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: gs?.primaryColor || '#2563eb' }}>{c.buttonText || 'Найти'}</button>
          </div>
        </section>
      );

    case 'imageText':
      return wrap(
        <section className="py-16 px-8" style={{ backgroundColor: c.bgColor || undefined }}>
          <div className={`max-w-5xl mx-auto flex flex-col ${c.imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
            <div className="md:w-1/2">
              {c.image ? <img src={c.image} alt={c.title || ''} className="w-full rounded-2xl shadow-lg object-cover" /> : <div className="w-full aspect-video bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">🖼️ Добавьте изображение</div>}
            </div>
            <div className="md:w-1/2">
              {c.title && <h2 className="text-3xl font-bold mb-4">{c.title}</h2>}
              {c.body && <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">{c.body}</p>}
              {c.ctaText && <a href={c.ctaHref || '#'} onClick={(e) => handleLinkClick(e, c.ctaHref)} className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 cursor-pointer">{c.ctaText}</a>}
            </div>
          </div>
        </section>
      );

    case 'steps':
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-4 text-center">{c.title}</h2>}
            {c.subtitle && <p className="text-muted-foreground text-center mb-12">{c.subtitle}</p>}
            {c.layout === 'vertical' ? (
              <div className="relative max-w-2xl mx-auto space-y-0">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-primary/20" />
                {(c.items || []).map((item: any, i: number) => (
                  <div key={i} className="relative flex gap-6 pb-10 last:pb-0">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0 z-10">{item.icon || item.number || (i + 1)}</div>
                    <div className="pt-2">
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
                {(c.items || []).map((item: any, i: number, arr: any[]) => (
                  <div key={i} className="flex flex-col items-center text-center p-6 relative">
                    {i < arr.length - 1 && <div className="hidden md:block absolute right-0 top-12 w-full h-0.5 bg-primary/20 z-0" style={{ width: '50%', right: '-25%' }} />}
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 z-10 shadow-md">{item.icon || item.number || (i + 1)}</div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );

    case 'checklist':
      return wrap(
        <section className="py-12 px-8" style={{ backgroundColor: c.bgColor || undefined }}>
          <div className="max-w-4xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-3 text-center">{c.title}</h2>}
            {c.subtitle && <p className="text-muted-foreground text-center mb-8">{c.subtitle}</p>}
            <div className={`grid grid-cols-1 ${c.columns >= 2 ? 'md:grid-cols-2' : ''} ${c.columns >= 3 ? 'lg:grid-cols-3' : ''} gap-3`}>
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${item.checked ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/30'}`}>
                  <span className={`text-xl shrink-0 mt-0.5 ${item.checked ? 'text-green-500' : 'text-muted-foreground'}`}>{item.checked ? '✅' : '☐'}</span>
                  <span className={`text-sm font-medium ${item.checked ? '' : 'text-muted-foreground'}`}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'iconGrid':
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-4 text-center">{c.title}</h2>}
            {c.subtitle && <p className="text-muted-foreground text-center mb-12">{c.subtitle}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gridTemplateColumns: `repeat(${Math.min(c.columns || 3, 6)}, minmax(0, 1fr))` }}>
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="group flex flex-col items-center text-center p-6 rounded-2xl hover:bg-primary/5 transition-colors cursor-default">
                  <span className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{item.icon}</span>
                  <h3 className="font-bold text-base mb-2">{item.title}</h3>
                  {item.desc && <p className="text-sm text-muted-foreground">{item.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'blogGrid':
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                {c.title && <h2 className="text-3xl font-bold">{c.title}</h2>}
                {c.subtitle && <p className="text-muted-foreground mt-2">{c.subtitle}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gridTemplateColumns: `repeat(${Math.min(c.columns || 3, 4)}, minmax(0, 1fr))` , gap: '1.5rem' }}>
              {(c.posts || []).map((post: any, i: number) => (
                <a key={i} href={post.link || '#'} onClick={(e) => handleLinkClick(e, post.link)} className="group rounded-2xl overflow-hidden border bg-card hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-[16/9] bg-muted overflow-hidden">
                    {post.image ? <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📰</div>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {post.category && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{post.category}</span>}
                      {post.readTime && <span className="text-xs text-muted-foreground">{post.readTime}</span>}
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {post.author && <span>✍️ {post.author}</span>}
                      {post.date && <span>{post.date}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      );

    case 'cookieBanner': {
      return wrap(
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ position: 'relative' }}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl shadow-2xl p-4 sm:p-5" style={{ backgroundColor: c.bgColor || '#1e293b', color: c.textColor || '#ffffff' }}>
            <span className="text-2xl shrink-0">🍪</span>
            <p className="flex-1 text-sm leading-relaxed">{c.text || 'Мы используем cookie-файлы.'}</p>
            <div className="flex gap-2 shrink-0">
              {c.linkText && <a href={c.linkHref || '#'} className="px-3 py-1.5 text-xs rounded-lg border border-current opacity-70 hover:opacity-100 cursor-pointer">{c.linkText}</a>}
              {c.declineText && <button className="px-3 py-1.5 text-xs rounded-lg border border-current opacity-70 hover:opacity-100">{c.declineText}</button>}
              <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90">{c.acceptText || 'Принять'}</button>
            </div>
          </div>
        </div>
      );
    }

    case 'popup': {
      return wrap(
        <div className="relative py-4 px-8">
          <div className="text-xs text-muted-foreground text-center mb-2">
            <span className="px-2 py-0.5 rounded bg-muted">Поп-ап (показывается через {c.delay || 3}с)</span>
          </div>
          <div className="max-w-md mx-auto rounded-2xl border shadow-2xl overflow-hidden" style={{ backgroundColor: c.bgColor || '#ffffff', color: c.textColor || '#1e293b' }}>
            <div className="relative">
              {c.image && <img src={c.image} alt="" className="w-full h-40 object-cover" />}
              <button className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-sm">✕</button>
            </div>
            <div className="p-6 text-center">
              {c.title && <h3 className="text-xl font-bold mb-2">{c.title}</h3>}
              {c.subtitle && <p className="text-sm text-muted-foreground mb-4">{c.subtitle}</p>}
              <input type="email" placeholder="Ваш email" className="w-full px-4 py-2 rounded-lg border mb-3 text-sm bg-background text-foreground" readOnly />
              {c.buttonText && <button className="w-full px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90">{c.buttonText}</button>}
              {c.closeText && <button className="mt-3 text-xs text-muted-foreground hover:text-foreground block mx-auto">{c.closeText}</button>}
            </div>
          </div>
        </div>
      );
    }

    case 'beforeAfter': {
      return wrap(
        <section className="py-16 px-8">
          <div className="max-w-3xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-8 text-center">{c.title}</h2>}
            <div className="relative rounded-2xl overflow-hidden border shadow-lg select-none" style={{ aspectRatio: '16/9', backgroundColor: '#e2e8f0' }}>
              {/* After image (background) */}
              {c.afterImage ? <img src={c.afterImage} alt={c.afterLabel || 'После'} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-green-100"><span className="text-4xl">🟢</span></div>}
              {/* Before image (clipped left side) */}
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - (c.position ?? 50)}% 0 0)` }}>
                {c.beforeImage ? <img src={c.beforeImage} alt={c.beforeLabel || 'До'} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-red-100"><span className="text-4xl">🔴</span></div>}
              </div>
              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium">{c.beforeLabel || 'До'}</div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium">{c.afterLabel || 'После'}</div>
              {/* Divider line */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none" style={{ left: `${c.position ?? 50}%` }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-xs">⇔</div>
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-xs">← Перетащите →</div>
            </div>
          </div>
        </section>
      );
    }

    case 'rating': {
      const score = c.score ?? 4.8;
      const maxScore = c.maxScore ?? 5;
      const filled = Math.round(score);
      const total = c.totalReviews ?? 0;
      const breakdown: any[] = c.breakdown || [];
      const maxBreakdown = Math.max(...breakdown.map((b: any) => b.count || 0), 1);
      return wrap(
        <section className="py-16 px-8" style={{ backgroundColor: c.bgColor || undefined }}>
          <div className="max-w-3xl mx-auto">
            {c.title && <h2 className="text-3xl font-bold mb-10 text-center">{c.title}</h2>}
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="text-center shrink-0">
                <div className="text-7xl font-extrabold text-primary">{score}</div>
                {c.showStars && <div className="flex justify-center gap-1 my-2">
                  {Array.from({ length: maxScore }).map((_, i) => <span key={i} className="text-2xl">{i < filled ? '⭐' : '☆'}</span>)}
                </div>}
                {c.platform && <div className="text-sm text-muted-foreground">{c.platform}</div>}
                {total > 0 && <div className="text-xs text-muted-foreground mt-1">{total.toLocaleString()} отзывов</div>}
              </div>
              {breakdown.length > 0 && (
                <div className="flex-1 w-full space-y-2">
                  {[...breakdown].reverse().map((b: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-5 text-right">{b.stars}★</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(b.count / maxBreakdown) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{b.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case 'embed': {
      const getEmbedUrl = () => {
        if (!c.url) return '';
        const url = c.url;
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}${c.autoplay ? '?autoplay=1' : ''}`;
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        // Google Maps embed URL
        if (url.includes('google.com/maps/embed')) return url;
        // Direct iframe src
        return url;
      };
      const embedUrl = getEmbedUrl();
      return wrap(
        <section className="py-8 px-8">
          {c.title && <h2 className="text-2xl font-bold mb-6 text-center">{c.title}</h2>}
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border shadow-lg">
            {embedUrl ? (
              <iframe src={embedUrl} className="w-full border-0" style={{ height: c.height || '450px' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={c.title || 'embed'} />
            ) : (
              <div className="w-full flex items-center justify-center bg-muted text-muted-foreground" style={{ height: c.height || '450px' }}>
                <div className="text-center"><span className="text-4xl block mb-2">▶️</span><p className="text-sm">Вставьте URL YouTube, Vimeo или iframe</p></div>
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'table':
      return wrap(
        <section className="py-12 px-8">
          <div className="max-w-5xl mx-auto">
            {c.title && <h2 className="text-2xl font-bold mb-6">{c.title}</h2>}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    {(c.headers || []).map((h: string, i: number) => (
                      <th key={i} className="p-3 text-left text-sm font-semibold border-b border-primary/20">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(c.rows || []).map((row: string[], ri: number) => (
                    <tr key={ri} className={`${c.striped && ri % 2 === 1 ? 'bg-muted/30' : ''} hover:bg-muted/50 transition-colors`}>
                      {row.map((cell: string, ci: number) => (
                        <td key={ci} className={`p-3 text-sm ${c.bordered ? 'border-b border-border' : ''}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      );

    // ─── VOUS-inspired blocks ──────────────────────────────────────────────

    case 'parallax':
      return wrap(
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: c.minHeight || '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundImage: c.bgImage ? `url(${c.bgImage})` : 'none', backgroundAttachment: 'fixed', backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', inset: 0, zIndex: 0, backgroundColor: c.bgColor || '#1a1a2e' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${c.overlay ?? 0.5})`, zIndex: 1 }} />
          <div style={{ position: 'relative', zIndex: 2, textAlign: (c.align || 'center') as any, padding: '60px 32px', maxWidth: '900px', width: '100%' }}>
            {c.eyebrow && <p style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: gs?.primaryColor || '#f59e0b', marginBottom: '14px' }}>{c.eyebrow}</p>}
            {c.title && <h1 style={{ fontSize: c.titleSize || '3.5rem', fontWeight: 900, color: c.textColor || '#fff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '16px', textTransform: c.uppercase ? 'uppercase' : 'none' as any }}>{c.title}</h1>}
            {c.subtitle && <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', marginBottom: '32px', maxWidth: '600px', margin: c.align === 'center' ? '0 auto 32px' : '0 0 32px' }}>{c.subtitle}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: c.align === 'center' ? 'center' : 'flex-start', marginTop: '16px' }}>
              {c.ctaText && <a href={c.ctaHref || '#'} style={{ display: 'inline-block', padding: '14px 32px', borderRadius: '8px', fontWeight: 700, color: '#fff', textDecoration: 'none', backgroundColor: gs?.primaryColor || '#2563eb' }}>{c.ctaText}</a>}
              {c.cta2Text && <a href={c.cta2Href || '#'} style={{ display: 'inline-block', padding: '14px 32px', borderRadius: '8px', fontWeight: 700, color: '#fff', textDecoration: 'none', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>{c.cta2Text}</a>}
            </div>
          </div>
        </div>
      );

    case 'videoBg': {
      const ytId = (c.videoUrl || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?#]+)/)?.[1] || '';
      return wrap(
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: c.minHeight || '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ytId ? (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
              <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&disablekb=1`} allow="autoplay; encrypted-media" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '177.78vh', height: '100vh', minWidth: '100%', minHeight: '56.25vw', border: 'none', pointerEvents: 'none' }} title="bg-video" />
            </div>
          ) : c.bgImage ? (
            <div style={{ backgroundImage: `url(${c.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', inset: 0, zIndex: 0 }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: c.bgColor || '#0a0a0a' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${c.overlay ?? 0.55})`, zIndex: 1 }} />
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '80px 32px', maxWidth: '960px', width: '100%' }}>
            {c.eyebrow && <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: gs?.primaryColor || '#f59e0b', marginBottom: '14px' }}>{c.eyebrow}</p>}
            {c.title && <h1 style={{ fontSize: c.titleSize || '5rem', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '20px', textTransform: c.uppercase !== false ? 'uppercase' : 'none' as any }}>{c.title}</h1>}
            {c.subtitle && <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.75)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 40px' }}>{c.subtitle}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
              {c.ctaText && <a href={c.ctaHref || '#'} style={{ display: 'inline-block', padding: '16px 40px', borderRadius: '8px', fontWeight: 800, fontSize: '1rem', color: '#fff', textDecoration: 'none', backgroundColor: gs?.primaryColor || '#2563eb' }}>{c.ctaText}</a>}
              {c.cta2Text && <a href={c.cta2Href || '#'} style={{ display: 'inline-block', padding: '16px 40px', borderRadius: '8px', fontWeight: 800, fontSize: '1rem', color: '#fff', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)' }}>{c.cta2Text}</a>}
            </div>
          </div>
        </div>
      );
    }

    case 'eventCards':
      return wrap(
        <section style={{ padding: c.padding || '64px 32px', backgroundColor: c.bgColor || '#0f0f0f' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                {c.title && <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: c.textColor || '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{c.title}</h2>}
                {c.subtitle && <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '8px', fontSize: '1rem' }}>{c.subtitle}</p>}
              </div>
              {c.linkText && <a href={c.linkHref || '#'} style={{ fontSize: '0.9rem', fontWeight: 700, color: gs?.primaryColor || '#f59e0b', textDecoration: 'none' }}>{c.linkText} →</a>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${c.columns || 3}, 1fr)`, gap: '20px' }}>
              {(c.items || []).map((item: any, i: number) => (
                <a key={i} href={item.href || '#'} style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1a1a1a', textDecoration: 'none' }}>
                  {item.image && (
                    <div style={{ height: '200px', backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      {item.category && <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: gs?.primaryColor || '#f59e0b', color: '#000', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px' }}>{item.category}</span>}
                    </div>
                  )}
                  <div style={{ padding: '20px' }}>
                    {!item.image && item.category && <span style={{ display: 'inline-block', backgroundColor: gs?.primaryColor || '#f59e0b', color: '#000', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px', marginBottom: '10px' }}>{item.category}</span>}
                    {item.title && <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: c.textColor || '#fff', marginBottom: '6px', lineHeight: 1.3 }}>{item.title}</h3>}
                    {item.desc && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{item.desc}</p>}
                    {item.linkText && <p style={{ fontSize: '0.85rem', fontWeight: 700, color: gs?.primaryColor || '#f59e0b', marginTop: '12px' }}>{item.linkText} →</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      );

    case 'locations':
      return wrap(
        <section style={{ padding: c.padding || '64px 32px', backgroundColor: c.bgColor || '#111111' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {c.title && <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: c.textColor || '#fff', marginBottom: c.subtitle ? '8px' : '48px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{c.title}</h2>}
            {c.subtitle && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', marginBottom: '48px', fontSize: '1rem' }}>{c.subtitle}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              {(c.locations || []).map((loc: any, i: number) => (
                <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {loc.image && <div style={{ height: '160px', backgroundImage: `url(${loc.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                  <div style={{ padding: '22px' }}>
                    {loc.name && <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{loc.name}</h3>}
                    {loc.times && <p style={{ fontSize: '0.85rem', color: gs?.primaryColor || '#f59e0b', marginBottom: '6px', fontWeight: 600 }}>🕐 {loc.times}</p>}
                    {loc.address && <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', lineHeight: 1.4 }}>📍 {loc.address}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {loc.href && <a href={loc.href} style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', backgroundColor: gs?.primaryColor || '#2563eb', padding: '7px 14px', borderRadius: '6px', textDecoration: 'none' }}>Подробнее</a>}
                      {loc.mapHref && <a href={loc.mapHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', backgroundColor: 'rgba(255,255,255,0.08)', padding: '7px 14px', borderRadius: '6px', textDecoration: 'none' }}>Карта</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'values':
      return wrap(
        <section style={{ padding: `${c.paddingV || '64px'} 0`, backgroundColor: c.bgColor || '#0a0a0a', overflow: 'hidden' }}>
          <div style={{ padding: '0 32px', marginBottom: '32px' }}>
            {c.title && <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: c.textColor || '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{c.title}</h2>}
            {c.subtitle && <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '8px' }}>{c.subtitle}</p>}
            {c.showDragHint !== false && <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginTop: '14px', textTransform: 'uppercase' }}>⟵ DRAG ⟶</p>}
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 32px', gap: '2px' }}>
            {(c.items || []).map((item: any, i: number) => (
              <div key={i} style={{ flex: '0 0 290px', padding: '32px 24px', borderLeft: '1px solid rgba(255,255,255,0.08)', backgroundColor: i % 2 === 0 ? (c.bgColor || '#0a0a0a') : 'rgba(255,255,255,0.03)', minWidth: '260px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: gs?.primaryColor || '#f59e0b', letterSpacing: '0.2em', marginBottom: '18px' }}>{String(i + 1).padStart(2, '0')}</p>
                {item.title && (
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.25, marginBottom: '14px', color: '#fff' }}>
                    {c.divider && item.title.includes(c.divider)
                      ? item.title.split(c.divider).map((part: string, pi: number) => (
                          <span key={pi}>{pi > 0 && <span style={{ color: gs?.primaryColor || '#f59e0b', margin: '0 5px' }}>{c.divider}</span>}{part}</span>
                        ))
                      : item.title}
                  </h3>
                )}
                {item.desc && <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{item.desc}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case 'splitHero':
      return wrap(
        <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: c.minHeight || '70vh', backgroundColor: c.bgColor || '#000' }}>
          <div style={{ flex: `1 1 ${c.imageFlex || '50%'}`, backgroundImage: c.image ? `url(${c.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '350px', position: 'relative', backgroundColor: c.image ? undefined : '#1a1a1a' }}>
            {(c.imageOverlay || !c.image) && <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${c.imageOverlay || (c.image ? 0.25 : 0.8)})` }} />}
          </div>
          <div style={{ flex: `1 1 ${c.contentFlex || '50%'}`, padding: c.contentPadding || '72px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: c.contentBg || '#0f0f0f', color: c.textColor || '#fff' }}>
            {c.eyebrow && <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: gs?.primaryColor || '#f59e0b', marginBottom: '16px' }}>{c.eyebrow}</p>}
            {c.title && <h2 style={{ fontSize: c.titleSize || '2.8rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '16px', textTransform: c.uppercase ? 'uppercase' : 'none' as any }}>{c.title}</h2>}
            {c.body && <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '500px' }}>{c.body}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {c.ctaText && <a href={c.ctaHref || '#'} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: '8px', fontWeight: 700, backgroundColor: gs?.primaryColor || '#2563eb', color: '#fff', textDecoration: 'none' }}>{c.ctaText}</a>}
              {c.cta2Text && <a href={c.cta2Href || '#'} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: '8px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none' }}>{c.cta2Text}</a>}
            </div>
          </div>
        </div>
      );

    case 'bigQuote':
      return wrap(
        <section style={{ padding: c.padding || '80px 32px', backgroundColor: c.bgColor || '#f8f8f8', textAlign: (c.align || 'center') as any }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {c.eyebrow && <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: gs?.primaryColor || '#2563eb', marginBottom: '24px' }}>{c.eyebrow}</p>}
            {c.openQuote !== false && <div style={{ fontSize: '5rem', lineHeight: 0.8, color: gs?.primaryColor || '#2563eb', opacity: 0.25, marginBottom: '16px', fontFamily: 'Georgia, serif', userSelect: 'none' }}>❝</div>}
            {c.text && <blockquote style={{ fontSize: c.fontSize || '2rem', fontWeight: c.fontWeight || 700, lineHeight: 1.35, color: c.textColor || '#1a1a1a', fontStyle: c.italic !== false ? 'italic' : 'normal', letterSpacing: c.tight ? '-0.03em' : 'normal' }}>{c.text}</blockquote>}
            {c.author && <p style={{ marginTop: '28px', fontSize: '1rem', fontWeight: 600, color: c.textColor ? `${c.textColor}99` : '#555' }}>— {c.author}</p>}
            {c.role && <p style={{ fontSize: '0.85rem', color: c.textColor ? `${c.textColor}66` : '#888' }}>{c.role}</p>}
            {c.ctaText && <a href={c.ctaHref || '#'} style={{ display: 'inline-block', marginTop: '32px', padding: '13px 28px', borderRadius: '8px', fontWeight: 700, backgroundColor: gs?.primaryColor || '#2563eb', color: '#fff', textDecoration: 'none' }}>{c.ctaText}</a>}
          </div>
        </section>
      );

    case 'announcement':
      return wrap(
        <div style={{ backgroundColor: c.bgColor || '#1a1a1a', color: c.textColor || '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ textAlign: 'center' }}>
            {c.emoji && <span style={{ marginRight: '6px' }}>{c.emoji}</span>}
            {c.text && <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.text}</span>}
            {c.subtext && <span style={{ fontSize: '0.8rem', opacity: 0.75, marginLeft: '8px' }}>{c.subtext}</span>}
          </div>
          {c.ctaText && <a href={c.ctaHref || '#'} style={{ fontSize: '0.8rem', fontWeight: 800, padding: '6px 16px', borderRadius: '6px', backgroundColor: gs?.primaryColor || '#f59e0b', color: '#000', textDecoration: 'none', whiteSpace: 'nowrap' }}>{c.ctaText}</a>}
          {c.closable !== false && <span style={{ fontSize: '1rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '0 4px', lineHeight: 1 }}>✕</span>}
        </div>
      );

    default: {
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
}

export function WebsitePreview({ blocks, pages, currentPageSlug, onPageNavigate, onBlockClick, onEditBlock, onBlockStyleUpdate, onBlockContentUpdate, onBlockPositionUpdate, onDeleteBlock, selectedBlockId, globalStyles: gs }: WebsitePreviewProps) {
  // Determine which blocks to display: always use the blocks prop (already filtered by parent)
  const [activeSlug, setActiveSlug] = useState(currentPageSlug || 'home');
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);

  const hasPages = !!(pages && pages.length > 0);
  const displayBlocks = blocks;

  // Sync with external currentPageSlug prop
  useEffect(() => {
    if (currentPageSlug) setActiveSlug(currentPageSlug);
  }, [currentPageSlug]);

  // Inject scroll-animation CSS and set up IntersectionObserver
  useEffect(() => {
    const styleId = 'wbuilder-scroll-animations';
    let s = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!s) { s = document.createElement('style'); s.id = styleId; document.head.appendChild(s); }
      s.textContent = `[data-animate]{transition:opacity var(--anim-dur,.65s) ease,transform var(--anim-dur,.65s) ease;}[data-animate-duration="300"]{--anim-dur:.3s;}[data-animate-duration="500"]{--anim-dur:.5s;}[data-animate-duration="800"]{--anim-dur:.8s;}[data-animate-duration="1000"]{--anim-dur:1s;}[data-animate-duration="1500"]{--anim-dur:1.5s;}[data-animate="fadeUp"]{opacity:0;transform:translateY(40px);}[data-animate="fadeIn"]{opacity:0;}[data-animate="fadeLeft"]{opacity:0;transform:translateX(-50px);}[data-animate="fadeRight"]{opacity:0;transform:translateX(50px);}[data-animate="zoomIn"]{opacity:0;transform:scale(0.8);}[data-animate="flipIn"]{opacity:0;transform:perspective(600px) rotateX(80deg);}[data-animate].anim-visible{opacity:1!important;transform:none!important;}[data-animate].anim-exit{transition-delay:0s!important;}[data-animate-out="fadeUp"].anim-exit{opacity:0!important;transform:translateY(-40px)!important;}[data-animate-out="fadeIn"].anim-exit{opacity:0!important;}[data-animate-out="fadeLeft"].anim-exit{opacity:0!important;transform:translateX(-50px)!important;}[data-animate-out="fadeRight"].anim-exit{opacity:0!important;transform:translateX(50px)!important;}[data-animate-out="zoomIn"].anim-exit{opacity:0!important;transform:scale(0.8)!important;}[data-animate-out="flipIn"].anim-exit{opacity:0!important;transform:perspective(600px) rotateX(80deg)!important;}[data-animate-delay="100"]{transition-delay:.1s;}[data-animate-delay="200"]{transition-delay:.2s;}[data-animate-delay="300"]{transition-delay:.3s;}[data-animate-delay="400"]{transition-delay:.4s;}[data-animate-delay="500"]{transition-delay:.5s;}`;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const hasOut = e.target.hasAttribute('data-animate-out');
        if (e.isIntersecting) {
          e.target.classList.remove('anim-exit');
          e.target.classList.add('anim-visible');
          if (!hasOut) obs.unobserve(e.target);
        } else if (hasOut && e.target.classList.contains('anim-visible')) {
          e.target.classList.remove('anim-visible');
          e.target.classList.add('anim-exit');
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [displayBlocks]);

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
      {flowBlocks.map(block => renderBlock(block, onBlockClick, selectedBlockId, handleNavigate, gs, pages, onBlockStyleUpdate, onBlockPositionUpdate, onEditBlock, onDeleteBlock, onBlockContentUpdate, inlineEditId, setInlineEditId))}
      {positionedBlocks.map(block => renderBlock(block, onBlockClick, selectedBlockId, handleNavigate, gs, pages, onBlockStyleUpdate, onBlockPositionUpdate, onEditBlock, onDeleteBlock, onBlockContentUpdate, inlineEditId, setInlineEditId))}
    </div>
  );
}
