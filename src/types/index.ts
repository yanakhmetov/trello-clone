// src/types/index.ts

export interface Subtask {
  id: string
  title: string
  isDone: boolean
  taskId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Column {
  id: string
  title: string
  order: number
  boardId: string
  tasks: Task[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Board {
  id: string
  title: string
  description: string | null
  userId: string
  columns: Column[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Task {
  id: string
  title: string
  description: string | null
  order: number
  columnId: string
  column?: Column // Добавляем опциональное поле column для include
  createdAt: Date
  updatedAt: Date
  subtasks: Subtask[]
}