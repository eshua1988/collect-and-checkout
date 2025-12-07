import { FieldType } from '@/types/form';
import { Button } from '@/components/ui/button';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  List,
  Circle,
  CheckSquare,
  Image,
  PlusCircle,
  CreditCard,
} from 'lucide-react';

interface FieldTypeSelectorProps {
  onAddField: (type: FieldType) => void;
}

const fieldTypes: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Tekst', icon: <Type className="w-4 h-4" /> },
  { type: 'textarea', label: 'Długi tekst', icon: <AlignLeft className="w-4 h-4" /> },
  { type: 'number', label: 'Liczba', icon: <Hash className="w-4 h-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { type: 'phone', label: 'Telefon', icon: <Phone className="w-4 h-4" /> },
  { type: 'select', label: 'Lista', icon: <List className="w-4 h-4" /> },
  { type: 'radio', label: 'Jednokrotny', icon: <Circle className="w-4 h-4" /> },
  { type: 'checkbox', label: 'Wielokrotny', icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'image', label: 'Obrazek', icon: <Image className="w-4 h-4" /> },
  { type: 'dynamicNumber', label: 'Dynamiczne', icon: <PlusCircle className="w-4 h-4" /> },
  { type: 'payment', label: 'Płatność', icon: <CreditCard className="w-4 h-4" /> },
];

export function FieldTypeSelector({ onAddField }: FieldTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {fieldTypes.map(({ type, label, icon }) => (
        <Button
          key={type}
          variant="outline"
          className="flex items-center gap-2 h-auto py-3 px-4 justify-start hover:bg-primary/5 hover:border-primary/30"
          onClick={() => onAddField(type)}
        >
          <span className="text-primary">{icon}</span>
          <span className="text-sm">{label}</span>
        </Button>
      ))}
    </div>
  );
}
