// src/pages/Dashboard.tsx
import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Workspace {
  id: string
  name: string
  owner: string
  members: string[]
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const API = import.meta.env.VITE_API_URL

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API}/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const list: Workspace[] = await res.json()
          setWorkspaces(list)
        }
      } catch {
        // tu peux gérer une erreur réseau ici
      } finally {
        setLoading(false)
      }
    }
    fetchWorkspaces()
  }, [API, token])

  // Créer un workspace
  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Le nom est requis')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const ws: Workspace = await res.json()
        setWorkspaces(prev => [...prev, ws])
        setIsOpen(false)
        setNewName('')
        setError('')
      } else {
        const body = await res.json()
        setError(body.message || 'Erreur lors de la création')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  // Supprimer un workspace
  const handleDelete = async (id: string) => {
    if (!window.confirm("Confirmer la suppression ?")) return
    try {
      const res = await fetch(`${API}/workspaces/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204) {
        setWorkspaces(prev => prev.filter(w => w.id !== id))
      }
    } catch {
      // gérer l'erreur si besoin
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Mes Workspaces</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          Nouveau workspace
        </button>
      </div>

      {/* Loader */}
      {loading && <p>Chargement des workspaces…</p>}

      {/* Empty state */}
      {!loading && workspaces.length === 0 && (
        <div className="text-center text-gray-500">
          <p>Aucun workspace pour le moment.</p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Créer un workspace
          </button>
        </div>
      )}

      {/* Liste */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading &&
          workspaces.map(ws => (
            <div
              key={ws.id}
              onClick={() => navigate(`/workspaces/${ws.id}`)}
              className="cursor-pointer p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition"
            >
              <h2 className="text-xl font-medium mb-2">{ws.name}</h2>
              <p className="text-sm text-gray-500">
                {ws.members.length} membre{ws.members.length > 1 ? 's' : ''}
              </p>
              {/* Delete uniquement pour l'owner */}
              {user?.id === ws.owner && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleDelete(ws.id)
                  }}
                  className="mt-4 text-red-600 hover:underline text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}
      </div>

      <Transition appear show={isOpen} as={Fragment}>
  <Dialog
    as="div"
    className="fixed inset-0 z-50 overflow-y-auto"
    onClose={() => {
      if (!submitting) {
        setIsOpen(false)
        setNewName('')
        setError('')
      }
    }}
  >
    <div className="flex items-center justify-center min-h-screen px-4 text-center">
      {/* Overlay en fond */}
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

      {/* Hack de centrage vertical */}
      <span className="inline-block h-screen align-middle" aria-hidden="true">
        &#8203;
      </span>

      {/* Le panel au-dessus de l’overlay */}
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
            Nouveau workspace
          </Dialog.Title>

          <input
            type="text"
            value={newName}
            onChange={e => {
              setNewName(e.target.value)
              setError('')
            }}
            placeholder="Nom du workspace"
            className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring"
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsOpen(false)
                setNewName('')
                setError('')
              }}
              disabled={submitting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {submitting ? 'Création…' : 'Créer'}
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
