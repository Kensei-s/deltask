// src/models/userModel.ts

// Définition des rôles possibles
export type Role = 'user' | 'admin'

// Interface User
export interface User {
  id: string
  name: string
  email: string
  password: string   // stocké hashé en pratique
  role: Role
}

// Stockage en mémoire (exemple simple)
const users: User[] = []

// Génère un ID unique (ici à base de timestamp + random)
function generateId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

// Récupérer tous les users
export async function findAll(): Promise<User[]> {
  return users
}

// Récupérer un user par ID
export async function findById(id: string): Promise<User | null> {
  return users.find(u => u.id === id) ?? null
}

// Récupérer un user par email (utile pour l’authent)
export async function findByEmail(email: string): Promise<User | null> {
  return users.find(u => u.email === email) ?? null
}

// Créer un nouveau user
export async function create(data: {
  name: string
  email: string
  password: string
  role?: Role
}): Promise<User> {
  const newUser: User = {
    id: generateId(),
    name: data.name,
    email: data.email,
    password: data.password,   // à hasher en service !
    role: data.role ?? 'user'  // rôle par défaut : user
  }
  users.push(newUser)
  return newUser
}

// Mettre à jour un user
export async function update(
  id: string,
  data: Partial<Pick<User, 'name' | 'email' | 'password' | 'role'>>
): Promise<User | null> {
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return null

  const updated = { ...users[idx], ...data }
  users[idx] = updated
  return updated
}

// Supprimer un user
export async function remove(id: string): Promise<boolean> {
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return false
  users.splice(idx, 1)
  return true
}
