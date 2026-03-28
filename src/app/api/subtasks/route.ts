// src/app/api/subtasks/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, taskId } = await req.json()

    if (!title || !taskId) {
      return NextResponse.json(
        { error: 'Title and taskId are required' },
        { status: 400 }
      )
    }

    // Проверяем доступ к задаче
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        column: {
          board: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId,
      },
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}