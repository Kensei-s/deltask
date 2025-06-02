// src/services/boardService.ts
import * as boardModel from '../models/boardModel'
import { Board } from '../models/boardModel'

/** Créer un board */
export async function createBoard(
  title: string,
  workspaceId: string,
  createdBy: string
): Promise<Board> {
  return boardModel.createBoard({ title, workspace: workspaceId, createdBy })
}

/** Lister tous les boards d'un workspace */
export async function listBoards(workspaceId: string): Promise<Board[]> {
  return boardModel.findAllByWorkspace(workspaceId)
}

/** Récupérer un board par ID */
export async function getBoardById(id: string): Promise<Board | null> {
  return boardModel.findById(id)
}

/** Mettre à jour un board */
export async function updateBoard(
  id: string,
  title: string
): Promise<Board | null> {
  return boardModel.updateBoard(id, { title })
}

/** Supprimer un board */
export async function removeBoard(id: string): Promise<boolean> {
  return boardModel.deleteBoard(id)
}
