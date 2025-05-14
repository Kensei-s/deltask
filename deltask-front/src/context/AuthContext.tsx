// src/context/AuthContext.tsx
import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
    useContext,
  } from 'react'
  
  interface UserPayload {
    id: string
    email: string
    role: string
    iat?: number
    exp?: number
  }
  interface UserPayload {
    id: string
    email: string
    role: string
    iat?: number
    exp?: number
  }
  
  interface AuthContextType {
    user: UserPayload | null
    token: string | null
    loading: boolean            // ← nouveau
    login: (token: string) => void
    logout: () => void
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined)
  
  interface AuthProviderProps {
    children: ReactNode
  }
  
  export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<UserPayload | null>(null)
    const [loading, setLoading] = useState(true)   // ← initialisé à true
  
    // Décode un JWT en payload
    const decodeToken = (jwt: string): UserPayload | null => {
      try {
        const [, payload] = jwt.split('.')
        return JSON.parse(atob(payload)) as UserPayload
      } catch {
        return null
      }
    }
  
    const login = (jwt: string) => {
      const payload = decodeToken(jwt)
      if (payload) {
        localStorage.setItem('token', jwt)
        setToken(jwt)
        setUser(payload)
      }
    }
  
    const logout = () => {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  
    // Au montage : on restaure le token, puis on arrête le mode "loading"
    useEffect(() => {
      const saved = localStorage.getItem('token')
      if (saved) login(saved)
      setLoading(false)   // ← ici on signale que la restauration est faite
    }, [])
  
    return (
      <AuthContext.Provider value={{ user, token, loading, login, logout }}>
        {children}
      </AuthContext.Provider>
    )
  }
  
  export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
  }