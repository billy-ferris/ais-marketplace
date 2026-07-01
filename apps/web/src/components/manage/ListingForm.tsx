import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Star, X, ArrowUp, ArrowDown } from 'lucide-react';
import { createListingSchema } from '@ais/shared';
import { LISTING_STATUS_LABELS, ListingStatus } from '@ais/shared';
import type { z } from 'zod';

/**
 * Use the schema input type for useForm (status is optional pre-default).
 * zodResolver applies the default, so by submit time status will be set.
 */
type ListingFormInput = z.input<typeof createListingSchema>;
type ListingFormValues = z.output<typeof createListingSchema>;
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  RequiredLabel,
  FieldError,
  CharCounter,
} from '@/components/manage/FormFieldHelpers';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { useBrands } from '@/hooks/useBrands';
import { useCategories, type CategoryRow } from '@/hooks/useCategories';
import { useUpload } from '@/hooks/useUpload';
import {
  SkuInlineEditor,
  buildSkuPayload,
  type SkuFormData,
  type SkuInlineEditorHandle,
} from './SkuInlineEditor';
import type { ListingDetail, ListingImage } from '@/hooks/useListings';

interface ImageFormData {
  id?: number;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean;
}

interface ListingFormProps {
  listing?: ListingDetail | null;
  onSubmit: (payload: {
    listing: Record<string, unknown>;
    skus?: ReturnType<typeof buildSkuPayload>;
    images?: {
      create?: { imageUrl: string; displayOrder: number; isPrimary: boolean }[];
      delete?: number[];
    };
    categoryIds?: number[];
  }) => void;
  isSubmitting?: boolean;
  hideStatus?: boolean;
  extraActions?: React.ReactNode;
  submitLabel?: string;
  hideSubmit?: boolean;
}

const STATUS_OPTIONS = Object.entries(LISTING_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as ListingStatus,
    label,
  }),
);

function listingImagesToFormData(images: ListingImage[]): ImageFormData[] {
  return images.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    displayOrder: img.displayOrder,
    isPrimary: img.isPrimary,
  }));
}

function existingSkusToFormData(
  skus: ListingDetail['inventorySkus'],
): SkuFormData[] {
  return skus.map((sku) => ({
    id: sku.id,
    name: sku.name,
    sku: sku.sku ?? '',
    upc: sku.upc ?? '',
    size: sku.size ?? '',
    casePack: sku.casePack?.toString() ?? '',
    casesPerPallet: sku.casesPerPallet?.toString() ?? '',
    price: sku.price,
    msrp: sku.msrp,
    quantity: sku.quantity.toString(),
    imageUrl: sku.imageUrl,
  }));
}

export function ListingForm({
  listing,
  onSubmit,
  isSubmitting = false,
  hideStatus = false,
  extraActions,
  submitLabel,
  hideSubmit = false,
}: ListingFormProps) {
  // Brands for select
  const { data: brandsData } = useBrands({ limit: 100 });
  const brandOptions = brandsData?.data ?? [];

  // Categories for checkboxes
  const { data: categoriesData } = useCategories({ limit: 100 });
  const categoryOptions: CategoryRow[] = categoriesData?.data ?? [];

  // Image upload
  const { uploadFile, isUploading } = useUpload();

  // Form state for listing fields
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ListingFormInput>({
    resolver: zodResolver(createListingSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      brandId: undefined as unknown as number,
      status: 'draft',
    },
  });

  const selectedBrandId = watch('brandId');
  const selectedStatus = watch('status');

  // Category selection state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Image state
  const [formImages, setFormImages] = useState<ImageFormData[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  // SKU state
  const [skus, setSkus] = useState<SkuFormData[]>([]);
  const skuEditorRef = useRef<SkuInlineEditorHandle>(null);

  // Reset form when listing changes (edit mode)
  useEffect(() => {
    if (listing) {
      reset({
        name: listing.name,
        description: listing.description ?? '',
        brandId: listing.brandId,
        status: listing.status as ListingFormInput['status'],
      });
      setSelectedCategoryIds(listing.categories.map((c) => c.id));
      setFormImages(listingImagesToFormData(listing.brandListingImages));
      setSkus(existingSkusToFormData(listing.inventorySkus));
      setDeletedImageIds([]);
    } else {
      reset({
        name: '',
        description: '',
        brandId: undefined,
        status: 'draft',
      });
      setSelectedCategoryIds([]);
      setFormImages([]);
      setSkus([]);
      setDeletedImageIds([]);
    }
  }, [listing, reset]);

  // Category toggle
  const handleCategoryToggle = useCallback(
    (categoryId: number, checked: boolean) => {
      setSelectedCategoryIds((prev) =>
        checked
          ? [...prev, categoryId]
          : prev.filter((id) => id !== categoryId),
      );
    },
    [],
  );

  // Image handling
  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        const url = await uploadFile(file);
        setFormImages((prev) => {
          const newImage: ImageFormData = {
            imageUrl: url,
            displayOrder: prev.length,
            isPrimary: prev.length === 0, // First image is primary by default
          };
          return [...prev, newImage];
        });
      } catch {
        // Upload error handled by useUpload
      }
    },
    [uploadFile],
  );

  const handleImageRemove = useCallback(
    (index: number) => {
      const image = formImages[index];
      if (image.id) {
        setDeletedImageIds((prev) => [...prev, image.id!]);
      }
      setFormImages((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        // Recalculate display order
        return updated.map((img, i) => ({ ...img, displayOrder: i }));
      });
    },
    [formImages],
  );

  const handleSetPrimary = useCallback(
    (index: number) => {
      setFormImages((prev) =>
        prev.map((img, i) => ({
          ...img,
          isPrimary: i === index,
        })),
      );
    },
    [],
  );

  const handleMoveImage = useCallback(
    (index: number, direction: 'up' | 'down') => {
      setFormImages((prev) => {
        const updated = [...prev];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= updated.length) return prev;
        [updated[index], updated[targetIndex]] = [
          updated[targetIndex],
          updated[index],
        ];
        return updated.map((img, i) => ({ ...img, displayOrder: i }));
      });
    },
    [],
  );

  // Form submit -- zodResolver applies defaults, so data has all required fields
  function onFormSubmit(data: ListingFormInput) {
    // Submit-time SKU catch-all: block save and surface per-cell errors when any
    // non-deleted SKU row is invalid (including untouched empty rows).
    const skusValid = skuEditorRef.current?.validateAll() ?? true;
    if (!skusValid) {
      // validateAll() already flagged the offending cell(s) with a red border +
      // tooltip; the toast ensures the user still gets a signal even if the bad
      // cell is scrolled out of view.
      toast.error(
        'One or more SKU rows have invalid values. Please review the SKUs section.',
      );
      return;
    }

    const skuPayload = buildSkuPayload(skus);

    // Determine new images (no id) and build images payload
    const newImages = formImages
      .filter((img) => !img.id)
      .map((img) => ({
        imageUrl: img.imageUrl,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary,
      }));

    const imagesPayload: {
      create?: { imageUrl: string; displayOrder: number; isPrimary: boolean }[];
      delete?: number[];
    } = {};
    if (newImages.length > 0) imagesPayload.create = newImages;
    if (deletedImageIds.length > 0) imagesPayload.delete = deletedImageIds;

    const payload: Parameters<typeof onSubmit>[0] = {
      listing: data as unknown as Record<string, unknown>,
      categoryIds: selectedCategoryIds,
    };

    // Only include skus if there are SKU operations
    if (
      skuPayload.create.length > 0 ||
      skuPayload.update.length > 0 ||
      skuPayload.delete.length > 0
    ) {
      payload.skus = skuPayload;
    }

    // Only include images if there are image operations
    if (imagesPayload.create || imagesPayload.delete) {
      payload.images = imagesPayload;
    }

    // For create mode (no listing prop), pass skus as flat array
    if (!listing) {
      const createSkus = skuPayload.create;
      if (createSkus.length > 0) {
        payload.skus = createSkus as unknown as ReturnType<
          typeof buildSkuPayload
        >;
      }
      // For create mode, images should be flat array
      if (newImages.length > 0) {
        payload.images = newImages as unknown as typeof payload.images;
      }
    }

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Section 1: Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>

        <div className="space-y-2">
          <RequiredLabel htmlFor="listing-name" required>
            Name
          </RequiredLabel>
          <Input
            id="listing-name"
            placeholder="Listing name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="listing-description">Description</Label>
          <Textarea
            id="listing-description"
            placeholder="Listing description"
            rows={4}
            {...register('description')}
            aria-invalid={!!errors.description}
          />
          <CharCounter value={watch('description') ?? ''} max={5000} />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <RequiredLabel required>Brand</RequiredLabel>
            <Select
              value={
                selectedBrandId != null ? String(selectedBrandId) : undefined
              }
              onOpenChange={(open) => {
                if (!open) {
                  void trigger('brandId');
                }
              }}
              onValueChange={(value) => {
                // Use the stable id as the value so brands that share a display
                // name can't collide (a name-based lookup would always resolve
                // to the first match).
                setValue('brandId', Number(value), {
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brandOptions.map((brand) => (
                  <SelectItem key={brand.id} value={String(brand.id)}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.brandId?.message} />
          </div>

          {!hideStatus && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={LISTING_STATUS_LABELS[selectedStatus ?? 'draft']}
                onValueChange={(label) => {
                  const opt = STATUS_OPTIONS.find((o) => o.label === label);
                  if (opt) {
                    setValue('status', opt.value, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.label}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Categories */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Categories</h2>
        {categoryOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No categories available. Create categories first.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categoryOptions.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedCategoryIds.includes(cat.id)}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle(cat.id, !!checked)
                  }
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Images */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Images{' '}
          <span className="text-sm font-normal text-muted-foreground">
            (up to 5)
          </span>
        </h2>
        <div className="flex flex-wrap gap-4">
          {formImages.map((img, index) => (
            <div key={img.id ?? `new-img-${index}`} className="relative group">
              <img
                src={img.imageUrl}
                alt={`Listing image ${index + 1}`}
                className="h-32 w-32 rounded-md border object-cover"
              />
              {img.isPrimary && (
                <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Primary
                </span>
              )}
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {!img.isPrimary && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    onClick={() => handleSetPrimary(index)}
                    title="Set as primary"
                  >
                    <Star className="size-3" />
                  </Button>
                )}
                {index > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    onClick={() => handleMoveImage(index, 'up')}
                    title="Move up"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                )}
                {index < formImages.length - 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    onClick={() => handleMoveImage(index, 'down')}
                    title="Move down"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => handleImageRemove(index)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          ))}
          {formImages.length < 5 && (
            <ImageUploader
              value={null}
              onChange={handleImageUpload}
              isUploading={isUploading}
              disabled={isSubmitting}
            />
          )}
        </div>
      </div>

      {/* Section 4: SKUs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">SKUs</h2>
        <SkuInlineEditor
          ref={skuEditorRef}
          skus={skus}
          onChange={setSkus}
          disabled={isSubmitting}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        {extraActions}
        {!hideSubmit && (
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {submitLabel ?? (listing ? 'Save Changes' : 'Create Listing')}
          </Button>
        )}
      </div>
    </form>
  );
}
