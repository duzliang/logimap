import { prisma } from '../db/prisma.js'
import { hashPassword } from '../lib/auth.js'

let counter = 0

function unique(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

export async function createUser(overrides: { email?: string; name?: string } = {}) {
  const email = overrides.email ?? unique('search-test-user') + '@example.com'
  const name = overrides.name ?? 'Test User'
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword('password123')
    }
  })
}

export async function createTeam(overrides: { name?: string; slug?: string } = {}) {
  return prisma.team.create({
    data: {
      name: overrides.name ?? unique('Search Test Team'),
      slug: overrides.slug ?? unique('search-test-team')
    }
  })
}

export async function addTeamMember(
  userId: string,
  teamId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'VIEWER'
) {
  return prisma.teamMember.create({
    data: {
      userId,
      teamId,
      role
    }
  })
}

export async function createSystem(
  teamId: string,
  overrides: { name?: string; slug?: string; description?: string } = {}
) {
  return prisma.system.create({
    data: {
      teamId,
      name: overrides.name ?? unique('Search Test System'),
      slug: overrides.slug ?? unique('search-test-system'),
      description: overrides.description ?? 'A searchable system'
    }
  })
}

export async function createModule(
  systemId: string,
  overrides: { name?: string; slug?: string; description?: string } = {}
) {
  return prisma.module.create({
    data: {
      systemId,
      name: overrides.name ?? unique('Search Test Module'),
      slug: overrides.slug ?? unique('search-test-module'),
      description: overrides.description ?? 'A searchable module'
    }
  })
}

export async function createLogicNode(
  moduleId: string,
  createdById: string,
  overrides: {
    name?: string
    summary?: string
    status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'DEPRECATED'
    priority?: 'HIGH' | 'NORMAL' | 'LOW'
    tags?: string[]
    codeRef?: string
  } = {}
) {
  return prisma.logicNode.create({
    data: {
      moduleId,
      createdById,
      name: overrides.name ?? unique('Search Test Node'),
      summary: overrides.summary ?? 'A searchable node',
      status: overrides.status ?? 'DRAFT',
      priority: overrides.priority ?? 'NORMAL',
      tags: overrides.tags ?? [],
      codeRef: overrides.codeRef
    }
  })
}

export async function cleanupSearchTestData() {
  const prefix = 'search-test-'

  await prisma.logicNode.deleteMany({
    where: { name: { startsWith: prefix } }
  })
  await prisma.module.deleteMany({
    where: { name: { startsWith: prefix } }
  })
  await prisma.system.deleteMany({
    where: { name: { startsWith: prefix } }
  })
  await prisma.teamInvitation.deleteMany({
    where: { email: { startsWith: prefix } }
  })
  await prisma.teamMember.deleteMany({
    where: { team: { name: { startsWith: prefix } } }
  })
  await prisma.team.deleteMany({
    where: { name: { startsWith: prefix } }
  })
  await prisma.user.deleteMany({
    where: { email: { startsWith: prefix } }
  })
}
