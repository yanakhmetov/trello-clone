// src/components/dashboard/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Layout, Search } from 'lucide-react'
import { SearchModal } from './SearchModal'
import { useSidebar } from '@/context/SidebarContext'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [pendingBoardId, setPendingBoardId] = useState<string | null>(null)
  const { isSidebarOpen } = useSidebar()

  const handleTaskClick = (taskId: string, boardId: string) => {
    setPendingTaskId(taskId)
    setPendingBoardId(boardId)
    router.push(`/board/${boardId}?task=${taskId}`)
  }

  return (
    <>
      <aside 
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out z-40 ${
          isSidebarOpen 
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-700"
          >
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Поиск</span>
          </button>
        </div>

        <nav className="mt-4">
          <Link
            href="/board"
            className={`flex items-center space-x-2 px-4 py-2 mx-2 rounded-lg transition ${
              pathname === '/board'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Мои доски</span>
          </Link>
        </nav>
      </aside>

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onTaskClick={handleTaskClick}
      />
    </>
  )
}
