export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for does not exist.
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
