import {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  type ReactElement,
} from 'react';
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { createSkuSchema } from '@ais/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
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

/** Imperative handle exposed to parents to run submit-time SKU validation. */
export interface SkuInlineEditorHandle {
  /** Validate all non-deleted rows; returns true only when every row passes. */
  validateAll: () => boolean;
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

/**
 * Every schema-validated cell that can carry a red border + tooltip. This
 * covers ALL fields the shared schema can reject (not just the required four)
 * so the submit-time catch-all can surface a visible error for any field that
 * blocks the save.
 */
type SkuValidatedField =
  | 'name'
  | 'sku'
  | 'upc'
  | 'size'
  | 'casePack'
  | 'casesPerPallet'
  | 'price'
  | 'msrp'
  | 'quantity';
const SKU_VALIDATED_FIELDS: SkuValidatedField[] = [
  'name',
  'sku',
  'upc',
  'size',
  'casePack',
  'casesPerPallet',
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

export const SkuInlineEditor = forwardRef<
  SkuInlineEditorHandle,
  SkuInlineEditorProps
>(function SkuInlineEditor({ skus, onChange, disabled = false }, ref) {
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
    (index: number, field: SkuValidatedField, row: SkuFormData) => {
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
   * schema, writing an error message for EVERY field that fails (not just the
   * four required ones), and return true only when every non-deleted row fully
   * passes. Because each failing field gets a message keyed by
   * `${index}:${field}`, the corresponding cell renders a red border + tooltip,
   * so the user always sees why the save was blocked.
   */
  const validateAllRows = useCallback((): boolean => {
    let allValid = true;
    const updates: Record<string, string> = {};
    skus.forEach((row, index) => {
      if (row._deleted) return;
      // Clear prior errors for every validated cell in this row first.
      for (const field of SKU_VALIDATED_FIELDS) {
        updates[`${index}:${field}`] = '';
      }
      const result = createSkuSchema.safeParse(buildSkuCandidate(row));
      if (!result.success) {
        allValid = false;
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          // First issue per field wins; only overwrite if not already set.
          if (typeof field === 'string' && !updates[`${index}:${field}`]) {
            updates[`${index}:${field}`] = issue.message;
          }
        }
      }
    });
    setSkuErrors((prev) => ({ ...prev, ...updates }));
    return allValid;
  }, [skus]);

  useImperativeHandle(ref, () => ({ validateAll: validateAllRows }), [
    validateAllRows,
  ]);

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

  /**
   * Wrap a required-cell Input in a Base UI Tooltip carrying the cell's
   * validation message when one exists; otherwise render the Input as-is.
   */
  const renderRequiredCell = (errorKey: string, input: ReactElement) => {
    const message = skuErrors[errorKey];
    if (!message) return input;
    return (
      <Tooltip>
        <TooltipTrigger render={input} />
        <TooltipContent>{message}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
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
                {renderRequiredCell(
                  `${index}:name`,
                  <Input
                    placeholder="SKU name"
                    value={sku.name}
                    aria-invalid={!!skuErrors[`${index}:name`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'name', value);
                      if (skuErrors[`${index}:name`]) {
                        validateSkuField(index, 'name', { ...sku, name: value });
                      }
                    }}
                    onBlur={() => validateSkuField(index, 'name', sku)}
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SKU</Label>
                {renderRequiredCell(
                  `${index}:sku`,
                  <Input
                    placeholder="SKU code"
                    value={sku.sku}
                    aria-invalid={!!skuErrors[`${index}:sku`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'sku', value);
                      if (skuErrors[`${index}:sku`]) {
                        validateSkuField(index, 'sku', { ...sku, sku: value });
                      }
                    }}
                    onBlur={() => validateSkuField(index, 'sku', sku)}
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">UPC</Label>
                {renderRequiredCell(
                  `${index}:upc`,
                  <Input
                    placeholder="UPC code"
                    value={sku.upc}
                    aria-invalid={!!skuErrors[`${index}:upc`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'upc', value);
                      if (skuErrors[`${index}:upc`]) {
                        validateSkuField(index, 'upc', { ...sku, upc: value });
                      }
                    }}
                    onBlur={() => validateSkuField(index, 'upc', sku)}
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                {renderRequiredCell(
                  `${index}:size`,
                  <Input
                    placeholder="e.g., 8 oz"
                    value={sku.size}
                    aria-invalid={!!skuErrors[`${index}:size`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'size', value);
                      if (skuErrors[`${index}:size`]) {
                        validateSkuField(index, 'size', { ...sku, size: value });
                      }
                    }}
                    onBlur={() => validateSkuField(index, 'size', sku)}
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Case Pack</Label>
                {renderRequiredCell(
                  `${index}:casePack`,
                  <Input
                    type="number"
                    placeholder="Units per case"
                    value={sku.casePack}
                    aria-invalid={!!skuErrors[`${index}:casePack`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'casePack', value);
                      if (skuErrors[`${index}:casePack`]) {
                        validateSkuField(index, 'casePack', {
                          ...sku,
                          casePack: value,
                        });
                      }
                    }}
                    onBlur={() => validateSkuField(index, 'casePack', sku)}
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cases Per Pallet</Label>
                {renderRequiredCell(
                  `${index}:casesPerPallet`,
                  <Input
                    type="number"
                    placeholder="Cases per pallet"
                    value={sku.casesPerPallet}
                    aria-invalid={!!skuErrors[`${index}:casesPerPallet`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'casesPerPallet', value);
                      if (skuErrors[`${index}:casesPerPallet`]) {
                        validateSkuField(index, 'casesPerPallet', {
                          ...sku,
                          casesPerPallet: value,
                        });
                      }
                    }}
                    onBlur={() =>
                      validateSkuField(index, 'casesPerPallet', sku)
                    }
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Price *</Label>
                {renderRequiredCell(
                  `${index}:price`,
                  <Input
                    placeholder="12.99"
                    value={sku.price}
                    aria-invalid={!!skuErrors[`${index}:price`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'price', value);
                      if (skuErrors[`${index}:price`]) {
                        validateSkuField(index, 'price', {
                          ...sku,
                          price: value,
                        });
                      }
                    }}
                    onBlur={() => validateSkuField(index, 'price', sku)}
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">MSRP *</Label>
                {renderRequiredCell(
                  `${index}:msrp`,
                  <Input
                    placeholder="24.99"
                    value={sku.msrp}
                    aria-invalid={!!skuErrors[`${index}:msrp`]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange(index, 'msrp', value);
                      if (skuErrors[`${index}:msrp`]) {
                        validateSkuField(index, 'msrp', { ...sku, msrp: value });
                      }
                    }}
                    onBlur={() => validateSkuField(index, 'msrp', sku)}
                    disabled={disabled}
                  />,
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                {renderRequiredCell(
                  `${index}:quantity`,
                  <Input
                    type="number"
                    placeholder="0"
                    value={sku.quantity}
                    aria-invalid={!!skuErrors[`${index}:quantity`]}
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
                  />,
                )}
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
    </TooltipProvider>
  );
});

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
