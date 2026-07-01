import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { createCategorySchema, type CreateCategoryInput } from '@ais/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RequiredLabel, FieldError } from '@/components/manage/FormFieldHelpers';
import {
  useCreateCategory,
  useUpdateCategory,
  type CategoryRow,
} from '@/hooks/useCategories';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryRow | null;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: CategoryDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      icon: '',
      displayOrder: 0,
    },
  });

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        reset({
          name: category.name,
          icon: category.icon ?? '',
          displayOrder: category.displayOrder,
        });
      } else {
        reset({
          name: '',
          icon: '',
          displayOrder: 0,
        });
      }
    }
  }, [open, category, reset]);

  function onSubmit(data: CreateCategoryInput) {
    if (category) {
      updateCategory.mutate(
        { id: category.id, ...data },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    } else {
      createCategory.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  }

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Update the category details below.'
              : 'Fill in the details to create a new category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <RequiredLabel htmlFor="category-name" required>
              Name
            </RequiredLabel>
            <Input
              id="category-name"
              placeholder="Category name"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-icon">Icon</Label>
            <Input
              id="category-icon"
              placeholder="e.g., scissors, sparkles"
              {...register('icon')}
              aria-invalid={!!errors.icon}
            />
            <p className="text-xs text-muted-foreground">
              Enter a Lucide icon name, e.g., scissors, sparkles
            </p>
            <FieldError message={errors.icon?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-order">Display Order</Label>
            <Input
              id="category-order"
              type="number"
              placeholder="0"
              {...register('displayOrder', {
                // Coerce a cleared input to `undefined` (which the optional
                // schema accepts) instead of NaN (which `z.number()` rejects,
                // blocking submit of an otherwise-valid form).
                setValueAs: (v) => (v === '' ? undefined : Number(v)),
              })}
              aria-invalid={!!errors.displayOrder}
            />
            <FieldError message={errors.displayOrder?.message} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {category ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
