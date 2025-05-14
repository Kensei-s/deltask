// src/controllers/authController.ts
import { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import * as userModel from '../models/userModel'
import * as userService from '../services/userService'
import { AuthRequest } from '../middleware/authMiddleware'  // ← import du type

const JWT_SECRET = process.env.JWT_SECRET || 'ta_clef_secrète'
const JWT_EXPIRES_IN = '1h'

// POST /auth/register
export const register: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Vérifier qu’il n’existe pas déjà
    const exists = await userModel.findByEmail(email)
    if (exists) {
      res.status(409).json({ message: 'Email déjà utilisé' })
      return
    }

    // Créer et hasher
    const user = await userService.createUser({ name, email, password })

    // Ne jamais renvoyer le mot de passe
    const { password: _, ...safeUser } = user
    res.status(201).json(safeUser)
  } catch (err) {
    next(err)
  }
}

// POST /auth/login
export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await userModel.findByEmail(email)
    if (!user) {
      res.status(401).json({ message: 'Identifiants invalides' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ message: 'Identifiants invalides' })
      return
    }

    const payload = { id: user.id, email: user.email, role: user.role }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.json({ token })
  } catch (err) {
    next(err)
  }
}

// GET /auth/me
export const me: RequestHandler = (req, res) => {
  // on caste la req en AuthRequest pour accéder à user
  const authReq = req as AuthRequest

  if (!authReq.user) {
    res.status(401).json({ message: 'Non authentifié' })
    return
  }

  res.json({ user: authReq.user })
}