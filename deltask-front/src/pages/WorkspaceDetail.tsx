// src/pages/WorkspaceDetail.tsx
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

interface Workspace {
  id: string
  name: string
  owner: string
  members: string[]
}

export default function WorkspaceDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, token, loading } = useAuth()
  const API = import.meta.env.VITE_API_URL

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loadingWs, setLoadingWs] = useState(true)

  // États pour l'ajout de membre
  const [emailToAdd, setEmailToAdd] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  // États pour l'édition du nom
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [updatingName, setUpdatingName] = useState(false)

  // États pour la suppression de membre
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState('')

  // Chargement du workspace
  useEffect(() => {
    if (!id) return
    setLoadingWs(true)
    fetch(`${API}/workspaces/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(ws => {
        setWorkspace(ws)
        setNameInput(ws.name)
      })
      .catch(() => setWorkspace(null))
      .finally(() => setLoadingWs(false))
  }, [API, id, token])

  // Redirections / loaders
  if (loading || loadingWs) return <p>Chargement…</p>
  if (!user) return <Navigate to="/login" replace />
  if (!workspace) return <p>Workspace non trouvé</p>

  // Ajout de membre (même code qu’avant)
  const handleAddMember = async () => {
    if (!emailToAdd.trim()) {
      setAddError('Email requis')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`${API}/workspaces/${id}/members`, {
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

  // Mise à jour du nom
  const handleUpdateName = async () => {
    if (!nameInput.trim()) {
      setUpdateError('Le nom ne peut pas être vide')
      return
    }
    setUpdatingName(true)
    try {
      const res = await fetch(`${API}/workspaces/${id}`, {
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

  // Suppression d’un membre
  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Supprimer ce membre ?")) return
    setRemovingId(memberId)
    try {
      const res = await fetch(
        `${API}/workspaces/${id}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.status === 204) {
        setWorkspace(ws => 
          ws
            ? { ...ws, members: ws.members.filter(m => m !== memberId) }
            : ws
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

  return (
    <div className="container mx-auto p-4">
      {/* Nom et édition */}
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
            <h1 className="text-3xl font-semibold flex-1">
              {workspace.name}
            </h1>
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
        {removeError && (
          <p className="text-red-500 text-sm mt-1">{removeError}</p>
        )}
      </div>

      {/* Formulaire d'ajout de membre */}
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
    </div>
  )
}
