// src/controllers/columnController.ts
import { RequestHandler } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as columnService from '../services/columnService'
import * as boardService from '../services/boardService'
import * as workspaceService from '../services/workspaceService'

/**
 * POST /boards/:id/columns
 * Créer une colonne dans le board. Seuls les membres du workspace parent peuvent créer.
 */
export const createColumnInBoard: RequestHandler = async (req, res, next) => {
  try {
    const { id: boardId } = req.params
    const { title, order } = req.body
    if (!title) {
      res.status(400).json({ message: 'Le titre est requis' })
      return
    }

    // Récupérer l'utilisateur authentifié
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Non authentifié' })
      return
    }

    // Vérifier que le board existe
    const board = await boardService.getBoardById(boardId)
    if (!board) {
      res.status(404).json({ message: 'Board non trouvé' })
      return
    }

    // Vérifier que l'utilisateur est membre du workspace parent
    const ws = await workspaceService.getById(board.workspace)
    if (!ws) {
      res.status(404).json({ message: 'Workspace parent introuvable' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    // Créer la colonne
    const column = await columnService.createColumn(title, boardId, order)
    res.status(201).json(column)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /boards/:id/columns
 * Lister toutes les colonnes d’un board. Seuls les membres du workspace parent peuvent voir.
 */
export const listColumnsInBoard: RequestHandler = async (req, res, next) => {
  try {
    const { id: boardId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!
    // Vérifier que le board existe
    const board = await boardService.getBoardById(boardId)
    if (!board) {
      res.status(404).json({ message: 'Board non trouvé' })
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
    // Récupérer la liste triée par order
    const cols = await columnService.listColumns(boardId)
    res.json(cols)
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /columns/:id
 * Mettre à jour le titre et/ou l’ordre d’une colonne.
 * Seuls les membres du workspace parent peuvent renommer ou réordonner.
 */
export const updateColumn: RequestHandler = async (req, res, next) => {
  try {
    const { id: columnId } = req.params
    const { title, order } = req.body

    // Récupérer l'utilisateur
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!
    // Récupérer la colonne
    const column = await columnService.getColumnById(columnId)
    if (!column) {
      res.status(404).json({ message: 'Column non trouvée' })
      return
    }
    // Récupérer le board parent
    const board = await boardService.getBoardById(column.boardId)
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
    // Mettre à jour (on accepte title et/ou order)
    const updated = await columnService.updateColumn(columnId, { title, order })
    if (!updated) {
      res.status(404).json({ message: 'Erreur mise à jour colonne' })
      return
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /columns/:id
 * Supprimer une colonne. Seuls les membres du workspace parent peuvent supprimer.
 */
export const deleteColumn: RequestHandler = async (req, res, next) => {
  try {
    const { id: columnId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!

    // Récupérer la colonne
    const column = await columnService.getColumnById(columnId)
    if (!column) {
      res.status(404).json({ message: 'Column non trouvée' })
      return
    }

    // Récupérer le board parent
    const board = await boardService.getBoardById(column.boardId)
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

    // Supprimer la colonne
    await columnService.removeColumn(columnId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
