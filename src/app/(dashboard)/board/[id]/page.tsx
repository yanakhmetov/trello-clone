// src/app/(dashboard)/board/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BoardClient } from './BoardClient'

interface BoardPageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ task?: string }>
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const session = await auth()
  const { id } = await params
  const { task: openTaskId } = await searchParams || {}

  if (!session?.user?.id) {
    redirect('/login')
  }

  const board = await prisma.board.findFirst({
    where: {
      id,
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
    redirect('/board')
  }

  return <BoardClient board={board} openTaskId={openTaskId} />
}