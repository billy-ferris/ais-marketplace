import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string | null;
  onChange: (file: File) => void;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  accept = 'image/*',
  maxSizeMB = 5,
  disabled = false,
  isUploading = false,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    onChange(file);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so re-selecting the same file triggers onChange
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setDragOver(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  // Show current image preview
  if (value && !isUploading) {
    return (
      <div className={cn('relative inline-block', className)}>
        <img
          src={value}
          alt="Upload preview"
          className="h-32 w-32 rounded-md border object-cover"
        />
        {onRemove && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            className="absolute -top-2 -right-2"
            onClick={onRemove}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        className={cn(
          'flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          (disabled || isUploading) && 'cursor-not-allowed opacity-50',
        )}
        onClick={() => {
          if (!disabled && !isUploading) {
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && !isUploading) {
              inputRef.current?.click();
            }
          }
        }}
      >
        {isUploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <span className="mt-1 text-xs text-muted-foreground">
              Click or drag
            </span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
