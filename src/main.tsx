import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { CurrencyProvider } from './contexts/CurrencyContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </ErrorBoundary>
  </StrictMode>,
);
