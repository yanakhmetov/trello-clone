// src/components/dashboard/Header.tsx
'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User, Menu, X } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useSidebar } from '@/context/SidebarContext'

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
  }
}

export function Header({ user }: HeaderProps) {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between h-16 px-4 xs:px-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            aria-label={isSidebarOpen ? "Скрыть боковую панель" : "Показать боковую панель"}
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <h1 className="text-md xs:text-xl font-bold text-gray-800 dark:text-white">Trello Clone</h1>
          <ThemeToggle />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="hidden xs:block text-sm text-gray-700 dark:text-gray-300">{user?.name || user?.email}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center xs:space-x-2 xs:px-3 xs:py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className='hidden sm:block'>Выйти</span>
          </button>
        </div>
      </div>
    </header>
  )
}
