import { prisma } from '../db/prisma.js'
import { hashPassword } from '../lib/auth.js'
import { signToken } from '../lib/jwt.js'
import { generateId } from '../lib/id-generator.js'
import type { RegisterInput } from '../lib/validators.js'

export class AuthService {
  async register(input: RegisterInput) {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    })

    if (existingUser) {
      throw new Error('该邮箱已被注册')
    }

    const userId = generateId()
    const teamId = generateId()
    const membershipId = generateId()

    // 使用事务确保用户、团队、成员关系同时创建成功
    const user = await prisma.$transaction(async (tx) => {
      // 创建团队
      const team = await tx.team.create({
        data: {
          id: teamId,
          name: `${input.name} 的团队`,
          slug: `team-${userId}`
        }
      })

      // 创建用户并关联团队和成员身份
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString()
      }
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString()
      }
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
      createdAt: user.createdAt.toISOString()
    }
  }

  async updateUser(userId: string, data: { name?: string; avatarUrl?: string | null }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString()
    }
  }
}
