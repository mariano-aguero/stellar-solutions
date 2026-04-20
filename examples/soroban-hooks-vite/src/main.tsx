import { SorobanProvider } from '@stellar-solutions/soroban-react-hooks';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('No #root element found');

createRoot(root).render(
  <StrictMode>
    <SorobanProvider network="testnet">
      <App />
    </SorobanProvider>
  </StrictMode>,
);
