// src/app/(dashboard)/board/[id]/BoardClient.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { SortableColumn } from './SortableColumn'
import { SortableTask } from './SortableTask'
import { CreateTaskModal } from './modals/CreateTaskModal'
import { TaskDetailsModal } from './modals/TaskDetailsModal'
import { CreateColumnModal } from './modals/CreateColumnModal'
import { NoSSR } from '@/components/NoSSR'
import { GripVertical, Plus } from 'lucide-react'
import type { Board, Task, Column as ColumnType } from '@/types'

interface BoardClientProps {
  board: Board
  openTaskId?: string | null 
}

export function BoardClient({ board: initialBoard, openTaskId: initialOpenTaskId }: BoardClientProps) {
  const searchParams = useSearchParams()
  const [board, setBoard] = useState<Board>(initialBoard)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isMovingRef = useRef<boolean>(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string

    let foundTask: Task | null = null
    for (const column of board.columns) {
      const task = column.tasks.find(t => t.id === activeId)
      if (task) {
        foundTask = task
        break
      }
    }

    if (foundTask) {
      setActiveTask(foundTask)
    } else {
      const column = board.columns.find(col => col.id === activeId)
      if (column) {
        setActiveColumn(column)
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      setActiveColumn(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Если перетаскиваем колонку
    if (activeColumn) {
      let foundColumn: ColumnType | undefined

      for (const column of board.columns) {
        if (column.id === overId) {
          foundColumn = column
          break
        }
        const taskInColumn = column.tasks.find(t => t.id === overId)
        if (taskInColumn) {
          foundColumn = column
          break
        }
      }

      if (!foundColumn) {
        setActiveColumn(null)
        return
      }

      const oldIndex = board.columns.findIndex(col => col.id === activeId)
      const newIndex = board.columns.findIndex(col => col.id === foundColumn.id)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newColumns = arrayMove(board.columns, oldIndex, newIndex)
        setBoard(prev => ({ ...prev, columns: newColumns }))

        try {
          await fetch(`/api/boards/${board.id}/reorder-columns`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              columnIds: newColumns.map(col => col.id),
            }),
          })

          const updatedBoardResponse = await fetch(`/api/boards/${board.id}`)
          if (updatedBoardResponse.ok) {
            const updatedBoard = await updatedBoardResponse.json()
            setBoard(updatedBoard)
          }
        } catch (error) {
          console.error('Ошибка при перемещении колонки:', error)
          setBoard(prev => ({ ...prev, columns: board.columns }))
          alert('Ошибка при перемещении колонки')
        }
      }
      setActiveColumn(null)
      return
    }

    // Перетаскивание задачи
    if (activeTask && !isMovingRef.current) {
      isMovingRef.current = true
      
      let newColumnId = activeTask.columnId
      let newOrder = activeTask.order

      const overColumn = board.columns.find(col => col.id === overId)
      const overTask = findTaskById(overId)

      if (overColumn) {
        newColumnId = overColumn.id
        newOrder = overColumn.tasks.length
      } else if (overTask) {
        newColumnId = overTask.columnId
        const targetOrder = overTask.order

        if (newColumnId === activeTask.columnId) {
          if (activeTask.order < targetOrder) {
            newOrder = targetOrder + 1
          } else if (activeTask.order > targetOrder) {
            newOrder = targetOrder
          }
        } else {
          newOrder = targetOrder
        }
      } else {
        setActiveTask(null)
        setActiveColumn(null)
        isMovingRef.current = false
        return
      }

      if (activeTask.columnId === newColumnId && activeTask.order === newOrder) {
        setActiveTask(null)
        isMovingRef.current = false
        return
      }

      const previousBoard = board

      setBoard(prevBoard => {
        const newColumns = prevBoard.columns.map(col => ({
          ...col,
          tasks: [...col.tasks]
        }))
        
        const oldColumnIndex = newColumns.findIndex(col => col.id === activeTask.columnId)
        const newColumnIndex = newColumns.findIndex(col => col.id === newColumnId)
        
        if (oldColumnIndex === -1 || newColumnIndex === -1) return prevBoard
        
        const taskToMove = { ...activeTask, columnId: newColumnId }
        newColumns[oldColumnIndex].tasks = newColumns[oldColumnIndex].tasks.filter(t => t.id !== activeTask.id)
        newColumns[oldColumnIndex].tasks = newColumns[oldColumnIndex].tasks.map((t, idx) => ({ ...t, order: idx }))
        
        let insertIndex = newOrder
        if (newColumnId === activeTask.columnId && activeTask.order < newOrder) {
          insertIndex = newOrder - 1
        }
        
        newColumns[newColumnIndex].tasks.splice(insertIndex, 0, taskToMove)
        newColumns[newColumnIndex].tasks = newColumns[newColumnIndex].tasks.map((t, idx) => ({ ...t, order: idx }))
        
        return { ...prevBoard, columns: newColumns }
      })

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const moveResponse = await fetch(`/api/tasks/${activeTask.id}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              newColumnId,
              newOrder,
              boardId: board.id,
            }),
          })

          if (!moveResponse.ok) {
            throw new Error('Failed to move task')
          }
        } catch (error) {
          console.error('Ошибка при перемещении задачи:', error)
          setBoard(previousBoard)
          alert('Ошибка при перемещении задачи')
        } finally {
          isMovingRef.current = false
        }
      }, 100)
      
      setActiveTask(null)
      return
    }

    setActiveTask(null)
    setActiveColumn(null)
    if (isMovingRef.current) {
      isMovingRef.current = false
    }
  }

  const findTaskById = (taskId: string): Task | null => {
    for (const column of board.columns) {
      const task = column.tasks.find(t => t.id === taskId)
      if (task) return task
    }
    return null
  }

  const handleCreateTask = (columnId: string) => {
    setSelectedColumnId(columnId)
    setIsCreateModalOpen(true)
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setBoard(prevBoard => ({
      ...prevBoard,
      columns: prevBoard.columns.map((col: ColumnType) => ({
        ...col,
        tasks: col.tasks.map((t: Task) => t.id === updatedTask.id ? updatedTask : t),
      })),
    }))
    setSelectedTask(updatedTask)
  }

  const handleTaskDelete = (taskId: string) => {
    setBoard(prevBoard => ({
      ...prevBoard,
      columns: prevBoard.columns.map((col: ColumnType) => ({
        ...col,
        tasks: col.tasks
          .filter((t: Task) => t.id !== taskId)
          .map((t: Task, idx: number) => ({ ...t, order: idx })),
      })),
    }))
    setSelectedTask(null)
  }

  const handleTaskCreate = (newTask: Task) => {
    setBoard(prevBoard => ({
      ...prevBoard,
      columns: prevBoard.columns.map((col: ColumnType) => {
        if (col.id === newTask.columnId) {
          return {
            ...col,
            tasks: [...col.tasks, newTask].map((t: Task, idx: number) => ({ ...t, order: idx })),
          }
        }
        return col
      }),
    }))
    setIsCreateModalOpen(false)
    setSelectedColumnId(null)
  }

  const handleColumnCreated = async () => {
    try {
      const response = await fetch(`/api/boards/${board.id}`)
      if (response.ok) {
        const updatedBoard = await response.json()
        setBoard(updatedBoard)
      }
    } catch (error) {
      console.error('Ошибка при обновлении доски:', error)
    }
  }

  const handleColumnUpdate = async () => {
    try {
      const response = await fetch(`/api/boards/${board.id}`)
      if (response.ok) {
        const updatedBoard = await response.json()
        setBoard(updatedBoard)
      }
    } catch (error) {
      console.error('Ошибка при обновлении доски:', error)
    }
  }

  useEffect(() => {
    const taskId = initialOpenTaskId || searchParams.get('task')
    if (taskId) {
      const task = findTaskById(taskId)
      if (task) {
        setSelectedTask(task)
      }
    }
  }, [initialOpenTaskId, searchParams])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{board.title}</h1>
        {board.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{board.description}</p>
        )}
      </div>

      <NoSSR fallback={
        <div className="flex gap-6 overflow-x-auto pb-8">
          {board.columns.map((column: ColumnType) => (
            <div key={column.id} className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="font-semibold dark:text-gray-300">{column.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">Загрузка...</div>
            </div>
          ))}
        </div>
      }>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-200px)]">
            <SortableContext
              items={board.columns.map(col => col.id)}
              strategy={verticalListSortingStrategy}
            >
              {board.columns.map((column: ColumnType) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  onCreateTask={() => handleCreateTask(column.id)}
                  onTaskClick={handleTaskClick}
                  onColumnUpdate={handleColumnUpdate}
                />
              ))}
            </SortableContext>

            <button
              onClick={() => setIsCreateColumnModalOpen(true)}
              className="flex-shrink-0 w-80 h-fit bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg p-4 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Добавить колонку</span>
              </div>
            </button>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-72 border-2 border-blue-500">
                <h3 className="font-medium text-gray-800 dark:text-white">{activeTask.title}</h3>
                {activeTask.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {activeTask.description}
                  </p>
                )}
                {activeTask.subtasks.length > 0 && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {activeTask.subtasks.filter(s => s.isDone).length}/
                    {activeTask.subtasks.length} подзадач
                  </div>
                )}
              </div>
            )}
            {activeColumn && (
              <div className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg border-2 border-blue-500 p-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">{activeColumn.title}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {activeColumn.tasks.length}
                  </span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </NoSSR>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedColumnId(null)
        }}
        columnId={selectedColumnId || ''}
        boardId={board.id}
        onTaskCreated={handleTaskCreate}
      />

      <CreateColumnModal
        isOpen={isCreateColumnModalOpen}
        onClose={() => setIsCreateColumnModalOpen(false)}
        boardId={board.id}
        onColumnCreated={handleColumnCreated}
      />

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          boardId={board.id}
        />
      )}
    </div>
  )
}