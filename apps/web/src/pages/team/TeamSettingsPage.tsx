import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTeam, updateTeam, updateMemberRole, removeMember, inviteMember } from '@/api/teams.api'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Badge } from '@logimap/ui'
import { UpdateTeamSchema, InviteMemberSchema, type UpdateTeamInput, type InviteMemberInput, type TeamRole } from '@logimap/types'
import { toast } from 'sonner'
import { Users, Plus, Trash2, User } from 'lucide-react'
import { roleBadgeVariant, teamRoles } from '@/lib/team'
import { hasRole } from '@/lib/rbac'
import { useTranslation } from '@/i18n'
import { roleLabel } from '@/lib/i18n-labels'
import { LazyAgentContextExport } from '@/components/ai/LazyAgentContextExport'

export function TeamSettingsPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { currentTeamId } = useAuthStore()
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', currentTeamId],
    queryFn: () => fetchTeam(currentTeamId!),
    enabled: !!currentTeamId
  })

  const updateTeamMutation = useMutation({
    mutationFn: (data: UpdateTeamInput) => updateTeam(currentTeamId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success(t('team.updateSuccess'))
    },
    onError: (error: Error) => toast.error(error.message || t('team.updateFailed'))
  })

  const inviteMutation = useMutation({
    mutationFn: (data: InviteMemberInput) => inviteMember(currentTeamId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      toast.success(t('team.inviteSuccess'))
      setIsInviteOpen(false)
    },
    onError: (error: Error) => toast.error(error.message || t('team.inviteFailed'))
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: TeamRole }) =>
      updateMemberRole(currentTeamId!, memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      toast.success(t('team.roleUpdateSuccess'))
    },
    onError: (error: Error) => toast.error(error.message || t('team.roleUpdateFailed'))
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(currentTeamId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', currentTeamId] })
      toast.success(t('team.removeSuccess'))
    },
    onError: (error: Error) => toast.error(error.message || t('team.removeFailed'))
  })

  const { register: registerTeam, handleSubmit: handleTeamSubmit, formState: { errors: teamErrors } } = useForm<UpdateTeamInput>({
    resolver: zodResolver(UpdateTeamSchema),
    values: {
      name: team?.name || '',
      slug: team?.slug || '',
      description: team?.description || ''
    }
  })

  const { register: registerInvite, handleSubmit: handleInviteSubmit, formState: { errors: inviteErrors } } = useForm<InviteMemberInput>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: { email: '', role: 'MEMBER' }
  })

  if (!currentTeamId) {
    return (
      <div className="min-h-full bg-[var(--color-bg-base)] p-8">
        <div className="text-center text-[var(--color-text-secondary)]">{t('team.selectTeamFirst')}</div>
      </div>
    )
  }

  if (isLoading || !team) {
    return (
      <div className="min-h-full bg-[var(--color-bg-base)] p-8">
        <div className="text-center text-[var(--color-text-secondary)]">{t('team.loading')}</div>
      </div>
    )
  }

  const isAdmin = hasRole(team.currentUserRole, 'ADMIN')

  return (
    <div className="min-h-full bg-[var(--color-bg-base)] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('team.title')}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{t('team.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('team.basicInfo')}</CardTitle>
            <CardDescription>{t('team.basicInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTeamSubmit((data) => updateTeamMutation.mutate(data))}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="team-name">{t('team.name')}</label>
                  <Input id="team-name" disabled={!isAdmin} {...registerTeam('name')} />
                  {teamErrors.name && <p className="text-sm text-[var(--color-error-icon)]">{teamErrors.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="team-slug">{t('team.slug')}</label>
                  <Input id="team-slug" disabled={!isAdmin} {...registerTeam('slug')} />
                  {teamErrors.slug && <p className="text-sm text-[var(--color-error-icon)]">{teamErrors.slug.message}</p>}
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="team-description">{t('team.description')}</label>
                  <Input id="team-description" disabled={!isAdmin} {...registerTeam('description')} />
                </div>
                {isAdmin && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateTeamMutation.isPending}>{t('team.save')}</Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('team.memberMgmt')}
              </CardTitle>
              <CardDescription>{t('team.memberMgmtDesc')}</CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsInviteOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('team.invite')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[var(--color-border-default)]">
              {team.members.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] flex items-center justify-center">
                      <User className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{member.user.name || member.user.email}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin ? (
                      <select
                        value={member.role}
                        onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value as TeamRole })}
                        disabled={updateRoleMutation.isPending}
                        className="h-9 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-2 text-sm"
                      >
                        {teamRoles.map((role) => (
                          <option key={role} value={role}>{roleLabel(t, role)}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant={roleBadgeVariant[member.role]}>{roleLabel(t, member.role)}</Badge>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(t('team.removeConfirm', { name: member.user.name || member.user.email }))) {
                            removeMutation.mutate(member.id)
                          }
                        }}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-[var(--color-error-icon)]" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {team.members.length === 0 && <p className="py-8 text-center text-[var(--color-text-secondary)]">{t('team.noMembers')}</p>}
            </div>

            {team.invitations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">{t('team.pendingInvites')}</h3>
                <div className="divide-y divide-[var(--color-border-default)]">
                  {team.invitations.map((invitation) => (
                    <div key={invitation.id} className="py-3 flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-primary)]">{invitation.email}</span>
                      <Badge variant="outline">{roleLabel(t, invitation.role)} · {t('team.pendingAccept')}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <LazyAgentContextExport teamId={currentTeamId} />
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <form onSubmit={handleInviteSubmit((data) => inviteMutation.mutate(data))}>
            <DialogHeader>
              <DialogTitle>{t('team.inviteTitle')}</DialogTitle>
              <DialogDescription>{t('team.inviteDesc')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="invite-email">{t('team.email')}</label>
                <Input id="invite-email" type="email" placeholder="colleague@example.com" {...registerInvite('email')} />
                {inviteErrors.email && <p className="text-sm text-[var(--color-error-icon)]">{inviteErrors.email.message}</p>}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="invite-role">{t('team.role')}</label>
                <select
                  id="invite-role"
                  {...registerInvite('role')}
                  className="h-10 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 text-sm"
                >
                  {teamRoles.filter((role) => role !== 'OWNER').map((role) => (
                    <option key={role} value={role}>{roleLabel(t, role)}</option>
                  ))}
                </select>
                {inviteErrors.role && <p className="text-sm text-[var(--color-error-icon)]">{inviteErrors.role.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>{t('team.cancel')}</Button>
              <Button type="submit" disabled={inviteMutation.isPending}>{t('team.sendInvite')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
