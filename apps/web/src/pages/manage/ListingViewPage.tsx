import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useListing } from '@/hooks/useListings';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  draft: { label: 'Draft', className: '' },
  archived: { label: 'Archived', className: '' },
  sold_out: { label: 'Sold Out', className: '' },
};

export function ListingViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listingId = id ? Number(id) : null;

  const { data: listing, isLoading } = useListing(listingId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/manage/listings')}
        >
          <ArrowLeft className="size-4" />
          Back to Listings
        </Button>
        <p className="text-muted-foreground">Listing not found.</p>
      </div>
    );
  }

  const badge = STATUS_BADGE[listing.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manage/listings')}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{listing.name}</h1>
          <p className="text-sm text-muted-foreground">
            {listing.brand.company.name} &middot; {listing.brand.name}
          </p>
        </div>
        {badge && (
          <Badge variant="outline" className={badge.className}>
            {badge.label}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Listing Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
            <CardDescription>Product information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <p className="font-medium">{listing.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                Description
              </Label>
              <p>{listing.description || 'No description provided.'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Brand</Label>
              <p>{listing.brand.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Company</Label>
              <p>{listing.brand.company.name}</p>
            </div>
            {listing.categories.length > 0 && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Categories
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {listing.categories.map((cat) => (
                    <Badge key={cat.id} variant="outline" className="text-xs">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p>{new Date(listing.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              {listing.brandListingImages.length} image(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listing.brandListingImages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No images uploaded.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {listing.brandListingImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-md border bg-muted overflow-hidden"
                  >
                    <img
                      src={img.imageUrl}
                      alt=""
                      className="object-cover w-full h-full"
                    />
                    {img.isPrimary && (
                      <Badge className="absolute top-1 left-1 text-[10px]">
                        Primary
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SKUs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            SKUs ({listing.inventorySkus.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listing.inventorySkus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No SKUs added.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Case Pack</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">MSRP</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listing.inventorySkus.map((sku) => (
                  <TableRow key={sku.id}>
                    <TableCell className="font-medium">{sku.name}</TableCell>
                    <TableCell>{sku.sku || '-'}</TableCell>
                    <TableCell>{sku.size || '-'}</TableCell>
                    <TableCell>{sku.casePack ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      ${Number(sku.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(sku.msrp).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{sku.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
