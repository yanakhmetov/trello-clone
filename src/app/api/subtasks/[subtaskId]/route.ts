// src/app/api/subtasks/[subtaskId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ subtaskId: string }> }
) {
  try {
    const session = await auth()
    const { subtaskId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isDone, title } = await req.json()

    // Проверяем доступ
    const subtask = await prisma.subtask.findFirst({
      where: {
        id: subtaskId,
        task: {
          column: {
            board: {
              userId: session.user.id,
            },
          },
        },
      },
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(isDone !== undefined && { isDone }),
        ...(title !== undefined && { title }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ subtaskId: string }> }
) {
  try {
    const session = await auth()
    const { subtaskId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем доступ
    const subtask = await prisma.subtask.findFirst({
      where: {
        id: subtaskId,
        task: {
          column: {
            board: {
              userId: session.user.id,
            },
          },
        },
      },
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    await prisma.subtask.delete({
      where: { id: subtaskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}