import { Show } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { LoginPage } from './pages/LoginPage';
import { router } from './lib/router';

const queryClient = new QueryClient();

export default function App() {
  return (
    <>
      <Show when="signed-out">
        <LoginPage />
      </Show>
      <Show when="signed-in">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </Show>
    </>
  );
}
