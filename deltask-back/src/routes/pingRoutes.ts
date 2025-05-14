// src/routes/pingRoutes.ts
import { Router } from 'express'
import { ping } from '../controllers/pingController'

const router = Router()

// GET /api/ping
router.get('/ping', ping)

export default router
