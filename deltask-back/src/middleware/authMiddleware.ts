// src/middleware/authMiddleware.ts
import { RequestHandler } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'ta_clef_secrète'

export interface AuthRequest extends Express.Request {
  user?: JwtPayload
}

/**
 * Middleware d’authentification JWT.
 * Ne renvoie jamais un Response, il appelle next() ou termine la réponse.
 */
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null

  if (!token) {
    res.status(401).json({ message: 'Token manquant' })
    return
  }

  try {
    // Vérification synchronisée pour simplifier
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as AuthRequest).user = payload
    next()
  } catch (err) {
    res.status(403).json({ message: 'Token invalide' })
  }
}
