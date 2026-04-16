import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SorobanProvider } from '@stellar-solutions/soroban-react-hooks';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) throw new Error('No #root element found');

createRoot(root).render(
  <StrictMode>
    <SorobanProvider network="testnet">
      <App />
    </SorobanProvider>
  </StrictMode>,
);
