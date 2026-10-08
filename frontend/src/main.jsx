import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        offset={20}
        toastOptions={{
          className: 'font-sans !rounded-xl !border-stone-200 !shadow-[0_12px_32px_-8px_rgba(28,25,23,0.25)]',
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
