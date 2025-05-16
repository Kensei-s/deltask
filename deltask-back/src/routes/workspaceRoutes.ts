// src/routes/workspaceRoutes.ts
import { Router } from 'express'
import { authenticateToken } from '../middleware/authMiddleware'
import {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
} from '../controllers/workspaceController'

const router = Router()

// Middleware auth appliqué à **toutes** les routes /workspaces
router.use(authenticateToken)

router.post('/', createWorkspace)
router.get('/', listWorkspaces)
router.get('/:id', getWorkspace)
router.put('/:id', updateWorkspace)
router.delete('/:id', deleteWorkspace)
router.post('/:id/members', addWorkspaceMember)
// DELETE /workspaces/:id/members/:memberId
router.delete('/:id/members/:memberId', removeWorkspaceMember)

export default router
