// src/routes/cardRoutes.ts
import { Router } from 'express'
import { authenticateToken } from '../middleware/authMiddleware'
import {
  createCardInColumn,
  listCardsInColumn,
  updateCard,
  deleteCard,
} from '../controllers/cardController'

const router = Router()

// Protéger toutes les routes avec JWT
router.use(authenticateToken)

// Créer une carte dans une colonne
// POST /columns/:id/cards
router.post('/columns/:id/cards', createCardInColumn)

// Lister toutes les cartes d’une colonne
// GET /columns/:id/cards
router.get('/columns/:id/cards', listCardsInColumn)

// Mettre à jour une carte
// PUT /cards/:id
router.put('/cards/:id', updateCard)

// Supprimer une carte
// DELETE /cards/:id
router.delete('/cards/:id', deleteCard)

export default router
