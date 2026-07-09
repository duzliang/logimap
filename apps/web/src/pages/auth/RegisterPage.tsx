import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterSchema, type RegisterInput } from '@logimap/types'
import { register as registerApi } from '@/api/auth.api'
import { useAuthSubmit } from '@/hooks/useAuthSubmit'
import { useI18n } from '@/i18n'
import { Button, Input, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@logimap/ui'

export function RegisterPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const invitationToken = searchParams.get('invitation') || undefined
  const { isLoading, submit: onSubmit } = useAuthSubmit({
    onSubmit: (data: RegisterInput) => registerApi({ ...data, invitationToken }),
    successMessage: t('auth.registerSuccess'),
    errorMessage: t('auth.registerError')
  })

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema)
  })

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-base)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">LogiMap</CardTitle>
          <CardDescription className="text-center">
            {t('auth.registerTitle')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                {t('auth.username')}
              </label>
              <Input
                id="name"
                type="text"
                placeholder={t('auth.usernamePlaceholder')}
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-[var(--color-error-icon)]">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                {t('auth.email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-[var(--color-error-icon)]">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                {t('auth.password')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-[var(--color-error-icon)]">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('auth.registering') : t('auth.register')}
            </Button>
            <p className="text-sm text-center text-[var(--color-text-secondary)]">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-[var(--color-text-brand)] hover:underline">
                {t('auth.goLogin')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
