// src/app/api/boards/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description } = await req.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Создаем доску с тремя стандартными колонками на русском языке
    const board = await prisma.board.create({
      data: {
        title,
        description,
        userId: session.user.id,
        columns: {
          create: [
            { title: '📝 Нужно сделать', order: 0 },
            { title: '🔄 В процессе', order: 1 },
            { title: '✅ Готово', order: 2 },
          ],
        },
      },
      include: {
        columns: true,
      },
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boards = await prisma.board.findMany({
      where: { userId: session.user.id },
      include: {
        columns: {
          include: {
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}