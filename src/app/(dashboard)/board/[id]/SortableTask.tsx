// src/app/(dashboard)/board/[id]/SortableTask.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CheckSquare } from 'lucide-react'
import { MoveTaskButton } from './MoveTaskButton'
import type { Task, Column } from '@/types'

interface SortableTaskProps {
  task: Task
  onClick: () => void
  completedSubtasks: number
  columns?: Column[]
  boardId?: string
  onTaskMoved?: (taskId: string, newColumnId: string) => void
}

export function SortableTask({ 
  task, 
  onClick, 
  completedSubtasks,
  columns,
  boardId,
  onTaskMoved 
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: isDragging ? ('relative' as const) : ('static' as const),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group relative"
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-white text-sm">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <CheckSquare className="w-3 h-3" />
                  <span>
                    {completedSubtasks}/{task.subtasks.length} подзадач
                  </span>
                </div>
              )}
            </div>
            {/* Кнопка перемещения - показывается только на экранах меньше lg */}
            {columns && boardId && columns.length > 0 && (
              <div className="lg:hidden">
                <MoveTaskButton
                  task={task}
                  columns={columns}
                  boardId={boardId}
                  onTaskMoved={onTaskMoved}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}