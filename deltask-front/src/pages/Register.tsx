// src/pages/Register.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface RegisterData {
  name: string
  email: string
  password: string
  confirm: string
}

interface RegisterErrors {
  name?: string
  email?: string
  password?: string
  confirm?: string
  general?: string
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<RegisterErrors>({})

  const API = import.meta.env.VITE_API_URL

  const validate = (): boolean => {
    const errs: RegisterErrors = {}
    if (!form.name) {
      errs.name = 'Nom requis'
    }
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
    if (form.confirm !== form.password) {
      errs.confirm = 'Les mots de passe ne correspondent pas'
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
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setErrors({ general: body.message || 'Erreur d\'inscription' })
        return
      }
      navigate('/login')
    } catch {
      setErrors({ general: 'Erreur réseau' })
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Inscription</h1>
      <form onSubmit={handleSubmit} noValidate>
        {errors.general && <p className="text-red-500 mb-4">{errors.general}</p>}
        <div className="mb-4">
          <label htmlFor="name" className="block mb-1">Nom</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
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
        <div className="mb-4">
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
        <div className="mb-6">
          <label htmlFor="confirm" className="block mb-1">Confirmaaaaaation</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.confirm && <p className="text-red-500 text-sm mt-1">{errors.confirm}</p>}
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          S’inscrire
        </button>
      </form>
    </div>
  )
}
