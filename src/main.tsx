// src/main.tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // pas d'extension
import './styles.css'; // si tu as du CSS global
import supabaseClient from './lib/supabaseClient'; // initialise le client côté client
import { registerServiceWorker } from './registerServiceWorker';

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
