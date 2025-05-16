// src/models/workspaceModel.ts

// Interface et type
export interface Workspace {
    id: string
    name: string
    owner: string       // ID du user qui a créé l’espace
    members: string[]   // liste des IDs des membres
  }
  
  // Stockage en mémoire
  const workspaces: Workspace[] = []
  
  // Générateur d’ID simple (timestamp + random)
  function generateId(): string {
    return `${Date.now()}-${Math.round(Math.random() * 1e6)}`
  }
  
  // CRUD basique
  export async function createWorkspace(name: string, owner: string): Promise<Workspace> {
    const newWs: Workspace = { id: generateId(), name, owner, members: [owner] }
    workspaces.push(newWs)
    return newWs
  }
  
  export async function findAllByMember(userId: string): Promise<Workspace[]> {
    return workspaces.filter(ws => ws.members.includes(userId))
  }
  
  export async function findById(id: string): Promise<Workspace | null> {
    return workspaces.find(ws => ws.id === id) ?? null
  }
  
  export async function updateWorkspace(id: string, name: string): Promise<Workspace | null> {
    const idx = workspaces.findIndex(ws => ws.id === id)
    if (idx === -1) return null
    workspaces[idx].name = name
    return workspaces[idx]
  }
  
  export async function deleteWorkspace(id: string): Promise<boolean> {
    const idx = workspaces.findIndex(ws => ws.id === id)
    if (idx === -1) return false
    workspaces.splice(idx, 1)
    return true
  }
  export async function addMember(
    workspaceId: string,
    memberId: string
  ): Promise<Workspace | null> {
    const idx = workspaces.findIndex(ws => ws.id === workspaceId)
    if (idx === -1) return null
  
    const ws = workspaces[idx]
    if (!ws.members.includes(memberId)) {
      ws.members.push(memberId)
    }
    return ws
  }
  
  /**
 * Supprime un membre d'un workspace
 */
export async function removeMember(
    workspaceId: string,
    memberId: string
  ): Promise<Workspace | null> {
    const idx = workspaces.findIndex(ws => ws.id === workspaceId)
    if (idx === -1) return null
  
    const ws = workspaces[idx]
    // Ne pas supprimer le owner par erreur
    ws.members = ws.members.filter(id => id !== memberId)
    return ws
  }
  