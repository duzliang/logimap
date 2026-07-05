import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, type LoginInput } from '@logimap/types'
import { login } from '@/api/auth.api'
import { useAuthSubmit } from '@/hooks/useAuthSubmit'
import { Button, Input, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@logimap/ui'

export function LoginPage() {
  const { isLoading, submit: onSubmit } = useAuthSubmit({
    onSubmit: login,
    successMessage: '登录成功',
    errorMessage: '登录失败，请检查账号密码'
  })

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema)
  })

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-base)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">LogiMap</CardTitle>
          <CardDescription className="text-center">
            登录您的账户
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                邮箱
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
                密码
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
              {isLoading ? '登录中...' : '登录'}
            </Button>
            <p className="text-sm text-center text-[var(--color-text-secondary)]">
              还没有账户？{' '}
              <Link to="/register" className="text-[var(--color-text-brand)] hover:underline">
                立即注册
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
