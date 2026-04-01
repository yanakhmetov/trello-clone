// src/app/(dashboard)/board/[id]/modals/TaskDetailsModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckSquare, Square, Trash2, Edit2, Save, Plus, Pencil, XCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { Task, Subtask } from '@/types'

interface TaskDetailsModalProps {
  task: Task
  onClose: () => void
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
  boardId: string
}

export function TaskDetailsModal({
  task,
  onClose,
  onUpdate,
  onDelete,
  boardId,
}: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || [])
  const [loading, setLoading] = useState(false)
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [descriptionNeedsExpand, setDescriptionNeedsExpand] = useState(false)
  const [isHoveringDescription, setIsHoveringDescription] = useState(false)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const descriptionContainerRef = useRef<HTMLDivElement>(null)

  // Проверяем, нужно ли сворачивать описание
  useEffect(() => {
    if (descriptionRef.current && !isEditing) {
      const lineHeight = 24
      const maxHeight = lineHeight * 3
      const actualHeight = descriptionRef.current.scrollHeight
      setDescriptionNeedsExpand(actualHeight > maxHeight)
    }
  }, [description, isEditing])

  // Синхронизируем подзадачи при изменении task извне
  useEffect(() => {
    setSubtasks(task.subtasks || [])
  }, [task.subtasks])

  const updateParentTask = (updatedSubtasks: Subtask[]) => {
    const updatedTask: Task = {
      ...task,
      title,
      description: description || null,
      subtasks: updatedSubtasks,
    }
    onUpdate(updatedTask)
  }

  const toggleSubtask = async (subtaskId: string, currentIsDone: boolean) => {
    const newIsDone = !currentIsDone
    const updatedSubtasks = subtasks.map(s =>
      s.id === subtaskId ? { ...s, isDone: newIsDone } : s
    )
    setSubtasks(updatedSubtasks)
    updateParentTask(updatedSubtasks)

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: newIsDone }),
      })

      if (!response.ok) throw new Error('Failed to update subtask')
    } catch (error) {
      console.error('Error updating subtask:', error)
      const rolledBackSubtasks = subtasks.map(s =>
        s.id === subtaskId ? { ...s, isDone: currentIsDone } : s
      )
      setSubtasks(rolledBackSubtasks)
      updateParentTask(rolledBackSubtasks)
    }
  }

  const startEditingSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditingSubtaskTitle(subtask.title)
  }

  const saveSubtaskEdit = async (subtaskId: string) => {
    if (!editingSubtaskTitle.trim()) {
      setEditingSubtaskId(null)
      return
    }

    const originalSubtask = subtasks.find(s => s.id === subtaskId)
    const updatedSubtasks = subtasks.map(s =>
      s.id === subtaskId ? { ...s, title: editingSubtaskTitle.trim() } : s
    )
    setSubtasks(updatedSubtasks)
    updateParentTask(updatedSubtasks)

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingSubtaskTitle.trim() }),
      })

      if (!response.ok) throw new Error('Failed to update subtask')
    } catch (error) {
      console.error('Error updating subtask:', error)
      const rolledBackSubtasks = subtasks.map(s =>
        s.id === subtaskId ? { ...s, title: originalSubtask?.title || '' } : s
      )
      setSubtasks(rolledBackSubtasks)
      updateParentTask(rolledBackSubtasks)
    }
    setEditingSubtaskId(null)
  }

  const deleteSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter(s => s.id !== subtaskId)
    setSubtasks(updatedSubtasks)
    updateParentTask(updatedSubtasks)

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete subtask')
    } catch (error) {
      console.error('Error deleting subtask:', error)
      const deletedSubtask = task.subtasks?.find(s => s.id === subtaskId)
      if (deletedSubtask) {
        const restoredSubtasks = [...updatedSubtasks, deletedSubtask]
        setSubtasks(restoredSubtasks)
        updateParentTask(restoredSubtasks)
      }
    }
  }

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      setIsAddingSubtask(false)
      setNewSubtaskTitle('')
      return
    }

    setIsAddingSubtask(false)
    const tempId = `temp-${Date.now()}`
    const titleToAdd = newSubtaskTitle.trim()
    const newSubtask: Subtask = {
      id: tempId,
      title: titleToAdd,
      isDone: false,
      taskId: task.id,
    }
    const updatedSubtasks = [...subtasks, newSubtask]
    setSubtasks(updatedSubtasks)
    updateParentTask(updatedSubtasks)
    setNewSubtaskTitle('')

    try {
      const response = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToAdd,
          taskId: task.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to create subtask')

      const createdSubtask = await response.json()
      const finalSubtasks = updatedSubtasks.map(s => s.id === tempId ? createdSubtask : s)
      setSubtasks(finalSubtasks)
      updateParentTask(finalSubtasks)
    } catch (error) {
      console.error('Error creating subtask:', error)
      const rolledBackSubtasks = subtasks.filter(s => s.id !== tempId)
      setSubtasks(rolledBackSubtasks)
      updateParentTask(rolledBackSubtasks)
    }
  }

  const cancelAddSubtask = () => {
    setIsAddingSubtask(false)
    setNewSubtaskTitle('')
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          boardId,
        }),
      })

      if (!response.ok) throw new Error('Failed to update task')

      const updatedTask = await response.json()
      onUpdate({ 
        ...task, 
        title, 
        description: description || null, 
        subtasks: subtasks || [] 
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId }),
      })

      if (!response.ok) throw new Error('Failed to delete task')

      onDelete(task.id)
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = subtasks.filter(s => s.isDone).length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg h-[90vh] flex flex-col ml-2 mr-2 sm:ml-0 sm:mr-0">
        {/* Заголовок - фиксированный */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10 flex-shrink-0">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{task.title}</h2>
            )}
          </div>
        </div>

        {/* Скроллируемый контент (описание + подзадачи) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Описание
            </label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            ) : (
              <div
                ref={descriptionContainerRef}
                className="relative"
                onMouseEnter={() => setIsHoveringDescription(true)}
                onMouseLeave={() => setIsHoveringDescription(false)}
              >
                <div
                  ref={descriptionRef}
                  className={`text-gray-600 dark:text-gray-400 whitespace-pre-wrap ${!isDescriptionExpanded && descriptionNeedsExpand ? 'line-clamp-3' : ''}`}
                >
                  {description || 'Нет описания'}
                </div>
                {descriptionNeedsExpand && (
                  <div className={`flex justify-center mt-2 transition-opacity duration-200 ${isHoveringDescription ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors shadow-sm"
                    >
                      {isDescriptionExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Подзадачи */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Подзадачи
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {completedCount}/{subtasks.length} выполнено
              </span>
            </div>
            
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group"
                >
                  <button
                    onClick={() => toggleSubtask(subtask.id, subtask.isDone)}
                    className="flex-shrink-0"
                  >
                    {subtask.isDone ? (
                      <CheckSquare className="w-5 h-5 text-green-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {editingSubtaskId === subtask.id ? (
                    <input
                      type="text"
                      value={editingSubtaskTitle}
                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                      onBlur={() => saveSubtaskEdit(subtask.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveSubtaskEdit(subtask.id)
                        if (e.key === 'Escape') setEditingSubtaskId(null)
                      }}
                      className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`flex-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                        subtask.isDone ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => startEditingSubtask(subtask)}
                    >
                      {subtask.title}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingSubtaskId !== subtask.id && (
                      <button
                        onClick={() => startEditingSubtask(subtask)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteSubtask(subtask.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              
              {subtasks.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  Нет подзадач
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Кнопка добавления подзадачи - появляется только в режиме редактирования */}
        {isEditing && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
            {isAddingSubtask ? (
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Новая подзадача..."
                  className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addSubtask()
                    if (e.key === 'Escape') cancelAddSubtask()
                  }}
                />
                <button
                  onClick={addSubtask}
                  className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                  title="Добавить"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={cancelAddSubtask}
                  className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                  title="Отменить"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="w-full flex items-center justify-center gap-2 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Добавить подзадачу</span>
              </button>
            )}
          </div>
        )}

        {/* Кнопки - фиксированные внизу */}
        <div className="flex flex-col xs:flex-row justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex justify-center items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
          <div className="flex flex-col xs:flex-row gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setTitle(task.title)
                    setDescription(task.description || '')
                    setIsAddingSubtask(false)
                    setNewSubtaskTitle('')
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  Сохранить
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Редактировать
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Закрыть
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}