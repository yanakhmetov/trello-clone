// src/app/(dashboard)/board/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import { CreateBoardModal } from '@/components/dashboard/CreateBoardModal'
import type { Board } from '@/types'

export default function BoardsPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards')
      if (!response.ok) throw new Error('Failed to fetch boards')
      const data = await response.json()
      setBoards(data)
    } catch (error) {
      console.error('Error fetching boards:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoards()
  }, [])

  useEffect(() => {
    if (editingBoard && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingBoard])

  const handleBoardCreated = () => {
    fetchBoards()
  }

  const handleDeleteBoard = async (boardId: string, boardTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить доску "${boardTitle}"? Все колонки и задачи будут удалены без возможности восстановления.`)) {
      return
    }

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchBoards()
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при удалении доски')
      }
    } catch (error) {
      console.error('Error deleting board:', error)
      alert('Ошибка при удалении доски')
    }
  }

  const startEditing = (boardId: string, currentTitle: string) => {
    setEditingBoard(boardId)
    setEditTitle(currentTitle)
  }

  const saveEdit = async (boardId: string) => {
    if (!editTitle.trim()) {
      setEditingBoard(null)
      return
    }

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      })

      if (response.ok) {
        setBoards(prev => prev.map(board => 
          board.id === boardId ? { ...board, title: editTitle.trim() } : board
        ))
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при переименовании доски')
      }
    } catch (error) {
      console.error('Error editing board:', error)
      alert('Ошибка при переименовании доски')
    } finally {
      setEditingBoard(null)
    }
  }

  const cancelEdit = () => {
    setEditingBoard(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, boardId: string) => {
    if (e.key === 'Enter') {
      saveEdit(boardId)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Мои доски</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Создать доску</span>
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">У вас пока нет досок</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Создать первую доску
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              className="relative group"
            >
              {editingBoard === board.id ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEdit(board.id)}
                    onKeyDown={(e) => handleKeyDown(e, board.id)}
                    className="w-full text-xl font-semibold text-gray-800 border-b-2 border-blue-500 focus:outline-none px-1"
                  />
                  {board.description && (
                    <p className="text-gray-600 mt-4 line-clamp-2">{board.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                    <span>{board.columns.length} колонок</span>
                    <span>
                      {board.columns.reduce((acc, col) => acc + col.tasks.length, 0)}{' '}
                      задач
                    </span>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/board/${board.id}`}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 relative"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {board.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          startEditing(board.id, board.title)
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="Переименовать"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteBoard(board.id, board.title)
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                  {board.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{board.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{board.columns.length} колонок</span>
                    <span>
                      {board.columns.reduce((acc, col) => acc + col.tasks.length, 0)}{' '}
                      задач
                    </span>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBoardCreated={handleBoardCreated}
      />
    </div>
  )
}