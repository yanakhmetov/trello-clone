// src/components/dashboard/Header.tsx
'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
  }
}

export function Header({ user }: HeaderProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">📋 Trello Clone</h1>
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
            <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name || user?.email}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </header>
  )
}