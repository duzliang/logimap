import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@logimap/ui'
import { I18nProvider } from './i18n'
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
      <I18nProvider defaultLang="zh">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App
