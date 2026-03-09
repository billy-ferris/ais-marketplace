import { Show } from '@clerk/react';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <>
      <Show when="signed-out">
        <LoginPage />
      </Show>
      <Show when="signed-in">
        <AppShell />
      </Show>
    </>
  );
}
