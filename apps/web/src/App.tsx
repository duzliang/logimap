import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@logimap/ui'
import { router } from './router'
import { Toaster } from 'sonner'

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false
          }
        }
      })
  )

  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
