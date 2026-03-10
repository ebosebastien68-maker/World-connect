// src/main.tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // pas d'extension
import supabaseClient from './src/pages/supabaseClient'; // initialise le client côté client
import { ServiceWorker } from './src/pages/ServiceWorker';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Element #root introuvable — vérifie index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Enregistrer le service worker côté client (le fichier doit être dans /public/service-worker.js)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerServiceWorker();
}
