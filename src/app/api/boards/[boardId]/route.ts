// src/app/api/boards/[boardId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await auth()
    const { boardId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId: session.user.id,
      },
      include: {
        columns: {
          include: {
            tasks: {
              include: {
                subtasks: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error fetching board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await auth()
    const { boardId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description } = await req.json()

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId: session.user.id,
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(updatedBoard)
  } catch (error) {
    console.error('Error updating board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await auth()
    const { boardId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId: session.user.id,
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Удаляем доску (каскадное удаление удалит все колонки, задачи и подзадачи)
    await prisma.board.delete({
      where: { id: boardId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}