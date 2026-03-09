import { SignIn } from '@clerk/react';

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <SignIn />

      <p className="mt-8 text-sm text-muted-foreground">
        Contact us for access
      </p>
    </div>
  );
}
