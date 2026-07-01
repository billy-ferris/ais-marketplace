import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface RequiredLabelProps {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}

/**
 * Label that appends a red asterisk when `required` is true.
 * Required-ness is driven explicitly by the `required` prop — never derived
 * from the Zod schema at runtime.
 */
export function RequiredLabel({
  htmlFor,
  children,
  required,
}: RequiredLabelProps) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && (
        <span className="text-destructive" aria-hidden>
          *
        </span>
      )}
    </Label>
  );
}

interface FieldErrorProps {
  message?: string;
}

/**
 * Inline validation error. Renders nothing when there is no message.
 * Matches the existing inline error styling (text-xs text-destructive).
 */
export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

interface CharCounterProps {
  value?: string;
  max: number;
}

/**
 * Live character counter for textarea fields, rendered as `x/max`.
 */
export function CharCounter({ value, max }: CharCounterProps) {
  return (
    <p className="text-xs text-muted-foreground text-right">
      {value?.length ?? 0}/{max}
    </p>
  );
}
