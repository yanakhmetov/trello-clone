// src/app/providers.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from '@/context/ThemeContext'
import { SidebarProvider } from '@/context/SidebarContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false
          }
        }
      })
  )

  return (
    <SessionProvider>
      <ThemeProvider>
        <SidebarProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
