export interface System {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  color?: string | null
  repoUrl?: string | null
  repoBranch?: string | null
  createdAt: string
  updatedAt: string
  teamId: string
  modulesCount?: number
}

export interface Module {
  id: string
  name: string
  slug: string
  description?: string | null
  order: number
  color?: string | null
  createdAt: string
  updatedAt: string
  systemId: string
  nodesCount?: number
}

export interface CreateSystemInput {
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  repoUrl?: string
  repoBranch?: string
}

export interface UpdateSystemInput {
  name?: string
  slug?: string
  description?: string
  icon?: string
  color?: string
  repoUrl?: string
  repoBranch?: string
}

export interface CreateModuleInput {
  name: string
  slug: string
  description?: string
  order?: number
  color?: string
}

export interface UpdateModuleInput {
  name?: string
  slug?: string
  description?: string
  order?: number
  color?: string
}
