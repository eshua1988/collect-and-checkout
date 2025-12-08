export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'image'
  | 'dynamicNumber'
  | 'payment';

export interface FieldOption {
  id: string;
  label: string;
  value: number; // For payment calculation
}

export interface PaymentField {
  id: string;
  type: 'number' | 'select' | 'radio' | 'dynamicNumber';
  label: string;
  options?: FieldOption[];
  multiplier?: number;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  imageUrl?: string;
  // For dynamicNumber field
  dynamicFieldsCount?: number;
  // For payment field
  paymentFields?: PaymentField[];
  baseAmount?: number;
}

export interface FormData {
  id: string;
  title: string;
  description?: string;
  headerImage?: string;
  fields: FormField[];
  completionMessage: string;
  paymentEnabled: boolean;
  totalAmount: number;
  paymentAccount?: string; // Account number for payment
  createdAt: number;
  updatedAt: number;
  published: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  responses: FormResponse;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  submittedAt: number;
}

export interface FormResponse {
  [fieldId: string]: string | string[] | number | File;
}

export type PaymentMethod = 'blik' | 'card' | 'bank';

export interface BankOption {
  id: string;
  name: string;
  logo: string;
}

export const POLISH_BANKS: BankOption[] = [
  { id: 'mbank', name: 'mBank', logo: '🏦' },
  { id: 'pkobp', name: 'PKO BP', logo: '🏦' },
  { id: 'santander', name: 'Santander', logo: '🏦' },
  { id: 'ing', name: 'ING', logo: '🏦' },
  { id: 'pekao', name: 'Bank Pekao', logo: '🏦' },
  { id: 'alior', name: 'Alior Bank', logo: '🏦' },
  { id: 'millennium', name: 'Millennium', logo: '🏦' },
  { id: 'bnpparibas', name: 'BNP Paribas', logo: '🏦' },
];