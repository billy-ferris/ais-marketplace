import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { createBrandSchema, type CreateBrandInput } from '@ais/shared';
import { apiFetch } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  RequiredLabel,
  FieldError,
  CharCounter,
} from '@/components/manage/FormFieldHelpers';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { useCreateBrand, useUpdateBrand, type BrandRow } from '@/hooks/useBrands';
import { useUpload } from '@/hooks/useUpload';
import { useRole } from '@/hooks/useRole';

interface Company {
  id: number;
  name: string;
  type: string;
}

interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: BrandRow | null;
}

export function BrandDialog({ open, onOpenChange, brand }: BrandDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { uploadFile, isUploading } = useUpload();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const { isManufacturer } = useRole();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateBrandInput>({
    resolver: zodResolver(createBrandSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      companyId: undefined,
      logoUrl: undefined,
    },
  });

  const selectedCompanyId = watch('companyId');

  // Load companies for admin only
  useEffect(() => {
    if (open && !isManufacturer) {
      apiFetch<Company[]>(API_ROUTES.COMPANIES)
        .then((data) => {
          setCompanies(data.filter((c) => c.type === 'manufacturer'));
        })
        .catch(() => setCompanies([]));
    }
  }, [open, isManufacturer]);

  // Reset form when dialog opens/closes or brand changes
  useEffect(() => {
    if (open) {
      if (brand) {
        reset({
          name: brand.name,
          description: brand.description ?? '',
          companyId: brand.companyId,
          logoUrl: brand.logoUrl ?? undefined,
        });
        setLogoUrl(brand.logoUrl);
      } else {
        reset({
          name: '',
          description: '',
          companyId: undefined,
          logoUrl: undefined,
        });
        setLogoUrl(null);
      }
    }
  }, [open, brand, reset]);

  async function handleImageUpload(file: File) {
    try {
      const url = await uploadFile(file);
      setLogoUrl(url);
      setValue('logoUrl', url);
    } catch {
      // Upload error is already handled by useUpload
    }
  }

  function handleImageRemove() {
    setLogoUrl(null);
    setValue('logoUrl', undefined);
  }

  function onSubmit(data: CreateBrandInput) {
    // Admin-only client gate: the shared schema keeps `companyId` optional
    // (manufacturers auto-populate it from their own company and never send it),
    // so the "Manufacturer required" rule is enforced here for the admin path
    // that actually surfaces the Select. Without this, the required asterisk /
    // inline error in the UI would be purely cosmetic.
    if (!isManufacturer && !data.companyId) {
      setError('companyId', {
        type: 'manual',
        message: 'Manufacturer is required',
      });
      return;
    }

    if (brand) {
      updateBrand.mutate(
        { id: brand.id, ...data },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    } else {
      createBrand.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  }

  const isPending = createBrand.isPending || updateBrand.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit Brand' : 'Create Brand'}</DialogTitle>
          <DialogDescription>
            {brand
              ? 'Update the brand details below.'
              : 'Fill in the details to create a new brand.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <RequiredLabel htmlFor="brand-name" required>
              Name
            </RequiredLabel>
            <Input
              id="brand-name"
              placeholder="Brand name"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-description">Description</Label>
            <Textarea
              id="brand-description"
              placeholder="Brief description of the brand"
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            <CharCounter value={watch('description') ?? ''} max={2000} />
            <FieldError message={errors.description?.message} />
          </div>

          {!isManufacturer && (
            <div className="space-y-2">
              <RequiredLabel required>Manufacturer</RequiredLabel>
              <Select
                value={
                  selectedCompanyId != null ? String(selectedCompanyId) : undefined
                }
                onOpenChange={(open) => {
                  // The schema can't reject a missing companyId, so validate the
                  // admin requirement manually on close (blur-equivalent).
                  if (!open && !selectedCompanyId) {
                    setError('companyId', {
                      type: 'manual',
                      message: 'Manufacturer is required',
                    });
                  }
                }}
                onValueChange={(value) => {
                  // Use the stable id as the value so companies that share a
                  // display name can't collide (a name-based lookup would always
                  // resolve to the first match).
                  setValue('companyId', Number(value), { shouldValidate: true });
                  clearErrors('companyId');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.companyId?.message} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageUploader
              value={logoUrl}
              onChange={handleImageUpload}
              onRemove={handleImageRemove}
              isUploading={isUploading}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {brand ? 'Save Changes' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
