// src/models/boardModel.ts

export interface Board {
  id: string
  title: string
  workspace: string
  createdBy: string
}

// Tableau en mémoire pour stocker les boards
const boards: Board[] = []

// Générateur d'ID simple (timestamp + random)
function generateId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

/**
 * Crée un nouveau Board
 */
export async function createBoard(data: {
  title: string
  workspace: string
  createdBy: string
}): Promise<Board> {
  const newBoard: Board = {
    id: generateId(),
    title: data.title,
    workspace: data.workspace,
    createdBy: data.createdBy,
  }
  boards.push(newBoard)
  return newBoard
}

/**
 * Récupère tous les boards pour un workspace donné
 */
export async function findAllByWorkspace(workspaceId: string): Promise<Board[]> {
  return boards.filter(b => b.workspace === workspaceId)
}

/**
 * Récupère un board par son ID
 */
export async function findById(id: string): Promise<Board | null> {
  return boards.find(b => b.id === id) ?? null
}

/**
 * Met à jour le titre d'un board
 */
export async function updateBoard(
  id: string,
  data: { title: string }
): Promise<Board | null> {
  const idx = boards.findIndex(b => b.id === id)
  if (idx === -1) return null
  boards[idx].title = data.title
  return boards[idx]
}

/**
 * Supprime un board
 */
export async function deleteBoard(id: string): Promise<boolean> {
  const idx = boards.findIndex(b => b.id === id)
  if (idx === -1) return false
  boards.splice(idx, 1)
  return true
}
