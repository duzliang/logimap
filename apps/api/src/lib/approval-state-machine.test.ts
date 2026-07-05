import { describe, it, expect } from 'vitest'
import { getNextStatus, isValidTransition, InvalidTransitionError } from './approval-state-machine.js'

describe('approval-state-machine', () => {
  describe('getNextStatus', () => {
    it('allows MEMBER to submit DRAFT to REVIEW', () => {
      expect(getNextStatus('DRAFT', 'SUBMIT', 'MEMBER')).toBe('REVIEW')
      expect(getNextStatus('DRAFT', 'SUBMIT', 'ADMIN')).toBe('REVIEW')
      expect(getNextStatus('DRAFT', 'SUBMIT', 'OWNER')).toBe('REVIEW')
    })

    it('allows ADMIN to approve REVIEW to APPROVED', () => {
      expect(getNextStatus('REVIEW', 'APPROVE', 'ADMIN')).toBe('APPROVED')
      expect(getNextStatus('REVIEW', 'APPROVE', 'OWNER')).toBe('APPROVED')
    })

    it('allows ADMIN to reject REVIEW back to DRAFT', () => {
      expect(getNextStatus('REVIEW', 'REJECT', 'ADMIN')).toBe('DRAFT')
    })

    it('allows ADMIN to deprecate APPROVED', () => {
      expect(getNextStatus('APPROVED', 'DEPRECATE', 'ADMIN')).toBe('DEPRECATED')
    })

    it('allows ADMIN to revoke APPROVED back to DRAFT', () => {
      expect(getNextStatus('APPROVED', 'REVOKE', 'ADMIN')).toBe('DRAFT')
    })

    it('throws for invalid transition', () => {
      expect(() => getNextStatus('DRAFT', 'APPROVE', 'ADMIN')).toThrow(InvalidTransitionError)
    })

    it('throws when role is insufficient', () => {
      expect(() => getNextStatus('DRAFT', 'SUBMIT', 'VIEWER')).toThrow(InvalidTransitionError)
      expect(() => getNextStatus('REVIEW', 'APPROVE', 'MEMBER')).toThrow(InvalidTransitionError)
    })
  })

  describe('isValidTransition', () => {
    it('returns true for valid transitions', () => {
      expect(isValidTransition('DRAFT', 'SUBMIT', 'MEMBER')).toBe(true)
      expect(isValidTransition('REVIEW', 'APPROVE', 'OWNER')).toBe(true)
    })

    it('returns false for invalid transitions', () => {
      expect(isValidTransition('DRAFT', 'APPROVE', 'ADMIN')).toBe(false)
      expect(isValidTransition('APPROVED', 'SUBMIT', 'ADMIN')).toBe(false)
      expect(isValidTransition('DRAFT', 'SUBMIT', 'VIEWER')).toBe(false)
    })
  })
})
