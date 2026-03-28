// src/app/api/columns/[columnId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const session = await auth()
    const { columnId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await req.json()

    // Проверяем доступ
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          userId: session.user.id,
        },
      },
    })

    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 })
    }

    const updated = await prisma.column.update({
      where: { id: columnId },
      data: { title },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating column:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const session = await auth()
    const { columnId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем доступ
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          userId: session.user.id,
        },
      },
    })

    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 })
    }

    await prisma.column.delete({
      where: { id: columnId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting column:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}