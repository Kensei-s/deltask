// src/services/cardService.ts
import * as cardModel from '../models/cardModel'
import { Card, ChecklistItem } from '../models/cardModel'

/** Créer une carte */
export async function createCard(
  title: string,
  description: string,
  columnId: string,
  boardId: string,
  order?: number,
  tags?: string[],
  dueDate?: string | null,
  assignedTo?: string | null,
  checklist?: ChecklistItem[]
): Promise<Card> {
  return cardModel.createCard({
    title,
    description,
    columnId,
    boardId,
    order,
    tags,
    dueDate,
    assignedTo,
    checklist,
  })
}

/** Lister toutes les cartes d’une colonne */
export async function listCards(columnId: string): Promise<Card[]> {
  return cardModel.findAllByColumn(columnId)
}

/** Récupérer une carte par ID */
export async function getCardById(id: string): Promise<Card | null> {
  return cardModel.findById(id)
}

/** Mettre à jour une carte */
export async function updateCard(
  id: string,
  data: Partial<Pick<Card, 'title' | 'description' | 'order' | 'tags' | 'dueDate' | 'assignedTo' | 'checklist'>>
): Promise<Card | null> {
  return cardModel.updateCard(id, data)
}

/** Supprimer une carte */
export async function removeCard(id: string): Promise<boolean> {
  return cardModel.deleteCard(id)
}
