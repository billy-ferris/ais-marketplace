import { Show, useAuth } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { setTokenGetter } from '@/lib/api';
import { LoginPage } from './pages/LoginPage';
import { router } from './lib/router';

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { getToken } = useAuth();

  // Set synchronously during render so the token is available
  // before any child components (and their queries) mount
  setTokenGetter(getToken);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <>
      <Show when="signed-out">
        <LoginPage />
      </Show>
      <Show when="signed-in">
        <AuthenticatedApp />
      </Show>
    </>
  );
}
