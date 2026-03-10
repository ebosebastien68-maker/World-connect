// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy-loaded pages (code-splitting)
const Home = lazy(() => import('./pages/Home'));
const Connexion = lazy(() => import('./pages/connexion'));
const Admin = lazy(() => import('./pages/admin'));
const Messages = lazy(() => import('./pages/messages'));
const Notifications = lazy(() => import('./pages/notifications'));
const Parametre = lazy(() => import('./pages/parametre'));
const Publier = lazy(() => import('./pages/publier'));
const Plus = lazy(() => import('./pages/plus'));
const Auth = lazy(() => import('./pages/auth'));
const Offline = lazy(() => import('./pages/offline'));
const UseReact = lazy(() => import('./pages/usereact'));
const EditArticle = lazy(() => import('./pages/edit-article'));

export default function App(): JSX.Element {
  return (
    <Suspense fallback={<div>Chargement de la page…</div>}>
      <Routes>
        {/* Page principale */}
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/auth" element={<Auth />} />

        {/* Application */}
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/publier" element={<Publier />} />
        <Route path="/plus" element={<Plus />} />
        <Route path="/parametre" element={<Parametre />} />

        {/* Admin */}
        <Route path="/admin" element={<Admin />} />

        {/* Articles */}
        <Route path="/edit-article" element={<EditArticle />} />

        {/* React test */}
        <Route path="/usereact" element={<UseReact />} />

        {/* Offline */}
        <Route path="/offline" element={<Offline />} />

        {/* Catch-all -> redirige vers la home (ou remplacer par une page 404 si tu veux) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
