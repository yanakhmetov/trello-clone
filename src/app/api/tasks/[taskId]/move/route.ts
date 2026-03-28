// src/app/api/tasks/[taskId]/move/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    const { taskId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newColumnId, newOrder, boardId } = await req.json()

    // Проверяем доступ к доске
    const board = await prisma.board.findFirst({
      where: { id: boardId, userId: session.user.id },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Получаем текущую задачу
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Получаем все задачи в новой колонке
    const tasksInNewColumn = await prisma.task.findMany({
      where: { columnId: newColumnId },
      orderBy: { order: 'asc' },
    })

    // Создаем массив задач для новой колонки
    let updatedTasks = [...tasksInNewColumn]
    
    // Удаляем задачу из старой колонки, если она там есть
    updatedTasks = updatedTasks.filter(t => t.id !== taskId)
    
    // Вставляем задачу на новую позицию
    const insertIndex = Math.min(newOrder, updatedTasks.length)
    updatedTasks.splice(insertIndex, 0, { ...task, columnId: newColumnId })

    // Обновляем order для всех задач в новой колонке
    for (let i = 0; i < updatedTasks.length; i++) {
      await prisma.task.update({
        where: { id: updatedTasks[i].id },
        data: {
          order: i,
          columnId: newColumnId,
        },
      })
    }

    // Если перемещение было в другую колонку, обновляем порядок в старой колонке
    if (task.columnId !== newColumnId) {
      const tasksInOldColumn = await prisma.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      })
      
      for (let i = 0; i < tasksInOldColumn.length; i++) {
        await prisma.task.update({
          where: { id: tasksInOldColumn[i].id },
          data: { order: i },
        })
      }
    }

    // Получаем обновленную задачу
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { subtasks: true },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error moving task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}