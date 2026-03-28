// src/app/(dashboard)/board/[id]/TaskList.tsx
'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableTask } from './SortableTask'
import type { Column as ColumnType, Task } from '@/types'

interface TaskListProps {
  column: ColumnType
  onTaskClick: (task: Task) => void
}

export function TaskList({ column, onTaskClick }: TaskListProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  const completedSubtasks = (task: Task) => {
    return task.subtasks.filter(s => s.isDone).length
  }

  const sortedTasks = [...column.tasks].sort((a, b) => a.order - b.order)

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <SortableContext
        items={sortedTasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {sortedTasks.map((task) => (
          <SortableTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            completedSubtasks={completedSubtasks(task)}
          />
        ))}
      </SortableContext>

      {sortedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No tasks
        </div>
      )}
    </div>
  )
}