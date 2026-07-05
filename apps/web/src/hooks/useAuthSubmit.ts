import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types/auth.types'

interface AuthResponse {
  token: string
  user: User
}

interface UseAuthSubmitOptions<T> {
  onSubmit: (data: T) => Promise<AuthResponse>
  successMessage: string
  errorMessage: string
}

export function useAuthSubmit<T>({ onSubmit, successMessage, errorMessage }: UseAuthSubmitOptions<T>) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const submit = async (data: T) => {
    setIsLoading(true)
    try {
      const response = await onSubmit(data)
      setAuth(response.user, response.token)
      toast.success(successMessage)
      navigate('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, isLoading }
}
