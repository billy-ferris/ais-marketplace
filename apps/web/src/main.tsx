import { createRoot } from 'react-dom/client';
import { UserRole } from '@ais/shared';
import App from './App';
import './index.css';

// Verify @ais/shared wiring works
console.log('UserRole values:', UserRole);

createRoot(document.getElementById('root')!).render(<App />);
