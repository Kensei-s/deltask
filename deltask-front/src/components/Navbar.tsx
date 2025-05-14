// Exemple : src/components/Navbar.tsx
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow z-10">
      <nav className="container mx-auto flex justify-between items-center p-4">
        <ul className="flex space-x-4">
          {!user && (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
          {user && (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </>
          )}
        </ul>
        {user ? (
          <button onClick={logout} className="px-3 py-1 border rounded">
            Déconnexion
          </button>
        ) : null}
      </nav>
    </header>
  )
}
