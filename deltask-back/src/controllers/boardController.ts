// src/controllers/boardController.ts
import { RequestHandler } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as boardService from '../services/boardService'
import * as workspaceService from '../services/workspaceService'

/**
 * POST /workspaces/:id/boards
 * Créer un board dans le workspace : seul un membre peut créer
 */
export const createBoardInWorkspace: RequestHandler = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params
    const { title } = req.body
    if (!title) {
      res.status(400).json({ message: 'Le titre est requis' })
      return
    }

    // 1. Récupérer l'ID utilisateur depuis le token
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Non authentifié' })
      return
    }

    // 2. Vérifier que le workspace existe et que l'utilisateur en est membre
    const ws = await workspaceService.getById(workspaceId)
    if (!ws) {
      res.status(404).json({ message: 'Workspace non trouvé' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    // 3. Créer le board
    const board = await boardService.createBoard(title, workspaceId, userId)
    res.status(201).json(board)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /workspaces/:id/boards
 * Lister tous les boards d’un workspace : seul un membre peut les voir
 */
export const listBoardsInWorkspace: RequestHandler = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!
    
    // Vérifier workspace et appartenance
    const ws = await workspaceService.getById(workspaceId)
    if (!ws) {
      res.status(404).json({ message: 'Workspace non trouvé' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    // Récupérer la liste des boards
    const boards = await boardService.listBoards(workspaceId)
    res.json(boards)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /boards/:id
 * Détail d’un board : seul un membre du workspace parent peut voir
 */
export const getBoardDetail: RequestHandler = async (req, res, next) => {
  try {
    const { id: boardId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!

    // 1. Récupérer le board
    const board = await boardService.getBoardById(boardId)
    if (!board) {
      res.status(404).json({ message: 'Board non trouvé' })
      return
    }

    // 2. Vérifier que l'utilisateur est membre du workspace parent
    const ws = await workspaceService.getById(board.workspace)
    if (!ws) {
      res.status(404).json({ message: 'Workspace parent introuvable' })
      return
    }
    if (!ws.members.includes(userId)) {
      res.status(403).json({ message: 'Accès interdit : non-membre du workspace' })
      return
    }

    res.json(board)
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /boards/:id
 * Mettre à jour le titre d’un board : seul le créateur peut modifier
 */
export const updateBoard: RequestHandler = async (req, res, next) => {
  try {
    const { id: boardId } = req.params
    const { title } = req.body
    if (!title) {
      res.status(400).json({ message: 'Le titre est requis' })
      return
    }

    const authReq = req as AuthRequest
    const userId = authReq.user?.id!

    // 1. Récupérer le board
    const board = await boardService.getBoardById(boardId)
    if (!board) {
      res.status(404).json({ message: 'Board non trouvé' })
      return
    }

    // 2. Vérifier que l'utilisateur est bien celui qui a créé le board
    if (board.createdBy !== userId) {
      res.status(403).json({ message: 'Accès interdit : seul le créateur peut modifier' })
      return
    }

    // 3. Modifier
    const updated = await boardService.updateBoard(boardId, title)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /boards/:id
 * Supprimer un board : seul le créateur ou le propriétaire du workspace peut supprimer
 */
export const deleteBoard: RequestHandler = async (req, res, next) => {
  try {
    const { id: boardId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!

    // 1. Récupérer le board
    const board = await boardService.getBoardById(boardId)
    if (!board) {
      res.status(404).json({ message: 'Board non trouvé' })
      return
    }

    // 2. Récupérer le workspace parent pour vérifier si user est owner ou créateur
    const ws = await workspaceService.getById(board.workspace)
    if (!ws) {
      res.status(404).json({ message: 'Workspace parent introuvable' })
      return
    }

    // 3. Vérifier droits : soit le créateur du board, soit l’owner du workspace
    if (board.createdBy !== userId && ws.owner !== userId) {
      res.status(403).json({ message: 'Accès interdit : seul le créateur ou l’owner peut supprimer' })
      return
    }

    // 4. Suppression
    await boardService.removeBoard(boardId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
