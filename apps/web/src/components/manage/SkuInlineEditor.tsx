import { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { createSkuSchema } from '@ais/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/hooks/useUpload';

export interface SkuFormData {
  /** Present only for existing SKUs (edit mode) */
  id?: number;
  name: string;
  sku: string;
  upc: string;
  size: string;
  casePack: string;
  casesPerPallet: string;
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
    sku?: string;
    upc?: string;
    size?: string;
    casePack?: number;
    casesPerPallet?: number;
    price: string;
    msrp: string;
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
  sku: '',
  upc: '',
  size: '',
  casePack: '',
  casesPerPallet: '',
  price: '',
  msrp: '',
  quantity: '0',
  imageUrl: null,
};

/** Fields that carry required-field validation + red border + tooltip. */
type RequiredSkuField = 'name' | 'price' | 'msrp' | 'quantity';
const REQUIRED_SKU_FIELDS: RequiredSkuField[] = [
  'name',
  'price',
  'msrp',
  'quantity',
];

/**
 * Build a candidate object matching createSkuSchema's expected input types from a
 * row's string values. Optional numeric/string fields collapse empty strings to
 * `undefined` so the schema's `.optional()` rules apply.
 */
function buildSkuCandidate(row: SkuFormData): Record<string, unknown> {
  return {
    name: row.name,
    sku: row.sku || undefined,
    upc: row.upc || undefined,
    size: row.size || undefined,
    casePack: row.casePack ? Number(row.casePack) : undefined,
    casesPerPallet: row.casesPerPallet ? Number(row.casesPerPallet) : undefined,
    price: row.price,
    msrp: row.msrp,
    quantity: Number(row.quantity) || 0,
    imageUrl: row.imageUrl || undefined,
  };
}

export function SkuInlineEditor({
  skus,
  onChange,
  disabled = false,
}: SkuInlineEditorProps) {
  const { uploadFile, isUploading } = useUpload();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Per-cell validation errors keyed by `${index}:${field}`. '' = valid.
  const [skuErrors, setSkuErrors] = useState<Record<string, string>>({});

  /**
   * Validate a single required cell against the shared schema and record the
   * first issue whose path targets this field (or clear it when valid).
   */
  const validateSkuField = useCallback(
    (index: number, field: RequiredSkuField, row: SkuFormData) => {
      const result = createSkuSchema.safeParse(buildSkuCandidate(row));
      let message = '';
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === field);
        if (issue) message = issue.message;
      }
      setSkuErrors((prev) => ({ ...prev, [`${index}:${field}`]: message }));
    },
    [],
  );

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

  /**
   * Submit-time catch-all: validate every non-deleted row against the shared
   * schema, writing errors for the four required fields, and return true only
   * when every non-deleted row fully passes.
   */
  const validateAllRows = useCallback((): boolean => {
    let allValid = true;
    const updates: Record<string, string> = {};
    skus.forEach((row, index) => {
      if (row._deleted) return;
      const result = createSkuSchema.safeParse(buildSkuCandidate(row));
      if (!result.success) allValid = false;
      for (const field of REQUIRED_SKU_FIELDS) {
        const issue = result.success
          ? undefined
          : result.error.issues.find((i) => i.path[0] === field);
        updates[`${index}:${field}`] = issue ? issue.message : '';
      }
    });
    setSkuErrors((prev) => ({ ...prev, ...updates }));
    return allValid;
  }, [skus]);

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
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFieldChange(index, 'name', value);
                    if (skuErrors[`${index}:name`]) {
                      validateSkuField(index, 'name', { ...sku, name: value });
                    }
                  }}
                  onBlur={() => validateSkuField(index, 'name', sku)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SKU</Label>
                <Input
                  placeholder="SKU code"
                  value={sku.sku}
                  onChange={(e) =>
                    handleFieldChange(index, 'sku', e.target.value)
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
                <Label className="text-xs">Cases Per Pallet</Label>
                <Input
                  type="number"
                  placeholder="Cases per pallet"
                  value={sku.casesPerPallet}
                  onChange={(e) =>
                    handleFieldChange(index, 'casesPerPallet', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Price *</Label>
                <Input
                  placeholder="12.99"
                  value={sku.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFieldChange(index, 'price', value);
                    if (skuErrors[`${index}:price`]) {
                      validateSkuField(index, 'price', { ...sku, price: value });
                    }
                  }}
                  onBlur={() => validateSkuField(index, 'price', sku)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">MSRP *</Label>
                <Input
                  placeholder="24.99"
                  value={sku.msrp}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFieldChange(index, 'msrp', value);
                    if (skuErrors[`${index}:msrp`]) {
                      validateSkuField(index, 'msrp', { ...sku, msrp: value });
                    }
                  }}
                  onBlur={() => validateSkuField(index, 'msrp', sku)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={sku.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFieldChange(index, 'quantity', value);
                    if (skuErrors[`${index}:quantity`]) {
                      validateSkuField(index, 'quantity', {
                        ...sku,
                        quantity: value,
                      });
                    }
                  }}
                  onBlur={() => validateSkuField(index, 'quantity', sku)}
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
      msrp: sku.msrp,
      quantity: Number(sku.quantity) || 0,
    };
    if (sku.sku) data.sku = sku.sku;
    if (sku.upc) data.upc = sku.upc;
    if (sku.size) data.size = sku.size;
    if (sku.casePack) data.casePack = Number(sku.casePack);
    if (sku.casesPerPallet) data.casesPerPallet = Number(sku.casesPerPallet);
    if (sku.imageUrl) data.imageUrl = sku.imageUrl;

    if (sku.id) {
      update.push({ id: sku.id, data });
    } else {
      create.push(data as SkuChangeOutput['create'][number]);
    }
  }

  return { create, update, delete: deleteIds };
}
