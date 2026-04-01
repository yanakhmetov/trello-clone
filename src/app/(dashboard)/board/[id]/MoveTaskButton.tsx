// src/app/(dashboard)/board/[id]/MoveTaskButton.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { MoveVertical } from 'lucide-react'
import type { Column, Task } from '@/types'

interface MoveTaskButtonProps {
  task: Task
  columns: Column[]
  boardId: string
  onTaskMoved?: (taskId: string, newColumnId: string) => void
}

export function MoveTaskButton({ task, columns, boardId, onTaskMoved }: MoveTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Фильтруем текущую колонку из списка
  const availableColumns = columns.filter((col: Column) => col.id !== task.columnId)

  const handleMoveTask = async (newColumnId: string) => {
    if (isMoving) return
    
    setIsMoving(true)
    setIsOpen(false)

    try {
      const response = await fetch(`/api/tasks/${task.id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newColumnId,
          newOrder: 0,
          boardId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to move task')
      }

      if (onTaskMoved) {
        onTaskMoved(task.id, newColumnId)
      }
    } catch (error) {
      console.error('Ошибка при перемещении задачи:', error)
      alert('Ошибка при перемещении задачи')
    } finally {
      setIsMoving(false)
    }
  }

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (availableColumns.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        disabled={isMoving}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        title="Переместить задачу"
      >
        <MoveVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
            Переместить в:
          </div>
          {availableColumns.map((column: Column) => (
            <button
              key={column.id}
              onClick={(e) => {
                e.stopPropagation()
                handleMoveTask(column.id)
              }}
              disabled={isMoving}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
            >
              <span className="truncate">{column.title}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                {column.tasks.length}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}