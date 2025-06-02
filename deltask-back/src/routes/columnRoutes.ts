// src/routes/columnRoutes.ts
import { Router } from 'express'
import { authenticateToken } from '../middleware/authMiddleware'
import {
  createColumnInBoard,
  listColumnsInBoard,
  updateColumn,
  deleteColumn,
} from '../controllers/columnController'

const router = Router()

// Toutes les routes sont protégées par JWT
router.use(authenticateToken)

// Créer une colonne dans un board
// POST /boards/:id/columns
router.post('/boards/:id/columns', createColumnInBoard)

// Lister toutes les colonnes d’un board
// GET /boards/:id/columns
router.get('/boards/:id/columns', listColumnsInBoard)

// Mettre à jour une colonne (titre et/ou order)
// PUT /columns/:id
router.put('/columns/:id', updateColumn)

// Supprimer une colonne
// DELETE /columns/:id
router.delete('/columns/:id', deleteColumn)

export default router
