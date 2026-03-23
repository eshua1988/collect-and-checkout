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

export interface AppWebsite {
  id: string;
  name: string;
  description?: string;
  favicon?: string;
  published: boolean;
  blocks: WebsiteBlock[];
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
