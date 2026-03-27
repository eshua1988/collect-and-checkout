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
  | 'footer';

export interface WebsiteBlock {
  id: string;
  type: WebsiteBlockType;
  content: Record<string, any>;
  styles?: Record<string, string>;
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
    fontFamily?: string;
    backgroundColor?: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  externalUrl?: string; // for editing external sites
  createdAt: number;
  updatedAt: number;
}
