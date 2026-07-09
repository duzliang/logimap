import { prisma } from '../db/prisma.js'
import { hashPassword } from '../lib/auth.js'
import { signToken } from '../lib/jwt.js'
import { generateId } from '../lib/id-generator.js'
import { TeamsService } from './teams.service.js'
import type { RegisterInput } from '../lib/validators.js'
import type { User } from '@prisma/client'

export class AuthService {
  private toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString()
    }
  }

  async register(input: RegisterInput) {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    })

    if (existingUser) {
      throw new Error('该邮箱已被注册')
    }

    const userId = generateId()

    // 如果携带邀请 token，则加入对应团队
    if (input.invitationToken) {
      const invitation = await prisma.teamInvitation.findUnique({
        where: { token: input.invitationToken }
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

      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            id: userId,
            email: input.email,
            name: input.name,
            passwordHash: await hashPassword(input.password)
          }
        })

        await TeamsService.acceptInvitationTransaction(tx, created, invitation)

        return created
      })

      const token = await signToken({
        userId: user.id,
        email: user.email
      })

      return {
        token,
        user: this.toAuthUser(user)
      }
    }

    // 否则创建个人团队
    const teamId = generateId()
    const membershipId = generateId()

    const user = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          id: teamId,
          name: `${input.name} 的团队`,
          slug: `team-${userId}`
        }
      })

      const user = await tx.user.create({
        data: {
          id: userId,
          email: input.email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
          memberships: {
            create: {
              id: membershipId,
              role: 'OWNER',
              teamId: team.id
            }
          }
        },
        include: {
          memberships: {
            include: {
              team: true
            }
          }
        }
      })

      return user
    })

    const token = await signToken({
      userId: user.id,
      email: user.email
    })

    return {
      token,
      user: this.toAuthUser(user)
    }
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error('邮箱或密码错误')
    }

    const isValid = await this.verifyPassword(password, user.passwordHash)
    if (!isValid) {
      throw new Error('邮箱或密码错误')
    }

    const token = await signToken({
      userId: user.id,
      email: user.email
    })

    return {
      token,
      user: this.toAuthUser(user)
    }
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const { verifyPassword } = await import('../lib/auth.js')
    return verifyPassword(password, hash)
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailNotifications: true,
        createdAt: true
      }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailNotifications: user.emailNotifications,
      createdAt: user.createdAt.toISOString()
    }
  }

  async updateUser(
    userId: string,
    data: { name?: string; avatarUrl?: string | null; emailNotifications?: boolean }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailNotifications: user.emailNotifications,
      createdAt: user.createdAt.toISOString()
    }
  }
}
