import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ImageStyle = 'professional' | 'abstract' | 'conceptual' | 'editorial';

interface StyleSelectorProps {
  selectedStyle: ImageStyle;
  onStyleChange: (value: ImageStyle) => void;
}

export function StyleSelector({ selectedStyle, onStyleChange }: StyleSelectorProps) {
  return (
    <Select value={selectedStyle} onValueChange={(v) => onStyleChange(v as ImageStyle)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Style" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="professional">Professional</SelectItem>
        <SelectItem value="abstract">Abstract</SelectItem>
        <SelectItem value="conceptual">Conceptual</SelectItem>
        <SelectItem value="editorial">Editorial</SelectItem>
      </SelectContent>
    </Select>
  );
}
