// src/pages/WorkspaceDetail.tsx
import { Fragment, useEffect, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import { useAuth } from '../context/AuthContext'

interface Workspace {
  id: string
  name: string
  owner: string
  members: string[]
}

interface Board {
  id: string
  title: string
  workspace: string
  createdBy: string
}

export default function WorkspaceDetail() {
  const { id: workspaceId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token, loading: authLoading } = useAuth()
  const API = import.meta.env.VITE_API_URL

  // États pour le workspace
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loadingWs, setLoadingWs] = useState(true)

  // États pour la gestion des membres (existant)
  const [emailToAdd, setEmailToAdd] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [updatingName, setUpdatingName] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState('')

  // États pour les boards
  const [boards, setBoards] = useState<Board[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)

  // Modal création de board
  const [isOpen, setIsOpen] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  // Edition inline du titre d’un board
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editBoardTitle, setEditBoardTitle] = useState('')
  const [editError, setEditError] = useState<{ [key: string]: string }>({})
  const [updatingBoardId, setUpdatingBoardId] = useState<string | null>(null)

  // Suppression d’un board
  const [removingBoardId, setRemovingBoardId] = useState<string | null>(null)
  const [removeBoardError, setRemoveBoardError] = useState<{ [key: string]: string }>({})

  // Chargement du workspace
  useEffect(() => {
    if (!workspaceId) return
    setLoadingWs(true)
    fetch(`${API}/workspaces/${workspaceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Workspace non trouvé')
        return res.json()
      })
      .then(ws => {
        setWorkspace(ws)
        setNameInput(ws.name)
      })
      .catch(() => setWorkspace(null))
      .finally(() => setLoadingWs(false))
  }, [workspaceId, API, token])

  // Chargement des boards
  useEffect(() => {
    if (!workspaceId) return
    setLoadingBoards(true)
    fetch(`${API}/workspaces/${workspaceId}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Erreur récupération boards')
        return res.json()
      })
      .then((list: Board[]) => setBoards(list))
      .catch(() => setBoards([]))
      .finally(() => setLoadingBoards(false))
  }, [workspaceId, API, token])

  // Redirections / loaders
  if (authLoading || loadingWs || loadingBoards) return <p>Chargement…</p>
  if (!user) return <Navigate to="/login" replace />
  if (!workspace) return <p className="p-4 text-red-600">Workspace non trouvé</p>
  if (!workspace.members.includes(user.id)) {
    return <p className="p-4 text-red-600">Accès interdit : non-membre du workspace</p>
  }

  // Ajout de membre (identique à l’existant)
  const handleAddMember = async () => {
    if (!emailToAdd.trim()) {
      setAddError('Email requis')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`${API}/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailToAdd.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setAddError(body.message || 'Erreur lors de l’ajout')
      } else {
        setWorkspace(body)
        setEmailToAdd('')
        setAddError('')
      }
    } catch {
      setAddError('Erreur réseau')
    } finally {
      setAdding(false)
    }
  }

  // Mise à jour du nom (identique)
  const handleUpdateName = async () => {
    if (!nameInput.trim()) {
      setUpdateError('Le nom ne peut pas être vide')
      return
    }
    setUpdatingName(true)
    try {
      const res = await fetch(`${API}/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setUpdateError(body.message || 'Erreur de mise à jour')
      } else {
        setWorkspace(body)
        setIsEditingName(false)
      }
    } catch {
      setUpdateError('Erreur réseau')
    } finally {
      setUpdatingName(false)
    }
  }

  // Suppression de membre (identique)
  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Supprimer ce membre ?')) return
    setRemovingId(memberId)
    try {
      const res = await fetch(`${API}/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204) {
        setWorkspace(ws =>
          ws ? { ...ws, members: ws.members.filter(m => m !== memberId) } : ws
        )
      } else {
        const body = await res.json()
        setRemoveError(body.message || 'Erreur de suppression')
      }
    } catch {
      setRemoveError('Erreur réseau')
    } finally {
      setRemovingId(null)
    }
  }

  // --- Partie Boards ---

  // Création d’un board
  const openModal = () => {
    setIsOpen(true)
    setNewBoardTitle('')
    setCreateError('')
  }
  const closeModal = () => {
    if (!creating) {
      setIsOpen(false)
      setNewBoardTitle('')
      setCreateError('')
    }
  }
  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) {
      setCreateError('Le titre est requis')
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${API}/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newBoardTitle.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setCreateError(body.message || 'Erreur création board')
      } else {
        setBoards(prev => [...prev, body])
        closeModal()
      }
    } catch {
      setCreateError('Erreur réseau')
    } finally {
      setCreating(false)
    }
  }

  // Suppression d’un board
  const handleDeleteBoard = async (board: Board) => {
    if (board.createdBy !== user.id && workspace.owner !== user.id) {
      setRemoveBoardError(prev => ({ ...prev, [board.id]: 'Pas autorisé' }))
      return
    }
    if (!window.confirm('Confirmer suppression du board ?')) return

    setRemovingBoardId(board.id)
    try {
      const res = await fetch(`${API}/boards/${board.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204) {
        setBoards(prev => prev.filter(b => b.id !== board.id))
      } else {
        const body = await res.json()
        setRemoveBoardError(prev => ({
          ...prev,
          [board.id]: body.message || 'Erreur suppression',
        }))
      }
    } catch {
      setRemoveBoardError(prev => ({ ...prev, [board.id]: 'Erreur réseau' }))
    } finally {
      setRemovingBoardId(null)
    }
  }

  // Démarrer l’édition inline d’un board
  const startEditBoard = (b: Board) => {
    setEditingBoardId(b.id)
    setEditBoardTitle(b.title)
    setEditError({})
  }
  const cancelEditBoard = () => {
    setEditingBoardId(null)
    setEditBoardTitle('')
    setEditError({})
  }
  const handleUpdateBoard = async (board: Board) => {
    if (!editBoardTitle.trim()) {
      setEditError(prev => ({ ...prev, [board.id]: 'Le titre ne peut pas être vide' }))
      return
    }
    if (board.createdBy !== user.id) {
      setEditError(prev => ({ ...prev, [board.id]: 'Pas autorisé' }))
      return
    }
    setUpdatingBoardId(board.id)
    try {
      const res = await fetch(`${API}/boards/${board.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editBoardTitle.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setEditError(prev => ({ ...prev, [board.id]: body.message || 'Erreur mise à jour' }))
      } else {
        setBoards(prev =>
          prev.map(b => (b.id === board.id ? { ...b, title: body.title } : b))
        )
        cancelEditBoard()
      }
    } catch {
      setEditError(prev => ({ ...prev, [board.id]: 'Erreur réseau' }))
    } finally {
      setUpdatingBoardId(null)
    }
  }

  return (
    <div className="container mx-auto p-4">
      {/* Nom du Workspace et édition */}
      <div className="flex items-center mb-4">
        {isEditingName ? (
          <>
            <input
              value={nameInput}
              onChange={e => {
                setNameInput(e.target.value)
                setUpdateError('')
              }}
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring"
              disabled={updatingName}
            />
            <button
              onClick={handleUpdateName}
              disabled={updatingName}
              className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {updatingName ? '…' : 'Enregistrer'}
            </button>
            <button
              onClick={() => {
                setIsEditingName(false)
                setNameInput(workspace.name)
                setUpdateError('')
              }}
              disabled={updatingName}
              className="ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Annuler
            </button>
            {updateError && (
              <p className="text-red-500 text-sm mt-1 ml-4">{updateError}</p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold flex-1">{workspace.name}</h1>
            {user.id === workspace.owner && (
              <button
                onClick={() => setIsEditingName(true)}
                className="ml-4 px-3 py-1 border rounded"
              >
                Modifier
              </button>
            )}
          </>
        )}
      </div>

      <p className="mb-2">
        <strong>Propriétaire :</strong> {workspace.owner}
      </p>

      {/* Liste des membres & suppression */}
      <div className="mb-6">
        <strong>Membres :</strong>
        <ul className="mt-2 space-y-1">
          {workspace.members.map(memberId => (
            <li key={memberId} className="flex items-center">
              <span className="flex-1">{memberId}</span>
              {user.id === workspace.owner && memberId !== workspace.owner && (
                <button
                  onClick={() => handleRemoveMember(memberId)}
                  disabled={removingId === memberId}
                  className="ml-2 text-red-600 hover:underline text-sm"
                >
                  {removingId === memberId ? '…' : 'Retirer'}
                </button>
              )}
            </li>
          ))}
        </ul>
        {removeError && <p className="text-red-500 text-sm mt-1">{removeError}</p>}
      </div>

      {/* Formulaire d’ajout de membre */}
      {user.id === workspace.owner && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Ajouter un membre</h2>
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Email du membre"
              value={emailToAdd}
              onChange={e => {
                setEmailToAdd(e.target.value)
                setAddError('')
              }}
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring"
              disabled={adding}
            />
            <button
              onClick={handleAddMember}
              disabled={adding}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {adding ? '…' : 'Ajouter'}
            </button>
          </div>
          {addError && <p className="text-red-500 text-sm mt-1">{addError}</p>}
        </div>
      )}

      {/* --- Section Boards --- */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Boards</h2>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          Nouveau board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center text-gray-500 mb-6">
          <p>Aucun board pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {boards.map(board => (
            <div
              key={board.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition"
            >
              {editingBoardId === board.id ? (
                <div>
                  <input
                    value={editBoardTitle}
                    onChange={e => {
                      setEditBoardTitle(e.target.value)
                      setEditError(prev => ({ ...prev, [board.id]: '' }))
                    }}
                    className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring"
                    disabled={updatingBoardId === board.id}
                  />
                  {editError[board.id] && (
                    <p className="text-red-500 text-sm mb-2">{editError[board.id]}</p>
                  )}
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => handleUpdateBoard(board)}
                      disabled={updatingBoardId === board.id}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      {updatingBoardId === board.id ? '…' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={cancelEditBoard}
                      disabled={updatingBoardId === board.id}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3
                    onClick={() => navigate(`/board/${board.id}`)}
                    className="text-xl font-medium mb-2 cursor-pointer hover:underline"
                  >
                    {board.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Créé&nbsp;par&nbsp;
                    {board.createdBy === workspace.owner
                      ? 'owner'
                      : board.createdBy === user.id
                      ? 'moi'
                      : board.createdBy}
                  </p>
                  <div className="flex justify-between items-center">
                    {board.createdBy === user.id && (
                      <button
                        onClick={() => startEditBoard(board)}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Modifier
                      </button>
                    )}
                    {(board.createdBy === user.id || workspace.owner === user.id) && (
                      <button
                        onClick={() => handleDeleteBoard(board)}
                        disabled={removingBoardId === board.id}
                        className="text-red-600 hover:underline text-sm"
                      >
                        {removingBoardId === board.id ? '…' : 'Supprimer'}
                      </button>
                    )}
                  </div>
                  {removeBoardError[board.id] && (
                    <p className="text-red-500 text-sm mt-1">{removeBoardError[board.id]}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal HeadlessUI pour créer un board */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closeModal}>
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
                  Nouveau board
                </Dialog.Title>

                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={e => {
                    setNewBoardTitle(e.target.value)
                    setCreateError('')
                  }}
                  placeholder="Titre du board"
                  className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring"
                />
                {createError && <p className="text-red-500 text-sm mb-2">{createError}</p>}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={closeModal}
                    disabled={creating}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateBoard}
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    {creating ? 'Création…' : 'Créer'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
