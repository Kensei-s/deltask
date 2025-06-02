// src/routes/boardRoutes.ts
import { Router } from 'express'
import { authenticateToken } from '../middleware/authMiddleware'
import {
  createBoardInWorkspace,
  listBoardsInWorkspace,
  getBoardDetail,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController'

const router = Router()

// Toutes les routes sont protégées par JWT
router.use(authenticateToken)

// Créer un board dans un workspace
// POST /workspaces/:id/boards
router.post('/workspaces/:id/boards', createBoardInWorkspace)

// Lister tous les boards d’un workspace
// GET /workspaces/:id/boards
router.get('/workspaces/:id/boards', listBoardsInWorkspace)

// Récupérer / modifier / supprimer un board
// GET    /boards/:id
// PUT    /boards/:id
// DELETE /boards/:id
router.get('/boards/:id', getBoardDetail)
router.put('/boards/:id', updateBoard)
router.delete('/boards/:id', deleteBoard)

export default router
