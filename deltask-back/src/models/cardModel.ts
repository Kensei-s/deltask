// src/models/cardModel.ts

export interface ChecklistItem {
  title: string
  checked: boolean
}

export interface Card {
  id: string
  title: string
  description: string
  columnId: string
  boardId: string
  order: number
  tags: string[]
  dueDate: string | null // stocké en ISO string
  assignedTo: string | null
  checklist: ChecklistItem[]
}

const cards: Card[] = []

function generateId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

/**
 * Crée une carte dans une colonne.
 * - la carte hérite du boardId fourni.
 * - Si order non fourni, on la place en fin (max(order)+1).
 */
export async function createCard(data: {
  title: string
  description?: string
  columnId: string
  boardId: string
  order?: number
  tags?: string[]
  dueDate?: string | null
  assignedTo?: string | null
  checklist?: ChecklistItem[]
}): Promise<Card> {
  // Calculer order si non spécifié
  let nextOrder: number
  if (typeof data.order === 'number') {
    nextOrder = data.order
  } else {
    const colCards = cards.filter(c => c.columnId === data.columnId)
    nextOrder = colCards.length > 0
      ? Math.max(...colCards.map(c => c.order)) + 1
      : 0
  }

  const newCard: Card = {
    id: generateId(),
    title: data.title,
    description: data.description ?? '',
    columnId: data.columnId,
    boardId: data.boardId,
    order: nextOrder,
    tags: data.tags ?? [],
    dueDate: data.dueDate ?? null,
    assignedTo: data.assignedTo ?? null,
    checklist: data.checklist ?? [],
  }
  cards.push(newCard)
  return newCard
}

/**
 * Récupère toutes les cartes d’une colonne, triées par ordre croissant.
 */
export async function findAllByColumn(columnId: string): Promise<Card[]> {
  return cards
    .filter(c => c.columnId === columnId)
    .sort((a, b) => a.order - b.order)
}

/**
 * Récupère une carte par son ID.
 */
export async function findById(id: string): Promise<Card | null> {
  return cards.find(c => c.id === id) ?? null
}

/**
 * Met à jour une carte.
 * On peut mettre à jour : title, description, order, tags, dueDate, assignedTo, checklist.
 * On ne change pas columnId ni boardId.
 */
export async function updateCard(
  id: string,
  data: Partial<Pick<Card, 'title' | 'description' | 'order' | 'tags' | 'dueDate' | 'assignedTo' | 'checklist'>>
): Promise<Card | null> {
  const idx = cards.findIndex(c => c.id === id)
  if (idx === -1) return null
  cards[idx] = { ...cards[idx], ...data }
  return cards[idx]
}

/**
 * Supprime une carte.
 */
export async function deleteCard(id: string): Promise<boolean> {
  const idx = cards.findIndex(c => c.id === id)
  if (idx === -1) return false
  cards.splice(idx, 1)
  return true
}
