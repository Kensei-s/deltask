// src/pages/Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'  // ← import du hook

interface LoginData {
  email: string
  password: string
}

interface LoginErrors {
  email?: string
  password?: string
  general?: string
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()    // ← récupération de la méthode login du contexte
  const [form, setForm] = useState<LoginData>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginErrors>({})

  const API = import.meta.env.VITE_API_URL

  const validate = (): boolean => {
    const errs: LoginErrors = {}
    if (!form.email) {
      errs.email = 'Email requis'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'Email invalide'
    }
    if (!form.password) {
      errs.password = 'Mot de passe requis'
    } else if (form.password.length < 6) {
      errs.password = 'Au moins 6 caractères'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: undefined, general: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const body = await res.json()
      if (!res.ok) {
        setErrors({ general: body.message || 'Erreur de connexion' })
        return
      }

      // ← ici on utilise le contexte pour stocker le token et le payload
      login(body.token)
      navigate('/dashboard')
    } catch {
      setErrors({ general: 'Erreur réseau' })
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
      <form onSubmit={handleSubmit} noValidate>
        {errors.general && <p className="text-red-500 mb-4">{errors.general}</p>}
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block mb-1">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Se connecter
        </button>
      </form>
    </div>
  )
}
