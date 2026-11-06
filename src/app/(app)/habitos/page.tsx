import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HabitsManager } from '@/components/habits/HabitsManager'

export const dynamic = 'force-dynamic'

export default async function HabitosPage() {
  const user = await requireAuth()

  const habits = await prisma.habit.findMany({
    where: {
      userId: user.id,
    },
    include: {
      _count: {
        select: { logs: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return <HabitsManager initialHabits={habits as any} />
}
