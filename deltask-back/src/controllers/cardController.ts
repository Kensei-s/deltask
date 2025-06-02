// src/controllers/cardController.ts
import { RequestHandler } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as cardService from '../services/cardService'

import * as columnService from '../services/columnService'
import * as boardService from '../services/boardService'
import * as workspaceService from '../services/workspaceService'

/**
 * POST /columns/:id/cards
 * Créer une carte dans la colonne. Seuls les membres du workspace parent peuvent créer.
 */
export const createCardInColumn: RequestHandler = async (req, res, next) => {
  try {
    const { id: columnId } = req.params
    const {
      title,
      description,
      order,
      tags,
      dueDate,
      assignedTo,
      checklist,
    } = req.body

    if (!title) {
      res.status(400).json({ message: 'Le titre est requis' })
      return
    }

    // Authenticated user
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Non authentifié' })
      return
    }

    // Vérifier que la colonne existe
    const column = await columnService.getColumnById(columnId)
    if (!column) {
      res.status(404).json({ message: 'Colonne non trouvée' })
      return
    }

    // Vérifier que le board existe
    const board = await boardService.getBoardById(column.boardId)
    if (!board) {
      res.status(404).json({ message: 'Board parent introuvable' })
      return
    }

    // Vérifier que user est membre du workspace parent
    const ws = await workspaceService.getById(board.workspace)
    if (!ws) {
      res.status(404).json({ message: 'Workspace parent introuvable' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    // Créer la carte
    const card = await cardService.createCard(
      title,
      description ?? '',
      columnId,
      board.id,
      order,
      tags,
      dueDate ?? null,
      assignedTo ?? null,
      checklist
    )
    res.status(201).json(card)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /columns/:id/cards
 * Lister toutes les cartes d’une colonne. Seuls les membres du workspace parent peuvent voir.
 */
export const listCardsInColumn: RequestHandler = async (req, res, next) => {
  try {
    const { id: columnId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!

    // Vérifier colonne
    const column = await columnService.getColumnById(columnId)
    if (!column) {
      res.status(404).json({ message: 'Colonne non trouvée' })
      return
    }

    // Vérifier board
    const board = await boardService.getBoardById(column.boardId)
    if (!board) {
      res.status(404).json({ message: 'Board parent introuvable' })
      return
    }

    // Vérifier workspace et appartenance
    const ws = await workspaceService.getById(board.workspace)
    if (!ws) {
      res.status(404).json({ message: 'Workspace parent introuvable' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    // Retourner la liste triée
    const cols = await cardService.listCards(columnId)
    res.json(cols)
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /cards/:id
 * Mettre à jour une carte (title, description, order, tags, dueDate, assignedTo, checklist).
 * Seuls les membres du workspace parent peuvent modifier.
 */
export const updateCard: RequestHandler = async (req, res, next) => {
  try {
    const { id: cardId } = req.params
    const {
      title,
      description,
      order,
      tags,
      dueDate,
      assignedTo,
      checklist,
    } = req.body

    const authReq = req as AuthRequest
    const userId = authReq.user?.id!

    // Récupérer la carte
    const card = await cardService.getCardById(cardId)
    if (!card) {
      res.status(404).json({ message: 'Carte non trouvée' })
      return
    }

    // Vérifier board parent
    const board = await boardService.getBoardById(card.boardId)
    if (!board) {
      res.status(404).json({ message: 'Board parent introuvable' })
      return
    }

    // Vérifier workspace parent et appartenance
    const ws = await workspaceService.getById(board.workspace)
    if (!ws) {
      res.status(404).json({ message: 'Workspace parent introuvable' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    // Mettre à jour
    const updated = await cardService.updateCard(cardId, {
      title,
      description,
      order,
      tags,
      dueDate,
      assignedTo,
      checklist,
    })
    if (!updated) {
      res.status(404).json({ message: 'Erreur mise à jour carte' })
      return
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /cards/:id
 * Supprimer une carte. Seuls les membres du workspace parent peuvent supprimer.
 */
export const deleteCard: RequestHandler = async (req, res, next) => {
  try {
    const { id: cardId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!

    // Récupérer la carte
    const card = await cardService.getCardById(cardId)
    if (!card) {
      res.status(404).json({ message: 'Carte non trouvée' })
      return
    }

    // Vérifier board parent
    const board = await boardService.getBoardById(card.boardId)
    if (!board) {
      res.status(404).json({ message: 'Board parent introuvable' })
      return
    }

    // Vérifier workspace parent et appartenance
    const ws = await workspaceService.getById(board.workspace)
    if (!ws) {
      res.status(404).json({ message: 'Workspace parent introuvable' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    // Supprimer la carte
    await cardService.removeCard(cardId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
