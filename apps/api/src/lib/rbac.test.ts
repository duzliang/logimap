import { describe, it, expect } from 'vitest'
import { roleRank, hasRole } from './rbac.js'
import type { TeamRole } from '@logimap/types'

describe('rbac', () => {
  describe('roleRank', () => {
    it('ranks roles from VIEWER to OWNER', () => {
      expect(roleRank.VIEWER).toBe(1)
      expect(roleRank.MEMBER).toBe(2)
      expect(roleRank.ADMIN).toBe(3)
      expect(roleRank.OWNER).toBe(4)
    })
  })

  describe('hasRole', () => {
    it('returns true when role is greater or equal to minRole', () => {
      expect(hasRole('OWNER', 'ADMIN')).toBe(true)
      expect(hasRole('ADMIN', 'ADMIN')).toBe(true)
      expect(hasRole('MEMBER', 'MEMBER')).toBe(true)
    })

    it('returns false when role is below minRole', () => {
      expect(hasRole('VIEWER', 'MEMBER')).toBe(false)
      expect(hasRole('MEMBER', 'ADMIN')).toBe(false)
      expect(hasRole('ADMIN', 'OWNER')).toBe(false)
    })

    it('allows OWNER and ADMIN to act as MEMBER', () => {
      expect(hasRole('OWNER', 'MEMBER')).toBe(true)
      expect(hasRole('ADMIN', 'MEMBER')).toBe(true)
    })
  })
})
