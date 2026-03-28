// src/app/api/boards/[boardId]/reorder-columns/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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

    const { columnIds } = await req.json()

    if (!columnIds || !Array.isArray(columnIds)) {
      return NextResponse.json(
        { error: 'columnIds array is required' },
        { status: 400 }
      )
    }

    // Проверяем доступ к доске
    const board = await prisma.board.findFirst({
      where: { id: boardId, userId: session.user.id },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Просто обновляем порядок колонок
    for (let i = 0; i < columnIds.length; i++) {
      await prisma.column.update({
        where: { id: columnIds[i] },
        data: { order: i },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering columns:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}