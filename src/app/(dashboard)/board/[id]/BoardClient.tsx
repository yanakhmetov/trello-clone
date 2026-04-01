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
import { MoveTaskButton } from './MoveTaskButton'
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

    // Ищем задачу
    for (const column of board.columns) {
      const task = column.tasks.find((t: Task) => t.id === activeId)
      if (task) {
        setActiveTask(task)
        return
      }
    }

    // Если задача не найдена, ищем колонку
    const column = board.columns.find((col: ColumnType) => col.id === activeId)
    if (column) {
      setActiveColumn(column)
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
        const taskInColumn = column.tasks.find((t: Task) => t.id === overId)
        if (taskInColumn) {
          foundColumn = column
          break
        }
      }

      if (!foundColumn) {
        setActiveColumn(null)
        return
      }

      const oldIndex = board.columns.findIndex((col: ColumnType) => col.id === activeId)
      const newIndex = board.columns.findIndex((col: ColumnType) => col.id === foundColumn.id)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newColumns = arrayMove(board.columns, oldIndex, newIndex)
        setBoard(prev => {
          if (!prev) return prev
          const result: Board = {
            id: prev.id,
            title: prev.title,
            description: prev.description,
            userId: prev.userId,
            columns: newColumns,
            createdAt: prev.createdAt,
            updatedAt: prev.updatedAt
          }
          return result
        })

        try {
          await fetch(`/api/boards/${board.id}/reorder-columns`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              columnIds: newColumns.map((col: ColumnType) => col.id),
            }),
          })

          const updatedBoardResponse = await fetch(`/api/boards/${board.id}`)
          if (updatedBoardResponse.ok) {
            const updatedBoard = await updatedBoardResponse.json()
            setBoard(updatedBoard)
          }
        } catch (error) {
          console.error('Ошибка при перемещении колонки:', error)
          setBoard(prev => {
            if (!prev) return prev
            const result: Board = {
              id: prev.id,
              title: prev.title,
              description: prev.description,
              userId: prev.userId,
              columns: board.columns,
              createdAt: prev.createdAt,
              updatedAt: prev.updatedAt
            }
            return result
          })
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

      const overColumn = board.columns.find((col: ColumnType) => col.id === overId)
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
        if (!prevBoard) return prevBoard
        
        const newColumns: ColumnType[] = prevBoard.columns.map((col: ColumnType) => ({
          id: col.id,
          title: col.title,
          order: col.order,
          boardId: col.boardId,
          tasks: [...col.tasks],
          createdAt: col.createdAt,
          updatedAt: col.updatedAt
        }))
        
        const oldColumnIndex = newColumns.findIndex((col: ColumnType) => col.id === activeTask.columnId)
        const newColumnIndex = newColumns.findIndex((col: ColumnType) => col.id === newColumnId)
        
        if (oldColumnIndex === -1 || newColumnIndex === -1) return prevBoard
        
        const taskToMove: Task = {
          id: activeTask.id,
          title: activeTask.title,
          description: activeTask.description,
          order: activeTask.order,
          columnId: newColumnId,
          createdAt: activeTask.createdAt,
          updatedAt: activeTask.updatedAt,
          subtasks: activeTask.subtasks
        }
        
        newColumns[oldColumnIndex].tasks = newColumns[oldColumnIndex].tasks.filter((t: Task) => t.id !== activeTask.id)
        newColumns[oldColumnIndex].tasks = newColumns[oldColumnIndex].tasks.map((t: Task, idx: number) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          order: idx,
          columnId: t.columnId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          subtasks: t.subtasks
        }))
        
        let insertIndex = newOrder
        if (newColumnId === activeTask.columnId && activeTask.order < newOrder) {
          insertIndex = newOrder - 1
        }
        
        newColumns[newColumnIndex].tasks.splice(insertIndex, 0, taskToMove)
        newColumns[newColumnIndex].tasks = newColumns[newColumnIndex].tasks.map((t: Task, idx: number) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          order: idx,
          columnId: t.columnId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          subtasks: t.subtasks
        }))
        
        const result: Board = {
          id: prevBoard.id,
          title: prevBoard.title,
          description: prevBoard.description,
          userId: prevBoard.userId,
          columns: newColumns,
          createdAt: prevBoard.createdAt,
          updatedAt: prevBoard.updatedAt
        }
        return result
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
      const task = column.tasks.find((t: Task) => t.id === taskId)
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
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard
      
      const newColumns: ColumnType[] = prevBoard.columns.map((col: ColumnType) => ({
        id: col.id,
        title: col.title,
        order: col.order,
        boardId: col.boardId,
        tasks: col.tasks.map((t: Task) => t.id === updatedTask.id ? updatedTask : t),
        createdAt: col.createdAt,
        updatedAt: col.updatedAt
      }))
      
      const result: Board = {
        id: prevBoard.id,
        title: prevBoard.title,
        description: prevBoard.description,
        userId: prevBoard.userId,
        columns: newColumns,
        createdAt: prevBoard.createdAt,
        updatedAt: prevBoard.updatedAt
      }
      return result
    })
    setSelectedTask(updatedTask)
  }

  const handleTaskDelete = (taskId: string) => {
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard
      
      const newColumns: ColumnType[] = prevBoard.columns.map((col: ColumnType) => ({
        id: col.id,
        title: col.title,
        order: col.order,
        boardId: col.boardId,
        tasks: col.tasks
          .filter((t: Task) => t.id !== taskId)
          .map((t: Task, idx: number) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            order: idx,
            columnId: t.columnId,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            subtasks: t.subtasks
          })),
        createdAt: col.createdAt,
        updatedAt: col.updatedAt
      }))
      
      const result: Board = {
        id: prevBoard.id,
        title: prevBoard.title,
        description: prevBoard.description,
        userId: prevBoard.userId,
        columns: newColumns,
        createdAt: prevBoard.createdAt,
        updatedAt: prevBoard.updatedAt
      }
      return result
    })
    setSelectedTask(null)
  }

  const handleTaskMoved = (taskId: string, newColumnId: string) => {
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard
      
      const newColumns: ColumnType[] = prevBoard.columns.map((col: ColumnType) => ({
        id: col.id,
        title: col.title,
        order: col.order,
        boardId: col.boardId,
        tasks: [...col.tasks],
        createdAt: col.createdAt,
        updatedAt: col.updatedAt
      }))
      
      // Находим задачу и удаляем её из старой колонки
      let taskToMove: Task | null = null
      for (const col of newColumns) {
        const taskIndex = col.tasks.findIndex((t: Task) => t.id === taskId)
        if (taskIndex !== -1) {
          const foundTask = col.tasks[taskIndex]
          taskToMove = {
            id: foundTask.id,
            title: foundTask.title,
            description: foundTask.description,
            order: foundTask.order,
            columnId: foundTask.columnId,
            createdAt: foundTask.createdAt,
            updatedAt: foundTask.updatedAt,
            subtasks: foundTask.subtasks
          }
          col.tasks.splice(taskIndex, 1)
          col.tasks = col.tasks.map((t: Task, idx: number) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            order: idx,
            columnId: t.columnId,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            subtasks: t.subtasks
          }))
          break
        }
      }
      
      if (!taskToMove) return prevBoard
      
      // Добавляем задачу в новую колонку
      const newColumnIndex = newColumns.findIndex((col: ColumnType) => col.id === newColumnId)
      if (newColumnIndex !== -1) {
        const updatedTask: Task = {
          id: taskToMove.id,
          title: taskToMove.title,
          description: taskToMove.description,
          order: 0,
          columnId: newColumnId,
          createdAt: taskToMove.createdAt,
          updatedAt: taskToMove.updatedAt,
          subtasks: taskToMove.subtasks
        }
        newColumns[newColumnIndex].tasks.unshift(updatedTask)
        newColumns[newColumnIndex].tasks = newColumns[newColumnIndex].tasks.map((t: Task, idx: number) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          order: idx,
          columnId: t.columnId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          subtasks: t.subtasks
        }))
      }
      
      const result: Board = {
        id: prevBoard.id,
        title: prevBoard.title,
        description: prevBoard.description,
        userId: prevBoard.userId,
        columns: newColumns,
        createdAt: prevBoard.createdAt,
        updatedAt: prevBoard.updatedAt
      }
      return result
    })
  }

  const handleTaskCreate = (newTask: Task) => {
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard
      
      const newColumns: ColumnType[] = prevBoard.columns.map((col: ColumnType) => {
        if (col.id === newTask.columnId) {
          const updatedTasks = [...col.tasks, newTask].map((t: Task, idx: number) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            order: idx,
            columnId: t.columnId,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            subtasks: t.subtasks
          }))
          return {
            id: col.id,
            title: col.title,
            order: col.order,
            boardId: col.boardId,
            tasks: updatedTasks,
            createdAt: col.createdAt,
            updatedAt: col.updatedAt
          }
        }
        return col
      })
      
      const result: Board = {
        id: prevBoard.id,
        title: prevBoard.title,
        description: prevBoard.description,
        userId: prevBoard.userId,
        columns: newColumns,
        createdAt: prevBoard.createdAt,
        updatedAt: prevBoard.updatedAt
      }
      return result
    })
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
    <div className="h-full flex flex-col">
      {/* Заголовок доски и кнопка */}
      <div className="p-6">
        <div className="flex  items-left sm:items-center flex-col sm:flex-row justify-between gap-4 sm:gap-0">
          <div>
            <h1 className="text-xl xs:text-3xl font-bold text-gray-800 dark:text-white">{board.title}</h1>
            {board.description && (
              <p className="text-xs xs:text-md sm:text-xl text-gray-600 dark:text-gray-400 mt-1">{board.description}</p>
            )}
          </div>
          <button
            onClick={() => setIsCreateColumnModalOpen(true)}
            className="w-52 ml-auto sm:w-auto sm:ml-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить колонку</span>
          </button>
        </div>
      </div>

      {/* Контейнер для колонок с разным поведением на разных размерах */}
      <div className="flex-1 px-6 pb-6">

        <NoSSR fallback={
          <div className="sm:flex sm:gap-6 lg:overflow-x-auto sm:pb-8 sm:h-full hidden">
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
            {/* Для экранов 1024px и выше (lg) - горизонтальный скролл */}
            <div 
              className="hidden lg:flex lg:gap-6 lg:overflow-x-auto lg:pb-6 lg:h-[calc(100vh-12rem)]" 
              id="columns-container"
              onWheel={(e) => {
                const container = e.currentTarget;
                const rect = container.getBoundingClientRect();
                const scrollbarWidth = 16;
                const isOverScrollbar = 
                  e.clientX > rect.right - scrollbarWidth || 
                  e.clientY > rect.bottom - scrollbarWidth;
                
                if (isOverScrollbar && e.deltaY !== 0) {
                  if (window.innerWidth >= 1024) {
                    container.scrollLeft += e.deltaY;
                    e.preventDefault();
                  }
                }
              }}
            >
              <SortableContext
                items={board.columns.map((col: ColumnType) => col.id)}
                strategy={verticalListSortingStrategy}
              >
                {board.columns.map((column: ColumnType) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    onCreateTask={() => handleCreateTask(column.id)}
                    onTaskClick={handleTaskClick}
                    onColumnUpdate={handleColumnUpdate}
                    columns={board.columns}
                    boardId={board.id}
                    onTaskMoved={handleTaskMoved}
                  />
                ))}
              </SortableContext>
            </div>

            {/* Для экранов 768px-1023px (md) - вертикальный скролл */}
            <div className="hidden sm:block lg:hidden">
              <div className="space-y-6 pb-8">
                {board.columns.map((column: ColumnType) => (
                  <div key={column.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <div className="font-semibold dark:text-gray-300 mb-4">{column.title}</div>
                    <div className="space-y-3">
                      {column.tasks.map((task: Task) => (
                        <div 
                          key={task.id}
                          className="bg-white dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow group relative"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 dark:text-white">{task.title}</div>
                              {task.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {task.description}
                                </div>
                              )}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                  {task.subtasks.filter((s: { isDone: boolean }) => s.isDone).length}/{task.subtasks.length} подзадач
                                </div>
                              )}
                            </div>
                            {/* Кнопка перемещения для экранов меньше lg */}
                            <div className="lg:hidden">
                              <MoveTaskButton
                                task={task}
                                columns={board.columns}
                                boardId={board.id}
                                onTaskMoved={handleTaskMoved}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleCreateTask(column.id)}
                      className="w-full mt-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      + Добавить задачу
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Для экранов меньше 768px - вертикальная верстка без скролла */}
            <div className="sm:hidden space-y-6 pb-8">
              {board.columns.map((column: ColumnType) => (
                <div key={column.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <div className="font-semibold dark:text-gray-300 mb-4">{column.title}</div>
                  <div className="space-y-3">
                    {column.tasks.map((task: Task) => (
                      <div 
                        key={task.id}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:shadow- transition-shadow group relative"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-white">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {task.description}
                              </div>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {task.subtasks.filter((s: { isDone: boolean }) => s.isDone).length}/{task.subtasks.length} подзадач
                              </div>
                            )}
                          </div>
                          {/* Кнопка перемещения для экранов меньше lg */}
                          <div className="lg:hidden">
                            <MoveTaskButton
                              task={task}
                              columns={board.columns}
                              boardId={board.id}
                              onTaskMoved={handleTaskMoved}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleCreateTask(column.id)}
                    className="w-full mt-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    + Добавить задачу
                  </button>
                </div>
              ))}
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
                  {activeTask.subtasks && activeTask.subtasks.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {activeTask.subtasks.filter((s: { isDone: boolean }) => s.isDone).length}/
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
      </div>

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