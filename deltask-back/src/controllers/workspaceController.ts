// src/controllers/workspaceController.ts
import { RequestHandler } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as workspaceService from '../services/workspaceService'
import * as userModel from '../models/userModel'

// POST /workspaces
export const createWorkspace: RequestHandler = async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) {
      res.status(400).json({ message: 'Le nom est requis' })
      return
    }
    const authReq = req as AuthRequest
    const ownerId = authReq.user?.id
    if (!ownerId) {
      res.status(401).json({ message: 'Non authentifié' })
      return
    }
    const ws = await workspaceService.create(name, ownerId)
    res.status(201).json(ws)
  } catch (err) {
    next(err)
  }
}

// GET /workspaces
export const listWorkspaces: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!
    const all = await workspaceService.listForUser(userId)
    res.json(all)
  } catch (err) {
    next(err)
  }
}

// GET /workspaces/:id
export const getWorkspace: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const ws = await workspaceService.getById(id)
    if (!ws) {
      res.status(404).json({ message: 'Workspace non trouvé' })
      return
    }
    res.json(ws)
  } catch (err) {
    next(err)
  }
}

// PUT /workspaces/:id
export const updateWorkspace: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name } = req.body
    if (!name) {
      res.status(400).json({ message: 'Le nom est requis' })
      return
    }
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!
    const ws = await workspaceService.getById(id)
    if (!ws) {
      res.status(404).json({ message: 'Workspace non trouvé' })
      return
    }
    if (ws.owner !== userId) {
      res.status(403).json({ message: 'Accès interdit' })
      return
    }
    const updated = await workspaceService.updateName(id, name)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// DELETE /workspaces/:id
export const deleteWorkspace: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id!
    const ws = await workspaceService.getById(id)
    if (!ws) {
      res.status(404).json({ message: 'Workspace non trouvé' })
      return
    }
    if (ws.owner !== userId) {
      res.status(403).json({ message: 'Accès interdit' })
      return
    }
    await workspaceService.remove(id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
/**
 * POST /workspaces/:id/members
 * Body: { email: string }
 * Seul l’owner peut ajouter des membres.
 */
export const addWorkspaceMember: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { email } = req.body
    if (!email) {
      res.status(400).json({ message: 'Email du membre requis' })
      return
    }

    // 1. On récupère le user à ajouter
    const member = await userModel.findByEmail(email)
    if (!member) {
      res.status(404).json({ message: 'Utilisateur non trouvé' })
      return
    }

    // 2. Vérifier que c’est bien l’owner qui appelle
    const authReq = req as AuthRequest
    const callerId = authReq.user?.id
    const ws = await workspaceService.getById(id)
    if (!ws) {
      res.status(404).json({ message: 'Workspace non trouvé' })
      return
    }
    if (ws.owner !== callerId) {
      res.status(403).json({ message: 'Seul le propriétaire peut ajouter des membres' })
      return
    }

    // 3. On ajoute le membre
    const updated = await workspaceService.addMember(id, member.id)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /workspaces/:id/members/:memberId
 * Seul l’owner peut retirer un membre.
 */
export const removeWorkspaceMember: RequestHandler = async (req, res, next) => {
  try {
    const { id: workspaceId, memberId } = req.params
    const authReq = req as AuthRequest
    const callerId = authReq.user?.id

    // 1. Vérifier l’existence du workspace
    const ws = await workspaceService.getById(workspaceId)
    if (!ws) {
      res.status(404).json({ message: 'Workspace non trouvé' })
      return
    }

    // 2. Vérifier que c’est bien l’owner qui appelle
    if (ws.owner !== callerId) {
      res.status(403).json({ message: 'Seul le propriétaire peut retirer des membres' })
      return
    }

    // 3. Supprimer le membre
    const updated = await workspaceService.removeMember(workspaceId, memberId)
    if (!updated) {
      res.status(404).json({ message: 'Membre non trouvé' })
      return
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
}
