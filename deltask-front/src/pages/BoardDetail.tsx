// src/pages/BoardDetail.tsx
import { Fragment, useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Dialog, Transition } from '@headlessui/react'
import { useAuth } from '../context/AuthContext'

interface Column {
  id: string
  title: string
  boardId: string
  order: number
}

interface Card {
  id: string
  title: string
  description: string
  columnId: string
  boardId: string
  order: number
  tags: string[]
  dueDate: string | null
  assignedTo: string | null
  checklist: { title: string; checked: boolean }[]
}

interface Board {
  id: string
  title: string
  workspace: string
  createdBy: string
}

export default function BoardDetail() {
  const { id: boardId } = useParams<{ id: string }>()
  const { user, token, loading: authLoading } = useAuth()
  const API = import.meta.env.VITE_API_URL

  // ─── Board ─────────────────────────────────────────────────────────────────────
  const [board, setBoard] = useState<Board | null>(null)
  const [loadingBoard, setLoadingBoard] = useState(true)

  // ─── Colonnes ──────────────────────────────────────────────────────────────────
  const [columns, setColumns] = useState<Column[]>([])
  const [loadingCols, setLoadingCols] = useState(true)

  // ─── Cartes par colonne ─────────────────────────────────────────────────────────
  const [cardsByColumn, setCardsByColumn] = useState<Record<string, Card[]>>({})
  const [loadingCards, setLoadingCards] = useState(true)

  // ─── Modal « Ajouter une colonne » ─────────────────────────────────────────────
  const [isOpenCol, setIsOpenCol] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [createColError, setCreateColError] = useState('')
  const [creatingCol, setCreatingCol] = useState(false)

  // ─── Inline-edit colonne ─────────────────────────────────────────────────────────
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editColumnTitle, setEditColumnTitle] = useState('')
  const [editColError, setEditColError] = useState<{ [key: string]: string }>({})
  const [updatingColumnId, setUpdatingColumnId] = useState<string | null>(null)

  // ─── Suppression colonne ─────────────────────────────────────────────────────────
  const [removingColumnId, setRemovingColumnId] = useState<string | null>(null)
  const [removeColError, setRemoveColError] = useState<{ [key: string]: string }>({})

  // ─── Modal « Ajouter une carte » ────────────────────────────────────────────────
  const [openCardModalForColumn, setOpenCardModalForColumn] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [createCardError, setCreateCardError] = useState('')
  const [creatingCard, setCreatingCard] = useState(false)

  // ─── Inline-edit carte ──────────────────────────────────────────────────────────
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editCardTitle, setEditCardTitle] = useState('')
  const [editCardError, setEditCardError] = useState<{ [key: string]: string }>({})
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null)

  // ─── Suppression carte ──────────────────────────────────────────────────────────
  const [removingCardId, setRemovingCardId] = useState<string | null>(null)
  const [removeCardError, setRemoveCardError] = useState<{ [key: string]: string }>({})

  // ─── Chargement du board ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return
    setLoadingBoard(true)
    fetch(`${API}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Board non trouvé')
        return res.json()
      })
      .then((b: Board) => setBoard(b))
      .catch(() => setBoard(null))
      .finally(() => setLoadingBoard(false))
  }, [boardId, API, token])

  // ─── Chargement des colonnes ────────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return
    setLoadingCols(true)
    fetch(`${API}/boards/${boardId}/columns`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Erreur récupération colonnes')
        return res.json() as Promise<Column[]>
      })
      .then(list => setColumns(list))
      .catch(() => setColumns([]))
      .finally(() => setLoadingCols(false))
  }, [boardId, API, token])

  // ─── Chargement des cartes pour chaque colonne ─────────────────────────────────
  useEffect(() => {
    if (columns.length === 0) {
      setCardsByColumn({})
      setLoadingCards(false)
      return
    }
    setLoadingCards(true)
    const fetches = columns.map(col =>
      fetch(`${API}/columns/${col.id}/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Erreur récupération cartes')
          return res.json() as Promise<Card[]>
        })
        .then(cards => ({ columnId: col.id, cards }))
        .catch(() => ({ columnId: col.id, cards: [] }))
    )
    Promise.all(fetches).then(results => {
      const map: Record<string, Card[]> = {}
      results.forEach(r => (map[r.columnId] = r.cards))
      setCardsByColumn(map)
      setLoadingCards(false)
    })
  }, [columns, API, token])

  // ─── Redirections / loaders ─────────────────────────────────────────────────────
  if (authLoading || loadingBoard || loadingCols || loadingCards) return <p>Chargement…</p>
  if (!user) return <Navigate to="/login" replace />
  if (!board) return <p className="p-4 text-red-600">Board non trouvé</p>

  // ─── Sensors pour @dnd-kit ──────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ─── Gérer la fin de drag pour les colonnes ─────────────────────────────────────
  const handleColumnDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = columns.findIndex(c => c.id === active.id)
    const newIndex = columns.findIndex(c => c.id === over.id)
    const reordered = arrayMove(columns, oldIndex, newIndex)
    setColumns(reordered)

    try {
      await Promise.all(
        reordered.map((col, idx) =>
          fetch(`${API}/columns/${col.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order: idx }),
          })
        )
      )
    } catch {
      // En cas d’erreur, on pourrait recharger depuis le serveur
    }
  }

  // ─── Gérer la fin de drag pour les cartes ────────────────────────────────────────
  const handleCardDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const [activeColId, activeCardId] = (active.id as string).split(':')
    const [overColId, overCardId] = (over.id as string).split(':')

    const sourceCards = Array.from(cardsByColumn[activeColId] || [])
    const movedIndex = sourceCards.findIndex(c => c.id === activeCardId)
    const movedCard = sourceCards.splice(movedIndex, 1)[0]

    if (activeColId === overColId) {
      // Réordonner dans la même colonne
      const overIndex = sourceCards.findIndex(c => c.id === overCardId)
      const newCards = arrayMove(sourceCards, movedIndex, overIndex)
      setCardsByColumn(prev => ({ ...prev, [activeColId]: newCards }))

      try {
        await Promise.all(
          newCards.map((c, idx) =>
            fetch(`${API}/cards/${c.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ order: idx }),
            })
          )
        )
      } catch {
        // …
      }
    } else {
      // Déplacer vers une autre colonne
      const destCards = Array.from(cardsByColumn[overColId] || [])
      movedCard.columnId = overColId
      const overIndex = destCards.findIndex(c => c.id === overCardId)
      destCards.splice(overIndex, 0, movedCard)

      setCardsByColumn(prev => ({
        ...prev,
        [activeColId]: sourceCards,
        [overColId]: destCards,
      }))

      try {
        const updateSource = sourceCards.map((c, idx) =>
          fetch(`${API}/cards/${c.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order: idx }),
          })
        )
        const updateDest = destCards.map((c, idx) =>
          fetch(`${API}/cards/${c.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ columnId: overColId, order: idx }),
          })
        )
        await Promise.all([...updateSource, ...updateDest])
      } catch {
        // …
      }
    }
  }

  // ─── Fonctions pour colonnes (création, édition, suppression) ─────────────────
  const openColModal = () => {
    setIsOpenCol(true)
    setNewColumnTitle('')
    setCreateColError('')
  }
  const closeColModal = () => {
    if (!creatingCol) {
      setIsOpenCol(false)
      setNewColumnTitle('')
      setCreateColError('')
    }
  }
  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) {
      setCreateColError('Le titre est requis')
      return
    }
    setCreatingCol(true)
    try {
      const res = await fetch(`${API}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newColumnTitle.trim() }),
      })
      const col: Column = await res.json()
      if (!res.ok) {
        setCreateColError((col as any).message || 'Erreur création colonne')
      } else {
        setColumns(prev => [...prev, col])
        setCardsByColumn(prev => ({ ...prev, [col.id]: [] }))
        closeColModal()
      }
    } catch {
      setCreateColError('Erreur réseau')
    } finally {
      setCreatingCol(false)
    }
  }

  const startEditColumn = (col: Column) => {
    setEditingColumnId(col.id)
    setEditColumnTitle(col.title)
    setEditColError({})
  }
  const cancelEditColumn = () => {
    setEditingColumnId(null)
    setEditColumnTitle('')
    setEditColError({})
  }
  const handleUpdateColumn = async (col: Column) => {
    if (!editColumnTitle.trim()) {
      setEditColError(prev => ({ ...prev, [col.id]: 'Le titre ne peut pas être vide' }))
      return
    }
    setUpdatingColumnId(col.id)
    try {
      const res = await fetch(`${API}/columns/${col.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editColumnTitle.trim() }),
      })
      const updated: Column = await res.json()
      if (!res.ok) {
        setEditColError(prev => ({ ...prev, [col.id]: (updated as any).message || 'Erreur mise à jour' }))
      } else {
        setColumns(prev =>
          prev.map(c => (c.id === col.id ? { ...c, title: updated.title } : c))
        )
        cancelEditColumn()
      }
    } catch {
      setEditColError(prev => ({ ...prev, [col.id]: 'Erreur réseau' }))
    } finally {
      setUpdatingColumnId(null)
    }
  }

  const handleDeleteColumn = async (col: Column) => {
    if (!window.confirm('Supprimer cette colonne ?')) return
    setRemovingColumnId(col.id)
    try {
      const res = await fetch(`${API}/columns/${col.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204) {
        setColumns(prev => prev.filter(c => c.id !== col.id))
        setCardsByColumn(prev => {
          const copy = { ...prev }
          delete copy[col.id]
          return copy
        })
      } else {
        const body = await res.json()
        setRemoveColError(prev => ({ ...prev, [col.id]: (body as any).message || 'Erreur suppression' }))
      }
    } catch {
      setRemoveColError(prev => ({ ...prev, [col.id]: 'Erreur réseau' }))
    } finally {
      setRemovingColumnId(null)
    }
  }

  // ─── Fonctions pour cartes (création, édition, suppression) ──────────────────
  const openCardModal = (columnId: string) => {
    setOpenCardModalForColumn(columnId)
    setNewCardTitle('')
    setCreateCardError('')
  }
  const closeCardModal = () => {
    if (!creatingCard) {
      setOpenCardModalForColumn(null)
      setNewCardTitle('')
      setCreateCardError('')
    }
  }
  const handleCreateCard = async () => {
    if (!newCardTitle.trim() || !openCardModalForColumn) {
      setCreateCardError('Le titre est requis')
      return
    }
    setCreatingCard(true)
    try {
      const res = await fetch(`${API}/columns/${openCardModalForColumn}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newCardTitle.trim() }),
      })
      const card: Card = await res.json()
      if (!res.ok) {
        setCreateCardError((card as any).message || 'Erreur création carte')
      } else {
        setCardsByColumn(prev => ({
          ...prev,
          [openCardModalForColumn]: [...(prev[openCardModalForColumn] || []), card],
        }))
        closeCardModal()
      }
    } catch {
      setCreateCardError('Erreur réseau')
    } finally {
      setCreatingCard(false)
    }
  }

  const startEditCard = (card: Card) => {
    setEditingCardId(card.id)
    setEditCardTitle(card.title)
    setEditCardError({})
  }
  const cancelEditCard = () => {
    setEditingCardId(null)
    setEditCardTitle('')
    setEditCardError({})
  }
  const handleUpdateCard = async (card: Card) => {
    if (!editCardTitle.trim()) {
      setEditCardError(prev => ({ ...prev, [card.id]: 'Le titre ne peut pas être vide' }))
      return
    }
    setUpdatingCardId(card.id)
    try {
      const res = await fetch(`${API}/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editCardTitle.trim() }),
      })
      const updated: Card = await res.json()
      if (!res.ok) {
        setEditCardError(prev => ({ ...prev, [card.id]: (updated as any).message || 'Erreur mise à jour' }))
      } else {
        setCardsByColumn(prev =>
          Object.fromEntries(
            Object.entries(prev).map(([colId, cards]) => [
              colId,
              cards.map(c => (c.id === card.id ? { ...c, title: updated.title } : c)),
            ])
          )
        )
        cancelEditCard()
      }
    } catch {
      setEditCardError(prev => ({ ...prev, [card.id]: 'Erreur réseau' }))
    } finally {
      setUpdatingCardId(null)
    }
  }

  const handleDeleteCard = async (card: Card) => {
    if (!window.confirm('Supprimer cette carte ?')) return
    setRemovingCardId(card.id)
    try {
      const res = await fetch(`${API}/cards/${card.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204) {
        setCardsByColumn(prev => ({
          ...prev,
          [card.columnId]: (prev[card.columnId] || []).filter(c => c.id !== card.id),
        }))
      } else {
        const body = await res.json()
        setRemoveCardError(prev => ({ ...prev, [card.id]: (body as any).message || 'Erreur suppression' }))
      }
    } catch {
      setRemoveCardError(prev => ({ ...prev, [card.id]: 'Erreur réseau' }))
    } finally {
      setRemovingCardId(null)
    }
  }

  // ─── Composant sortable pour une colonne ────────────────────────────────────────
  function SortableColumn({ column, index }: { column: Column; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: column.id,
      data: { type: 'COLUMN' },
    })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="min-w-[250px] bg-white dark:bg-gray-800 rounded-lg shadow p-2 flex-shrink-0"
      >
        <ColumnContent column={column} />
      </div>
    )
  }

  // ─── Contenu d’une colonne ──────────────────────────────────────────────────────
  function ColumnContent({ column }: { column: Column }) {
    const colCards = cardsByColumn[column.id] || []
    return (
      <div>
        {/* Titre et actions colonne */}
        <div className="flex items-center justify-between mb-2">
          {editingColumnId === column.id ? (
            <div className="flex-1">
              <input
                value={editColumnTitle}
                onChange={e => {
                  setEditColumnTitle(e.target.value)
                  setEditColError(prev => ({ ...prev, [column.id]: '' }))
                }}
                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring mb-1"
                disabled={updatingColumnId === column.id}
              />
              {editColError[column.id] && (
                <p className="text-red-500 text-sm">{editColError[column.id]}</p>
              )}
            </div>
          ) : (
            <h2 className="text-lg font-medium flex-1">{column.title}</h2>
          )}
          <div className="flex space-x-1">
            {editingColumnId === column.id ? (
              <>
                <button
                  onClick={() => handleUpdateColumn(column)}
                  disabled={updatingColumnId === column.id}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  {updatingColumnId === column.id ? '…' : 'OK'}
                </button>
                <button
                  onClick={cancelEditColumn}
                  disabled={updatingColumnId === column.id}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => startEditColumn(column)}
                  className="text-blue-500 hover:underline text-sm"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteColumn(column)}
                  disabled={removingColumnId === column.id}
                  className="text-red-600 hover:underline text-sm"
                >
                  {removingColumnId === column.id ? '…' : '🗑'}
                </button>
              </>
            )}
          </div>
        </div>
        {removeColError[column.id] && (
          <p className="text-red-500 text-sm mb-2">{removeColError[column.id]}</p>
        )}

        {/* Bouton « Ajouter une carte » */}
        <button
          onClick={() => openCardModal(column.id)}
          className="mb-2 w-full text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 text-sm"
        >
          + Carte
        </button>

        {/* Liste des cartes */}
        <SortableContext
          items={colCards.map(c => `${column.id}:${c.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {colCards.map((card, idx) => (
            <SortableCard key={card.id} card={card} index={idx} />
          ))}
        </SortableContext>
      </div>
    )
  }

  // ─── Composant sortable pour une carte ──────────────────────────────────────────
  function SortableCard({ card, index }: { card: Card; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: `${card.columnId}:${card.id}`,
      data: { type: 'CARD' },
    })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-gray-100 dark:bg-gray-700 rounded p-2 mb-2"
      >
        <CardContent card={card} />
      </div>
    )
  }

  // ─── Contenu d’une carte ────────────────────────────────────────────────────────
  function CardContent({ card }: { card: Card }) {
    return (
      <div>
        <h3 className="font-medium">{card.title}</h3>
        <div className="flex justify-between items-center mt-1 text-sm">
          <button
            onClick={() => startEditCard(card)}
            className="text-blue-500 hover:underline"
          >
            ✎
          </button>
          <button
            onClick={() => handleDeleteCard(card)}
            disabled={removingCardId === card.id}
            className="text-red-600 hover:underline"
          >
            {removingCardId === card.id ? '…' : '🗑'}
          </button>
        </div>
        {removeCardError[card.id] && (
          <p className="text-red-500 text-sm mt-1">{removeCardError[card.id]}</p>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* Titre du board */}
      <h1 className="text-3xl font-semibold mb-6">{board.title}</h1>

      {/* Modal « Ajouter une colonne » */}
      <Transition appear show={isOpenCol} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={closeColModal}
        >
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative z-10 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle bg-white dark:bg-gray-800 rounded-lg shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium mb-4">
                  Nouvelle colonne
                </Dialog.Title>

                <input
                  type="text"
                  value={newColumnTitle}
                  onChange={e => {
                    setNewColumnTitle(e.target.value)
                    setCreateColError('')
                  }}
                  placeholder="Titre de la colonne"
                  className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring"
                />
                {createColError && (
                  <p className="text-red-500 text-sm mb-2">{createColError}</p>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={closeColModal}
                    disabled={creatingCol}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateColumn}
                    disabled={creatingCol}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    {creatingCol ? 'Création…' : 'Créer'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Modal « Ajouter une carte » */}
      <Transition appear show={!!openCardModalForColumn} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={closeCardModal}
        >
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative z-10 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle bg-white dark:bg-gray-800 rounded-lg shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium mb-4">
                  Nouvelle carte
                </Dialog.Title>

                <input
                  type="text"
                  value={newCardTitle}
                  onChange={e => {
                    setNewCardTitle(e.target.value)
                    setCreateCardError('')
                  }}
                  placeholder="Titre de la carte"
                  className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring"
                />
                {createCardError && <p className="text-red-500 text-sm mb-2">{createCardError}</p>}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={closeCardModal}
                    disabled={creatingCard}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateCard}
                    disabled={creatingCard}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    {creatingCard ? 'Création…' : 'Créer'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Drag & Drop des colonnes et cartes */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={event => {
          if (event.active.data.current?.type === 'COLUMN') {
            handleColumnDragEnd(event)
          }
          if (event.active.data.current?.type === 'CARD') {
            handleCardDragEnd(event)
          }
        }}
      >
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {columns.map((col, idx) => (
              <SortableColumn key={col.id} column={col} index={idx} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
