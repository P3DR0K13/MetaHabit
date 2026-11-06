'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { redeemStoreReward } from '@/lib/gamification'
import { revalidatePath } from 'next/cache'

const rewardSchema = z.object({
  name: z.string().min(2, 'O nome da recompensa deve ter ao menos 2 caracteres.'),
  description: z.string().optional(),
  coinCost: z.coerce.number().min(1, 'O custo deve ser de no mínimo 1 moeda.'),
})

export async function createRewardAction(formData: FormData) {
  const user = await requireAuth()

  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    coinCost: formData.get('coinCost'),
  }

  const parsed = rewardSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  try {
    const reward = await prisma.reward.create({
      data: {
        userId: user.id,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim(),
        coinCost: parsed.data.coinCost,
      },
    })

    revalidatePath('/loja')
    return { success: true, reward }
  } catch (error) {
    console.error('Erro ao cadastrar recompensa:', error)
    return { error: 'Não foi possível cadastrar a recompensa.' }
  }
}

export async function updateRewardAction(rewardId: string, formData: FormData) {
  const user = await requireAuth()

  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    coinCost: formData.get('coinCost'),
  }

  const parsed = rewardSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  try {
    const reward = await prisma.reward.update({
      where: {
        id: rewardId,
        userId: user.id,
      },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim(),
        coinCost: parsed.data.coinCost,
      },
    })

    revalidatePath('/loja')
    return { success: true, reward }
  } catch (error) {
    console.error('Erro ao atualizar recompensa:', error)
    return { error: 'Não foi possível atualizar a recompensa.' }
  }
}

export async function deleteRewardAction(rewardId: string) {
  const user = await requireAuth()

  try {
    await prisma.reward.delete({
      where: {
        id: rewardId,
        userId: user.id,
      },
    })

    revalidatePath('/loja')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir recompensa:', error)
    return { error: 'Não foi possível excluir a recompensa.' }
  }
}

export async function redeemRewardAction(rewardId: string) {
  const user = await requireAuth()

  try {
    const result = await redeemStoreReward({
      userId: user.id,
      rewardId,
    })

    revalidatePath('/loja')
    revalidatePath('/hoje')
    revalidatePath('/progresso')

    return {
      success: true,
      remainingCoins: result.remainingCoins,
      redemption: result.redemption,
    }
  } catch (error: any) {
    console.error('Erro ao resgatar recompensa:', error)
    return { error: error.message || 'Falha ao processar o resgate da recompensa.' }
  }
}
