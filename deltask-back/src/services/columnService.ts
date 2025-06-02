// src/services/columnService.ts
import * as columnModel from '../models/columnModel'
import { Column } from '../models/columnModel'

/** Créer une colonne */
export async function createColumn(
  title: string,
  boardId: string,
  order?: number
): Promise<Column> {
  return columnModel.createColumn({ title, boardId, order })
}

/** Lister toutes les colonnes d’un board */
export async function listColumns(boardId: string): Promise<Column[]> {
  return columnModel.findAllByBoard(boardId)
}

/** Récupérer une colonne par ID */
export async function getColumnById(id: string): Promise<Column | null> {
  return columnModel.findById(id)
}

/** Mettre à jour une colonne */
export async function updateColumn(
  id: string,
  data: Partial<Pick<Column, 'title' | 'order'>>
): Promise<Column | null> {
  return columnModel.updateColumn(id, data)
}

/** Supprimer une colonne */
export async function removeColumn(id: string): Promise<boolean> {
  return columnModel.deleteColumn(id)
}
