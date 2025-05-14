// src/services/userService.ts
import * as userModel from '../models/userModel'
import { User } from '../models/userModel'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10  // nombre de tours de salage

/**
 * Crée un nouvel utilisateur en hashant son mot de passe.
 */
export async function createUser(data: {
  name: string
  email: string
  password: string
  role?: User['role']
}): Promise<User> {
  // 1. Hash du mot de passe
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)

  // 2. Délégation au modèle, en passant le mot de passe hashé
  const newUser = await userModel.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role,
  })

  return newUser
}
