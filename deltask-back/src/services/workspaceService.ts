// src/services/workspaceService.ts
import * as workspaceModel from '../models/workspaceModel'
import { Workspace } from '../models/workspaceModel'

export async function create(name: string, owner: string): Promise<Workspace> {
  return workspaceModel.createWorkspace(name, owner)
}

export async function listForUser(userId: string): Promise<Workspace[]> {
  return workspaceModel.findAllByMember(userId)
}

export async function getById(id: string): Promise<Workspace | null> {
  return workspaceModel.findById(id)
}

export async function updateName(id: string, name: string): Promise<Workspace | null> {
  return workspaceModel.updateWorkspace(id, name)
}

export async function remove(id: string): Promise<boolean> {
  return workspaceModel.deleteWorkspace(id)
}
export async function addMember(
  workspaceId: string,
  memberId: string
): Promise<Workspace | null> {
  return workspaceModel.addMember(workspaceId, memberId)
}
/**
 * Supprime un membre du workspace
 */
export async function removeMember(
  workspaceId: string,
  memberId: string
): Promise<Workspace | null> {
  return workspaceModel.removeMember(workspaceId, memberId)
}
