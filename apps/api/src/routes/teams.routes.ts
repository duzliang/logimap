import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { TeamsService } from '../services/teams.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  AcceptInvitationSchema
} from '../lib/validators.team.js'

const teams = new TeamsService()

export const teamsRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', async (c) => {
    try {
      const user = c.get('user')
      const result = await teams.getUserTeams(user.userId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取团队列表失败'
      return c.json({ error: message, code: 'GET_TEAMS_FAILED' }, 500)
    }
  })
  .post('/', zValidator('json', CreateTeamSchema), async (c) => {
    try {
      const user = c.get('user')
      const input = c.req.valid('json')
      const result = await teams.createTeam(user.userId, input)
      return c.json({ data: result, message: '创建成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      return c.json({ error: message, code: 'CREATE_TEAM_FAILED' }, 400)
    }
  })
  .get('/:teamId', requireTeamRole('VIEWER', teamResolvers.fromTeamParam), async (c) => {
    try {
      const user = c.get('user')
      const teamId = c.req.param('teamId')
      const result = await teams.getTeamWithMembers(teamId, user.userId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取团队详情失败'
      return c.json({ error: message, code: 'GET_TEAM_FAILED' }, 404)
    }
  })
  .put('/:teamId', requireTeamRole('ADMIN', teamResolvers.fromTeamParam), zValidator('json', UpdateTeamSchema), async (c) => {
    try {
      const user = c.get('user')
      const teamId = c.req.param('teamId')
      const input = c.req.valid('json')
      const result = await teams.updateTeam(teamId, user.userId, input)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_TEAM_FAILED' }, 400)
    }
  })
  .get('/:teamId/members', requireTeamRole('VIEWER', teamResolvers.fromTeamParam), async (c) => {
    try {
      const user = c.get('user')
      const teamId = c.req.param('teamId')
      const result = await teams.getTeamWithMembers(teamId, user.userId)
      return c.json({ data: { members: result.members, invitations: result.invitations } })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取成员列表失败'
      return c.json({ error: message, code: 'GET_MEMBERS_FAILED' }, 400)
    }
  })
  .post('/:teamId/members', requireTeamRole('ADMIN', teamResolvers.fromTeamParam), zValidator('json', InviteMemberSchema), async (c) => {
    try {
      const user = c.get('user')
      const teamId = c.req.param('teamId')
      const input = c.req.valid('json')
      const result = await teams.inviteMember(teamId, user.userId, input)
      return c.json({ data: result, message: '邀请成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '邀请失败'
      return c.json({ error: message, code: 'INVITE_FAILED' }, 400)
    }
  })
  .put('/:teamId/members/:memberId/role', requireTeamRole('ADMIN', teamResolvers.fromTeamParam), zValidator('json', UpdateMemberRoleSchema), async (c) => {
    try {
      const user = c.get('user')
      const teamId = c.req.param('teamId')
      const memberId = c.req.param('memberId')
      const input = c.req.valid('json')
      const result = await teams.updateMemberRole(teamId, memberId, input, user.userId)
      return c.json({ data: result, message: '角色更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_ROLE_FAILED' }, 400)
    }
  })
  .delete('/:teamId/members/:memberId', requireTeamRole('ADMIN', teamResolvers.fromTeamParam), async (c) => {
    try {
      const user = c.get('user')
      const teamId = c.req.param('teamId')
      const memberId = c.req.param('memberId')
      const result = await teams.removeMember(teamId, memberId, user.userId)
      return c.json({ data: result, message: '移除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '移除失败'
      return c.json({ error: message, code: 'REMOVE_MEMBER_FAILED' }, 400)
    }
  })
  .post('/invitations/:token/accept', zValidator('json', AcceptInvitationSchema), async (c) => {
    try {
      const user = c.get('user')
      const { token } = c.req.valid('json')
      const result = await teams.acceptInvitation(token, user.userId)
      return c.json({ data: result, message: '加入团队成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '接受邀请失败'
      return c.json({ error: message, code: 'ACCEPT_INVITATION_FAILED' }, 400)
    }
  })
