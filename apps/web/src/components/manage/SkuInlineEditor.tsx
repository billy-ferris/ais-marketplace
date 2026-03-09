import { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/hooks/useUpload';

export interface SkuFormData {
  /** Present only for existing SKUs (edit mode) */
  id?: number;
  name: string;
  upc: string;
  size: string;
  casePack: string;
  price: string;
  msrp: string;
  quantity: string;
  imageUrl: string | null;
  /** Marks an existing SKU for deletion */
  _deleted?: boolean;
}

export interface SkuChangeOutput {
  create: Array<{
    name: string;
    upc?: string;
    size?: string;
    casePack?: number;
    price: string;
    msrp?: string;
    quantity: number;
    imageUrl?: string;
  }>;
  update: Array<{
    id: number;
    data: Record<string, unknown>;
  }>;
  delete: number[];
}

interface SkuInlineEditorProps {
  skus: SkuFormData[];
  onChange: (skus: SkuFormData[]) => void;
  disabled?: boolean;
}

const EMPTY_SKU: SkuFormData = {
  name: '',
  upc: '',
  size: '',
  casePack: '',
  price: '',
  msrp: '',
  quantity: '0',
  imageUrl: null,
};

export function SkuInlineEditor({
  skus,
  onChange,
  disabled = false,
}: SkuInlineEditorProps) {
  const { uploadFile, isUploading } = useUpload();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const handleAdd = useCallback(() => {
    onChange([...skus, { ...EMPTY_SKU }]);
  }, [skus, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const sku = skus[index];
      if (sku.id) {
        // Existing SKU: mark for deletion instead of removing from array
        const updated = [...skus];
        updated[index] = { ...sku, _deleted: true };
        onChange(updated);
      } else {
        // New SKU: remove from array
        onChange(skus.filter((_, i) => i !== index));
      }
    },
    [skus, onChange],
  );

  const handleRestore = useCallback(
    (index: number) => {
      const updated = [...skus];
      updated[index] = { ...updated[index], _deleted: false };
      onChange(updated);
    },
    [skus, onChange],
  );

  const handleFieldChange = useCallback(
    (index: number, field: keyof SkuFormData, value: string | null) => {
      const updated = [...skus];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    },
    [skus, onChange],
  );

  const handleImageUpload = useCallback(
    async (index: number, file: File) => {
      setUploadingIndex(index);
      try {
        const url = await uploadFile(file);
        handleFieldChange(index, 'imageUrl', url);
      } catch {
        // Upload error handled by useUpload
      } finally {
        setUploadingIndex(null);
      }
    },
    [uploadFile, handleFieldChange],
  );

  const visibleSkus = skus.filter((s) => !s._deleted);
  const deletedSkus = skus.filter((s) => s._deleted);

  return (
    <div className="space-y-4">
      {visibleSkus.length === 0 && deletedSkus.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No SKUs added yet. Click "Add SKU" to get started.
        </p>
      )}

      {skus.map((sku, index) => {
        if (sku._deleted) {
          return (
            <div
              key={sku.id ?? `new-${index}`}
              className="flex items-center justify-between rounded-md border border-dashed border-destructive/50 bg-destructive/5 p-3"
            >
              <span className="text-sm text-muted-foreground line-through">
                {sku.name || 'Unnamed SKU'} (will be deleted)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRestore(index)}
                disabled={disabled}
              >
                Undo
              </Button>
            </div>
          );
        }

        return (
          <div
            key={sku.id ?? `new-${index}`}
            className="space-y-3 rounded-md border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                SKU {visibleSkus.indexOf(sku) + 1}
                {sku.id ? ` (ID: ${sku.id})` : ' (New)'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  placeholder="SKU name"
                  value={sku.name}
                  onChange={(e) =>
                    handleFieldChange(index, 'name', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">UPC</Label>
                <Input
                  placeholder="UPC code"
                  value={sku.upc}
                  onChange={(e) =>
                    handleFieldChange(index, 'upc', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Input
                  placeholder="e.g., 8 oz"
                  value={sku.size}
                  onChange={(e) =>
                    handleFieldChange(index, 'size', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Case Pack</Label>
                <Input
                  type="number"
                  placeholder="Units per case"
                  value={sku.casePack}
                  onChange={(e) =>
                    handleFieldChange(index, 'casePack', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price *</Label>
                <Input
                  placeholder="12.99"
                  value={sku.price}
                  onChange={(e) =>
                    handleFieldChange(index, 'price', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">MSRP</Label>
                <Input
                  placeholder="24.99"
                  value={sku.msrp}
                  onChange={(e) =>
                    handleFieldChange(index, 'msrp', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={sku.quantity}
                  onChange={(e) =>
                    handleFieldChange(index, 'quantity', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Image</Label>
                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current.set(index, el);
                    else fileInputRefs.current.delete(index);
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(index, file);
                    e.target.value = '';
                  }}
                  disabled={disabled || isUploading}
                />
                {sku.imageUrl ? (
                  <div className="flex h-8 items-center gap-1.5 rounded-md border bg-transparent px-2 text-sm">
                    <span className="flex-1 truncate text-muted-foreground">
                      {sku.imageUrl.split('/').pop()?.split('?')[0] ?? 'image'}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleFieldChange(index, 'imageUrl', null)}
                      disabled={disabled}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex h-8 w-full items-center gap-1.5 rounded-md border border-dashed px-2 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => fileInputRefs.current.get(index)?.click()}
                    disabled={disabled || (isUploading && uploadingIndex === index)}
                  >
                    {isUploading && uploadingIndex === index ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    <span>{isUploading && uploadingIndex === index ? 'Uploading...' : 'Choose file'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        disabled={disabled}
      >
        <Plus className="size-4" />
        Add SKU
      </Button>
    </div>
  );
}

/**
 * Convert the SkuFormData array into the structured API payload.
 * - New SKUs (no id, not deleted) go into `create`
 * - Existing SKUs (has id, not deleted) go into `update`
 * - Deleted existing SKUs (has id, _deleted) go into `delete`
 */
export function buildSkuPayload(skus: SkuFormData[]): SkuChangeOutput {
  const create: SkuChangeOutput['create'] = [];
  const update: SkuChangeOutput['update'] = [];
  const deleteIds: number[] = [];

  for (const sku of skus) {
    if (sku._deleted && sku.id) {
      deleteIds.push(sku.id);
      continue;
    }

    if (sku._deleted) continue;

    const data: Record<string, unknown> = {
      name: sku.name,
      price: sku.price,
      quantity: Number(sku.quantity) || 0,
    };
    if (sku.upc) data.upc = sku.upc;
    if (sku.size) data.size = sku.size;
    if (sku.casePack) data.casePack = Number(sku.casePack);
    if (sku.msrp) data.msrp = sku.msrp;
    if (sku.imageUrl) data.imageUrl = sku.imageUrl;

    if (sku.id) {
      update.push({ id: sku.id, data });
    } else {
      create.push(data as SkuChangeOutput['create'][number]);
    }
  }

  return { create, update, delete: deleteIds };
}
