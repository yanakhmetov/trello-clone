// src/app/(dashboard)/board/[id]/SortableColumn.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTask } from './SortableTask'
import type { Column as ColumnType, Task } from '@/types'

interface SortableColumnProps {
  column: ColumnType
  onCreateTask: () => void
  onTaskClick: (task: Task) => void
  onColumnUpdate?: () => void
  columns?: ColumnType[]
  boardId?: string
  onTaskMoved?: (taskId: string, newColumnId: string) => void
}

export function SortableColumn({ 
  column, 
  onCreateTask, 
  onTaskClick, 
  onColumnUpdate,
  columns,
  boardId,
  onTaskMoved 
}: SortableColumnProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const completedSubtasks = (task: Task) => {
    return task.subtasks.filter((s: { isDone: boolean }) => s.isDone).length
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) return

    try {
      const response = await fetch(`/api/columns/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      })

      if (response.ok) {
        setIsEditing(false)
        if (onColumnUpdate) {
          onColumnUpdate()
        }
      }
    } catch (error) {
      console.error('Ошибка при обновлении колонки:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Удалить колонку "${column.title}" и все задачи в ней?`)) return

    try {
      const response = await fetch(`/api/columns/${column.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (onColumnUpdate) {
          onColumnUpdate()
        }
      }
    } catch (error) {
      console.error('Ошибка при удалении колонки:', error)
    }
  }

  // Создаем массив ID задач для SortableContext
  const taskIds = column.tasks.map((task: Task) => task.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col max-h-[calc(100vh-180px)]"
    >
      <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400" />
          </div>
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2 py-1 text-sm font-semibold border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
                onBlur={() => setIsEditing(false)}
              />
            </form>
          ) : (
            <h3
              className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onDoubleClick={() => setIsEditing(true)}
            >
              {column.title}
            </h3>
          )}
          <span className="text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateTask}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Добавить задачу"
          >
            <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Pencil className="w-3 h-3" />
                    Редактировать
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task: Task) => (
            <SortableTask
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              completedSubtasks={completedSubtasks(task)}
              columns={columns}
              boardId={boardId}
              onTaskMoved={onTaskMoved}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Нет задач
          </div>
        )}
      </div>
    </div>
  )
}