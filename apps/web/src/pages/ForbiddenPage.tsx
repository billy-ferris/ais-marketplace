export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">403</h1>
      <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
      <p className="mt-2 text-muted-foreground">
        You do not have permission to view this page.
      </p>
      <a
        href="/"
        className="mt-6 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Return to Dashboard
      </a>
    </div>
  );
}
