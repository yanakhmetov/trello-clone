// src/app/(dashboard)/board/[id]/modals/CreateTaskModal.tsx
'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Task } from '@/types'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  columnId: string
  boardId: string
  onTaskCreated: (task: Task) => void
}

export function CreateTaskModal({
  isOpen,
  onClose,
  columnId,
  boardId,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const addSubtask = () => {
    setSubtasks([...subtasks, ''])
  }

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks]
    newSubtasks[index] = value
    setSubtasks(newSubtasks)
  }

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          columnId,
          boardId,
          subtasks: subtasks.filter(s => s.trim()),
        }),
      })

      if (!response.ok) throw new Error('Failed to create task')

      const newTask: Task = await response.json()
      onTaskCreated(newTask)
      setTitle('')
      setDescription('')
      setSubtasks([])
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Создать задачу</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Подзадачи
              </label>
              <button
                type="button"
                onClick={addSubtask}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                + Добавить
              </button>
            </div>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={subtask}
                    onChange={(e) => updateSubtask(index, e.target.value)}
                    placeholder="Подзадача"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubtask(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}