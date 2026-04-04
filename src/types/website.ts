export type WebsiteBlockType =
  | 'hero'
  | 'navbar'
  | 'text'
  | 'image'
  | 'gallery'
  | 'columns'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'contact'
  | 'form'
  | 'video'
  | 'divider'
  | 'spacer'
  | 'html'
  | 'button'
  | 'map'
  | 'countdown'
  | 'faq'
  | 'team'
  | 'footer'
  | 'stats'
  | 'logos'
  | 'cta'
  | 'timeline'
  | 'social'
  | 'newsletter'
  | 'banner'
  | 'tabs'
  | 'accordion'
  | 'progress'
  | 'comparison'
  | 'marquee'
  | 'quote'
  | 'cards'
  | 'carousel'
  | 'product'
  | 'linkList'
  | 'searchBar'
  | 'imageText'
  | (string & {});

export interface WebsiteBlockExtra {
  type: 'button' | 'search' | 'icon' | 'text' | 'link' | 'badge' | 'divider' | 'social';
  content: Record<string, any>;
  styles?: Record<string, string>;
}

export interface WebsiteBlock {
  id: string;
  type: WebsiteBlockType;
  content: Record<string, any>;
  styles?: Record<string, string>;
  extras?: WebsiteBlockExtra[];
  position?: { x: number; y: number };
}

export interface WebsitePage {
  id: string;
  slug: string;     // "home", "about", "services"
  title: string;    // "Главная", "О нас"
  blocks: WebsiteBlock[];
}

export interface AppWebsite {
  id: string;
  name: string;
  description?: string;
  favicon?: string;
  published: boolean;
  blocks: WebsiteBlock[];        // backward compat (single-page)
  pages?: WebsitePage[];         // multi-page support
  globalStyles?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    headingFont?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    maxWidth?: string;
    minHeight?: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  externalUrl?: string; // for editing external sites
  createdAt: number;
  updatedAt: number;
}
