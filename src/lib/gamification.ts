import { prisma } from '@/lib/db'

export interface LevelProgress {
  currentLevel: number
  currentRank: string
  currentXp: number
  levelBaseXp: number
  nextLevelXp: number
  progressPercent: number
  xpRemaining: number
}

export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1)
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.pow(level - 1, 2) * 50
}

export function calculateRank(level: number): string {
  if (level >= 50) return 'Lendário (Grão-Mestre)'
  if (level >= 35) return 'Diamante (Mestre dos Hábitos)'
  if (level >= 20) return 'Platina (Estrategista)'
  if (level >= 10) return 'Ouro (Disciplinado)'
  if (level >= 5) return 'Prata (Focado)'
  return 'Bronze (Iniciante)'
}

export function getLevelProgress(xp: number): LevelProgress {
  const currentLevel = calculateLevel(xp)
  const currentRank = calculateRank(currentLevel)
  const levelBaseXp = xpForLevel(currentLevel)
  const nextLevelXp = xpForLevel(currentLevel + 1)
  const xpInCurrentLevel = Math.max(0, xp - levelBaseXp)
  const xpNeededForLevel = nextLevelXp - levelBaseXp
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100))
  const xpRemaining = Math.max(0, nextLevelXp - xp)

  return {
    currentLevel,
    currentRank,
    currentXp: xp,
    levelBaseXp,
    nextLevelXp,
    progressPercent,
    xpRemaining,
  }
}

export function getTaskRewardValues(difficulty: string, priority: string): { xp: number; coins: number } {
  let baseXP = 30
  let baseCoins = 8

  switch (difficulty?.toUpperCase()) {
    case 'EASY':
      baseXP = 15
      baseCoins = 5
      break
    case 'HARD':
      baseXP = 75
      baseCoins = 20
      break
    case 'MEDIUM':
    default:
      baseXP = 35
      baseCoins = 10
      break
  }

  if (priority?.toUpperCase() === 'URGENT') {
    baseXP = Math.round(baseXP * 1.3)
    baseCoins += 5
  } else if (priority?.toUpperCase() === 'HIGH') {
    baseXP = Math.round(baseXP * 1.15)
    baseCoins += 2
  }

  return { xp: baseXP, coins: baseCoins }
}

export async function awardActivityReward(params: {
  userId: string
  activityType: 'HABIT' | 'TASK'
  activityId: string
  xp: number
  coins: number
}) {
  const { userId, activityType, activityId, xp, coins } = params

  return await prisma.$transaction(async (tx) => {
    // 1. Verificar se a atividade já concedeu recompensa (prevenção de duplicidade RF14)
    const existing = await tx.activityReward.findUnique({
      where: {
        userId_activityType_activityId: {
          userId,
          activityType,
          activityId,
        },
      },
    })

    if (existing) {
      return {
        alreadyRewarded: true,
        xpAwarded: 0,
        coinsAwarded: 0,
      }
    }

    // 2. Criar o registro de recompensa
    await tx.activityReward.create({
      data: {
        userId,
        activityType,
        activityId,
        experiencePoints: xp,
        coins,
      },
    })

    // 3. Atualizar usuário com novo XP, Moedas, Nível e Rank recalculados
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
    })

    const newXp = user.experiencePoints + xp
    const newCoins = user.coins + coins
    const newLevel = calculateLevel(newXp)
    const newRank = calculateRank(newLevel)

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        experiencePoints: newXp,
        coins: newCoins,
        level: newLevel,
        rank: newRank,
      },
    })

    return {
      alreadyRewarded: false,
      xpAwarded: xp,
      coinsAwarded: coins,
      user: updatedUser,
      leveledUp: newLevel > user.level,
      newLevel,
      newRank,
    }
  })
}

export async function redeemStoreReward(params: {
  userId: string
  rewardId: string
}) {
  const { userId, rewardId } = params

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
    })

    const reward = await tx.reward.findFirstOrThrow({
      where: { id: rewardId, userId },
    })

    if (user.coins < reward.coinCost) {
      throw new Error(`Saldo insuficiente. Você possui ${user.coins} moedas e a recompensa custa ${reward.coinCost}.`)
    }

    // Deduzir moedas do usuário
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        coins: user.coins - reward.coinCost,
      },
    })

    // Criar histórico de resgate
    const redemption = await tx.rewardRedemption.create({
      data: {
        userId,
        rewardId,
        coinCostAtRedemption: reward.coinCost,
      },
      include: {
        reward: true,
      },
    })

    return {
      success: true,
      redemption,
      remainingCoins: updatedUser.coins,
    }
  })
}
