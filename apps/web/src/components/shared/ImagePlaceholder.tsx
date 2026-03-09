import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  className?: string;
  iconSize?: number;
}

export function ImagePlaceholder({
  className,
  iconSize = 24,
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md bg-muted',
        className,
      )}
    >
      <ImageIcon
        className="text-muted-foreground"
        size={iconSize}
      />
    </div>
  );
}
