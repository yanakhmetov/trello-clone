// src/app/(dashboard)/layout.tsx
'use client'

import { Header } from '@/components/dashboard/Header'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const { isSidebarOpen } = useSidebar()

  if (status === 'loading') {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="bg-gray-50 flex flex-col h-screen">
      <Header user={session.user} />
      <div className="flex flex-1 overflow-hidden h-dvh">
        <Sidebar />
        <main 
          className={`pt-16 flex-1 overflow-hidden transition-all duration-300 ease-in-out
             ${
            isSidebarOpen ? 'md:ml-64 ' : 'md:ml-0'
          }`}
        >
          <div className="md:h-[100%]  lg:overflow-hidden md:overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
