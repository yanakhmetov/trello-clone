// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, columnId, boardId, subtasks } = await req.json()

    // Проверяем доступ к доске
    const board = await prisma.board.findFirst({
      where: { id: boardId, userId: session.user.id },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Получаем количество задач в колонке
    const tasksCount = await prisma.task.count({
      where: { columnId },
    })

    // Создаем задачу с order = количеству задач
    const task = await prisma.task.create({
      data: {
        title,
        description,
        order: tasksCount, // Просто ставим в конец
        columnId,
        subtasks: {
          create: subtasks.map((subtitle: string) => ({ title: subtitle })),
        },
      },
      include: {
        subtasks: true,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}