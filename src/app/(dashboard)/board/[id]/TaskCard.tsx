// src/app/(dashboard)/board/[id]/TaskCard.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CheckSquare } from 'lucide-react'
import type { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onClick: () => void
  completedSubtasks: number
}

export function TaskCard({ task, onClick, completedSubtasks }: TaskCardProps) {
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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-start gap-2">
        <div className="cursor-grab active:cursor-grabbing touch-none task-drag-handle mt-0.5">
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          {task.subtasks.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{task.subtasks.length} подзадач
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}