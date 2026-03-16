export type DocBlockType =
  | 'heading1' | 'heading2' | 'heading3'
  | 'paragraph' | 'table' | 'image' | 'video'
  | 'signature' | 'divider' | 'list' | 'checkbox-list'
  | 'field' | 'page-break';

export interface DocTableCell {
  id: string;
  content: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  bg?: string;
}

export interface DocTableRow {
  id: string;
  cells: DocTableCell[];
}

export interface DocListItem {
  id: string;
  text: string;
  checked?: boolean;
}

export interface DocFieldOptions {
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea';
  options?: string[];
}

export interface DocBlock {
  id: string;
  type: DocBlockType;
  content?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: number;
  // Table
  rows?: DocTableRow[];
  cols?: number;
  // Image / Video
  src?: string;
  alt?: string;
  width?: number;
  // Signature
  signatureData?: string;
  // List
  items?: DocListItem[];
  // Fillable field
  fieldOptions?: DocFieldOptions;
  fieldLabel?: string;
}

export interface DocData {
  id: string;
  title: string;
  description?: string;
  blocks: DocBlock[];
  pageSize?: 'A4' | 'Letter' | 'A5';
  orientation?: 'portrait' | 'landscape';
  published: boolean;
  allowFill?: boolean; // fillable form mode
  createdAt: number;
  updatedAt: number;
  headerLogo?: string;
  watermark?: string;
}

export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  doc: Omit<DocData, 'id' | 'createdAt' | 'updatedAt' | 'published'>;
}
