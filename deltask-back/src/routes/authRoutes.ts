// src/routes/authRoutes.ts
import { Router } from 'express'
import { register, login, me } from '../controllers/authController'
import { authenticateToken } from '../middleware/authMiddleware'

const router = Router()

// POST /auth/register
router.post('/register', register)

// POST /auth/login
router.post('/login', login)

// GET /auth/me  (protégée)
router.get('/me', authenticateToken, me)

export default router
