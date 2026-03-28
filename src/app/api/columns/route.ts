// src/app/api/columns/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, boardId } = await req.json()

    if (!title || !boardId) {
      return NextResponse.json(
        { error: 'Title and boardId are required' },
        { status: 400 }
      )
    }

    // Проверяем доступ к доске
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId: session.user.id,
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Получаем максимальный order для колонок в этой доске
    const maxOrder = await prisma.column.aggregate({
      where: { boardId },
      _max: { order: true },
    })

    const newOrder = (maxOrder._max.order ?? -1) + 1

    const column = await prisma.column.create({
      data: {
        title,
        order: newOrder,
        boardId,
      },
      include: {
        tasks: true,
      },
    })

    return NextResponse.json(column, { status: 201 })
  } catch (error) {
    console.error('Error creating column:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}