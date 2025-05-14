// src/pages/Dashboard.tsx
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, loading } = useAuth()

  // 1. Tant que le contexte recharge le token, on n'affiche rien (ou un loader)
  if (loading) {
    return null   // ou un spinner : <div>Chargement...</div>
  }

  // 2. Si le token est restauré et qu'il n'y a pas d'user, on redirige
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 3. Enfin, on affiche le dashboard
  return <div>Bienvenue, {user.email} (rôle : {user.role})</div>
}
