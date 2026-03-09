import { SignIn } from '@clerk/react';

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          AIS
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          B2B Marketplace for CPG Excess Inventory
        </p>
      </div>

      <SignIn />

      <p className="mt-8 text-sm text-muted-foreground">
        Contact us for access
      </p>
    </div>
  );
}
