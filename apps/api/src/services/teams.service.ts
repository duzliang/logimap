import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import { hasRole } from '../lib/rbac.js'
import type { TeamRole, InviteMemberInput, UpdateMemberRoleInput, UpdateTeamInput, CreateTeamInput } from '@logimap/types'
import type { Prisma } from '@prisma/client'

const INVITATION_EXPIRES_DAYS = 7

export class TeamsService {
  async getUserTeams(userId: string) {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: true
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    return memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      description: m.team.description,
      role: m.role,
      joinedAt: m.joinedAt.toISOString()
    }))
  }

  async createTeam(userId: string, input: CreateTeamInput) {
    const existingSlug = await prisma.team.findUnique({
      where: { slug: input.slug }
    })

    if (existingSlug) {
      throw new Error('团队标识已被使用')
    }

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          id: generateId(),
          name: input.name,
          slug: input.slug,
          description: input.description
        }
      })

      await tx.teamMember.create({
        data: {
          id: generateId(),
          userId,
          teamId: created.id,
          role: 'OWNER'
        }
      })

      return created
    })

    return team
  }

  async getTeamWithMembers(teamId: string, userId: string) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    })

    if (!membership) {
      throw new Error('无权访问该团队')
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        invitations: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!team) {
      throw new Error('团队不存在')
    }

    return {
      ...team,
      currentUserRole: membership.role,
      members: team.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user
      })),
      invitations: team.invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        token: i.token,
        expiresAt: i.expiresAt.toISOString(),
        createdAt: i.createdAt.toISOString()
      }))
    }
  }

  async updateTeam(teamId: string, userId: string, input: UpdateTeamInput) {
    await this.requireAdmin(teamId, userId)

    const team = await prisma.team.update({
      where: { id: teamId },
      data: input
    })

    return team
  }

  async inviteMember(teamId: string, invitedById: string, input: InviteMemberInput) {
    await this.requireAdmin(teamId, invitedById)

    const normalizedEmail = input.email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      const existingMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: existingUser.id,
            teamId
          }
        }
      })

      if (existingMembership) {
        throw new Error('该用户已是团队成员')
      }

      await prisma.teamMember.create({
        data: {
          id: generateId(),
          userId: existingUser.id,
          teamId,
          role: input.role
        }
      })

      return {
        type: 'member' as const,
        email: normalizedEmail,
        role: input.role
      }
    }

    const existingPending = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email: normalizedEmail,
        status: 'PENDING'
      }
    })

    if (existingPending) {
      throw new Error('该邮箱已存在待处理邀请')
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRES_DAYS)

    const invitation = await prisma.teamInvitation.create({
      data: {
        id: generateId(),
        email: normalizedEmail,
        role: input.role,
        teamId,
        invitedById,
        expiresAt
      }
    })

    return {
      type: 'invitation' as const,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString()
    }
  }

  async acceptInvitation(token: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token }
    })

    if (!invitation || invitation.status !== 'PENDING') {
      throw new Error('邀请链接无效或已失效')
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })
      throw new Error('邀请链接已过期')
    }

    return prisma.$transaction((tx) =>
      TeamsService.acceptInvitationTransaction(tx, user, invitation)
    )
  }

  async updateMemberRole(teamId: string, memberId: string, input: UpdateMemberRoleInput, actorId: string) {
    await this.requireAdmin(teamId, actorId)

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId }
    })

    if (!member || member.teamId !== teamId) {
      throw new Error('成员不存在')
    }

    if (member.role === 'OWNER' && input.role !== 'OWNER') {
      const otherOwners = await prisma.teamMember.count({
        where: {
          teamId,
          role: 'OWNER',
          id: { not: memberId }
        }
      })

      if (otherOwners === 0) {
        throw new Error('团队中必须至少保留一个 OWNER')
      }
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: input.role }
    })

    return updated
  }

  async removeMember(teamId: string, memberId: string, actorId: string) {
    const actorMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: actorId,
          teamId
        }
      }
    })

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId }
    })

    if (!member || member.teamId !== teamId) {
      throw new Error('成员不存在')
    }

    const isSelf = member.userId === actorId
    const isAdmin = actorMembership && hasRole(actorMembership.role, 'ADMIN')

    if (!isSelf && !isAdmin) {
      throw new Error('权限不足')
    }

    if (member.role === 'OWNER') {
      const otherOwners = await prisma.teamMember.count({
        where: {
          teamId,
          role: 'OWNER',
          id: { not: memberId }
        }
      })

      if (otherOwners === 0) {
        throw new Error('团队中必须至少保留一个 OWNER')
      }
    }

    await prisma.teamMember.delete({
      where: { id: memberId }
    })

    return { success: true }
  }

  private async requireAdmin(teamId: string, userId: string) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    })

    if (!membership || !hasRole(membership.role, 'ADMIN')) {
      throw new Error('权限不足')
    }

    return membership.role
  }

  static async acceptInvitationTransaction(
    tx: Prisma.TransactionClient,
    user: { id: string; email: string },
    invitation: { id: string; teamId: string; role: TeamRole; email: string }
  ) {
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error('邀请链接与当前账号邮箱不匹配')
    }

    const existingMembership = await tx.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: invitation.teamId
        }
      }
    })

    if (existingMembership) {
      throw new Error('你已经是该团队成员')
    }

    await tx.teamMember.create({
      data: {
        id: generateId(),
        userId: user.id,
        teamId: invitation.teamId,
        role: invitation.role
      }
    })

    await tx.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    })

    return {
      teamId: invitation.teamId,
      role: invitation.role
    }
  }
}
