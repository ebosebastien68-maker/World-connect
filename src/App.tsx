import { Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import connexion from "./pages/connexion"
import admin from "./pages/admin"
import messages from "./pages/messages"
import notifications from "./pages/notifications"
import parametre from "./pages/parametre"
import publier from "./pages/publier"
import plus from "./pages/plus"
import auth from "./pages/auth"
import offline from "./pages/offline"
import usereact from "./pages/usereact"
import editArticle from "./pages/edit-article"

export default function App() {
  return (
    <Routes>

      {/* Page principale */}
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/connexion" element={<connexion />} />
      <Route path="/auth" element={<auth />} />

      {/* Application */}
      <Route path="/messages" element={<messages />} />
      <Route path="/notifications" element={<notifications />} />
      <Route path="/publier" element={<publier />} />
      <Route path="/plus" element={<plus />} />
      <Route path="/parametre" element={<parametre />} />

      {/* Admin */}
      <Route path="/admin" element={<admin />} />

      {/* Articles */}
      <Route path="/edit-article" element={<editArticle />} />

      {/* React test */}
      <Route path="/usereact" element={<usereact />} />

      {/* Offline */}
      <Route path="/offline" element={<offline />} />

    </Routes>
  )
}
