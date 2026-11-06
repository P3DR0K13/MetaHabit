'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { awardActivityReward } from '@/lib/gamification'
import { revalidatePath } from 'next/cache'

const habitSchema = z.object({
  name: z.string().min(2, 'O nome do hábito deve ter no mínimo 2 caracteres.'),
  description: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'SPECIFIC_DAYS']).default('DAILY'),
})

export async function createHabitAction(formData: FormData) {
  const user = await requireAuth()

  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    frequency: (formData.get('frequency') as any) || 'DAILY',
  }

  const parsed = habitSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  try {
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim(),
        frequency: parsed.data.frequency,
        status: 'ACTIVE',
      },
    })

    revalidatePath('/hoje')
    revalidatePath('/habitos')
    return { success: true, habit }
  } catch (error) {
    console.error('Erro ao criar hábito:', error)
    return { error: 'Não foi possível cadastrar o hábito.' }
  }
}

export async function updateHabitAction(habitId: string, formData: FormData) {
  const user = await requireAuth()

  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    frequency: (formData.get('frequency') as any) || 'DAILY',
  }

  const parsed = habitSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  try {
    // RF03 — Controle de acesso: garantir que pertence ao usuário
    const habit = await prisma.habit.update({
      where: {
        id: habitId,
        userId: user.id,
      },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim(),
        frequency: parsed.data.frequency,
      },
    })

    revalidatePath('/hoje')
    revalidatePath('/habitos')
    return { success: true, habit }
  } catch (error) {
    console.error('Erro ao atualizar hábito:', error)
    return { error: 'Não foi possível atualizar o hábito.' }
  }
}

export async function toggleHabitStatusAction(habitId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const user = await requireAuth()

  try {
    const habit = await prisma.habit.update({
      where: {
        id: habitId,
        userId: user.id,
      },
      data: {
        status: newStatus,
      },
    })

    revalidatePath('/hoje')
    revalidatePath('/habitos')
    return { success: true, habit }
  } catch (error) {
    console.error('Erro ao alterar status do hábito:', error)
    return { error: 'Não foi possível alterar o status do hábito.' }
  }
}

export async function deleteHabitAction(habitId: string) {
  const user = await requireAuth()

  try {
    await prisma.habit.delete({
      where: {
        id: habitId,
        userId: user.id,
      },
    })

    revalidatePath('/hoje')
    revalidatePath('/habitos')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir hábito:', error)
    return { error: 'Não foi possível excluir o hábito.' }
  }
}

export async function logHabitAction(params: {
  habitId: string
  date: string // Formato YYYY-MM-DD
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED'
  notes?: string
}) {
  const user = await requireAuth()
  const { habitId, date, status, notes } = params

  try {
    // 1. Verificar propriedade do hábito
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
      },
    })

    if (!habit) {
      return { error: 'Hábito não encontrado ou sem permissão.' }
    }

    // 2. Criar ou atualizar o registro do hábito para a data (RF05: restrição de unicidade habitId + completedDate)
    const log = await prisma.habitLog.upsert({
      where: {
        habitId_completedDate: {
          habitId,
          completedDate: date,
        },
      },
      create: {
        habitId,
        completedDate: date,
        status,
        notes: notes?.trim() || null,
      },
      update: {
        status,
        notes: notes?.trim() || null,
      },
    })

    // 3. Se marcado como concluído, conceder recompensa em XP e Moedas (RF14)
    let rewardResult = null
    if (status === 'COMPLETED') {
      rewardResult = await awardActivityReward({
        userId: user.id,
        activityType: 'HABIT',
        activityId: `${habitId}_${date}`,
        xp: 20,
        coins: 5,
      })
    }

    revalidatePath('/hoje')
    revalidatePath('/habitos')
    revalidatePath('/progresso')

    return {
      success: true,
      log,
      reward: rewardResult,
    }
  } catch (error) {
    console.error('Erro ao registrar hábito:', error)
    return { error: 'Falha ao registrar execução do hábito.' }
  }
}

export async function getUserHabitsWithTodayStatus(dateStr: string) {
  const user = await requireAuth()

  const habits = await prisma.habit.findMany({
    where: {
      userId: user.id,
      status: 'ACTIVE',
    },
    include: {
      logs: {
        where: {
          completedDate: dateStr,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return habits.map((habit) => {
    const todayLog = habit.logs[0] || null
    return {
      ...habit,
      isCompletedToday: todayLog?.status === 'COMPLETED',
      todayStatus: todayLog?.status || 'PENDING',
      todayLog,
    }
  })
}
