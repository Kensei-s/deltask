// src/models/columnModel.ts

export interface Column {
  id: string
  title: string
  boardId: string
  order: number
}

// Stockage en mémoire
const columns: Column[] = []

function generateId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

/**
 * Crée une colonne dans un board.
 * Si aucun ordre n’est fourni, on positionne la colonne à la fin (max(order)+1).
 */
export async function createColumn(data: {
  title: string
  boardId: string
  order?: number
}): Promise<Column> {
  // Calculer l’ordre si non spécifié
  let nextOrder: number
  if (typeof data.order === 'number') {
    nextOrder = data.order
  } else {
    const boardCols = columns.filter(c => c.boardId === data.boardId)
    nextOrder = boardCols.length > 0
      ? Math.max(...boardCols.map(c => c.order)) + 1
      : 0
  }

  const newCol: Column = {
    id: generateId(),
    title: data.title,
    boardId: data.boardId,
    order: nextOrder,
  }
  columns.push(newCol)
  return newCol
}

/**
 * Récupère toutes les colonnes d’un board, triées par ordre croissant.
 */
export async function findAllByBoard(boardId: string): Promise<Column[]> {
  return columns
    .filter(c => c.boardId === boardId)
    .sort((a, b) => a.order - b.order)
}

/**
 * Récupère une colonne par son ID.
 */
export async function findById(id: string): Promise<Column | null> {
  return columns.find(c => c.id === id) ?? null
}

/**
 * Met à jour le titre et/ou l’ordre d’une colonne.
 * Si l’ordre change, il appartiendra au caller d’ajuster (ex. renuméroter d’autres colonnes si besoin).
 */
export async function updateColumn(
  id: string,
  data: Partial<Pick<Column, 'title' | 'order'>>
): Promise<Column | null> {
  const idx = columns.findIndex(c => c.id === id)
  if (idx === -1) return null
  columns[idx] = { ...columns[idx], ...data }
  return columns[idx]
}

/**
 * Supprime une colonne.
 */
export async function deleteColumn(id: string): Promise<boolean> {
  const idx = columns.findIndex(c => c.id === id)
  if (idx === -1) return false
  columns.splice(idx, 1)
  return true
}
