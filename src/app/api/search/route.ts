// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.trim()

    // Ищем задачи
    const tasks = await prisma.task.findMany({
      where: {
        column: {
          board: {
            userId: session.user.id,
          },
        },
        OR: [
          {
            title: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        column: {
          include: {
            board: true,
          },
        },
        subtasks: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    })

    // Ищем подзадачи
    const subtasks = await prisma.subtask.findMany({
      where: {
        title: {
          contains: searchQuery,
          mode: 'insensitive',
        },
        task: {
          column: {
            board: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
            subtasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    })

    // Форматируем результаты
    const formattedTasks = tasks.map(task => ({
      type: 'task' as const,
      id: task.id,
      title: task.title,
      description: task.description,
      updatedAt: task.updatedAt,
      board: {
        id: task.column.board.id,
        title: task.column.board.title,
      },
      columnTitle: task.column.title,
      taskTitle: task.title,
      subtasksCount: task.subtasks.length,
      completedSubtasks: task.subtasks.filter(s => s.isDone).length,
    }))

    const formattedSubtasks = subtasks.map(subtask => ({
      type: 'subtask' as const,
      id: subtask.id,
      title: subtask.title,
      description: null,
      updatedAt: subtask.updatedAt,
      board: {
        id: subtask.task.column.board.id,
        title: subtask.task.column.board.title,
      },
      columnTitle: subtask.task.column.title,
      taskTitle: subtask.task.title,
      taskId: subtask.task.id,
      isDone: subtask.isDone,
      subtasksCount: subtask.task.subtasks.length,
      completedSubtasks: subtask.task.subtasks.filter(s => s.isDone).length,
    }))

    // Объединяем и сортируем по updatedAt
    const allResults = [...formattedTasks, ...formattedSubtasks].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    // Группируем по доскам
    const resultsByBoard = allResults.reduce((acc, result) => {
      const boardId = result.board.id
      if (!acc[boardId]) {
        acc[boardId] = {
          board: result.board,
          items: [],
        }
      }
      acc[boardId].items.push(result)
      return acc
    }, {} as Record<string, { board: { id: string; title: string }; items: typeof allResults }>)

    return NextResponse.json({
      results: Object.values(resultsByBoard),
      total: allResults.length,
    })
  } catch (error) {
    console.error('Error searching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}