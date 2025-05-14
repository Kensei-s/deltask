// src/pages/Profile.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, loading } = useAuth()

  // 1. Tant que le contexte recharge le token, on peut afficher un loader ou rien
  if (loading) {
    return <div>Chargement...</div>
  }

  // 2. Si on a fini de charger et qu'il n'y a pas d'utilisateur, on redirige
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 3. Sinon, on affiche la page profil
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold mb-4">Profil utilisateur</h1>
      <p className="mb-2"><strong>Email :</strong> {user.email}</p>
      <p className="mb-2"><strong>Rôle :</strong> {user.role}</p>
      {/* Ajoute ici d’autres champs ou un appel à /auth/me pour plus de données */}
    </div>
  )
}
