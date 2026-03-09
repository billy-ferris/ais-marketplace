import type { LucideIcon } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComingSoonCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function ComingSoonCard({ title, description, icon: Icon }: ComingSoonCardProps) {
  return (
    <Card className="border-dashed opacity-75">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
