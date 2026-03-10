// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Connexion from './pages/connexion';
import Admin from './pages/admin';
import Messages from './pages/messages';
import Notifications from './pages/notifications';
import Parametre from './pages/parametre';
import Publier from './pages/publier';
import Plus from './pages/plus';
import Auth from './pages/auth';
import Offline from './pages/offline';
import UseReact from './pages/usereact';
import EditArticle from './pages/edit-article';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/publier" element={<Publier />} />
      <Route path="/plus" element={<Plus />} />
      <Route path="/parametre" element={<Parametre />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/edit-article" element={<EditArticle />} />
      <Route path="/usereact" element={<UseReact />} />
      <Route path="/offline" element={<Offline />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
