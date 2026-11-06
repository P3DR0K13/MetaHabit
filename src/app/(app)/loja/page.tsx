import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StoreManager } from '@/components/store/StoreManager'

export const dynamic = 'force-dynamic'

export default async function LojaPage() {
  const user = await requireAuth()

  // 1. Recompensas cadastradas pelo usuário
  const rewards = await prisma.reward.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      coinCost: 'asc',
    },
  })

  // 2. Histórico de resgates
  const redemptions = await prisma.rewardRedemption.findMany({
    where: {
      userId: user.id,
    },
    include: {
      reward: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      redeemedAt: 'desc',
    },
    take: 20,
  })

  return (
    <StoreManager
      initialRewards={rewards as any}
      initialRedemptions={redemptions as any}
      userCoins={user.coins}
    />
  )
}
