'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { awardActivityReward, getTaskRewardValues } from '@/lib/gamification'
import { revalidatePath } from 'next/cache'

const projectSchema = z.object({
  title: z.string().min(2, 'O título do projeto deve ter no mínimo 2 caracteres.'),
  objective: z.string().min(5, 'O objetivo deve ser detalhado (ao menos 5 caracteres).'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  availableTime: z.string().optional(),
  difficulties: z.string().optional(),
})

const taskSchema = z.object({
  title: z.string().min(2, 'O título da tarefa deve ter no mínimo 2 caracteres.'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedMinutes: z.coerce.number().min(5).max(1440).default(30),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
})

export async function createProjectAction(formData: FormData) {
  const user = await requireAuth()

  const rawData = {
    title: formData.get('title') as string,
    objective: formData.get('objective') as string,
    description: (formData.get('description') as string) || undefined,
    deadline: (formData.get('deadline') as string) || undefined,
    availableTime: (formData.get('availableTime') as string) || undefined,
    difficulties: (formData.get('difficulties') as string) || undefined,
  }

  const parsed = projectSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  try {
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: parsed.data.title.trim(),
        objective: parsed.data.objective.trim(),
        description: parsed.data.description?.trim(),
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        availableTime: parsed.data.availableTime?.trim(),
        difficulties: parsed.data.difficulties?.trim(),
        status: 'IN_PROGRESS',
      },
    })

    revalidatePath('/projetos')
    revalidatePath('/hoje')
    return { success: true, project }
  } catch (error) {
    console.error('Erro ao criar projeto:', error)
    return { error: 'Não foi possível cadastrar o projeto.' }
  }
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const user = await requireAuth()

  const rawData = {
    title: formData.get('title') as string,
    objective: formData.get('objective') as string,
    description: (formData.get('description') as string) || undefined,
    deadline: (formData.get('deadline') as string) || undefined,
    availableTime: (formData.get('availableTime') as string) || undefined,
    difficulties: (formData.get('difficulties') as string) || undefined,
  }

  const parsed = projectSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  try {
    const project = await prisma.project.update({
      where: {
        id: projectId,
        userId: user.id,
      },
      data: {
        title: parsed.data.title.trim(),
        objective: parsed.data.objective.trim(),
        description: parsed.data.description?.trim(),
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        availableTime: parsed.data.availableTime?.trim(),
        difficulties: parsed.data.difficulties?.trim(),
      },
    })

    revalidatePath('/projetos')
    revalidatePath(`/projetos/${projectId}`)
    revalidatePath('/hoje')
    return { success: true, project }
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error)
    return { error: 'Não foi possível atualizar o projeto.' }
  }
}

export async function deleteProjectAction(projectId: string) {
  const user = await requireAuth()

  try {
    await prisma.project.delete({
      where: {
        id: projectId,
        userId: user.id,
      },
    })

    revalidatePath('/projetos')
    revalidatePath('/hoje')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir projeto:', error)
    return { error: 'Não foi possível excluir o projeto.' }
  }
}

export async function createTaskAction(projectId: string, formData: FormData) {
  const user = await requireAuth()

  // 1. Verificar permissão no projeto
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
  })

  if (!project) {
    return { error: 'Projeto não encontrado ou acesso não autorizado.' }
  }

  const rawData = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    dueDate: (formData.get('dueDate') as string) || undefined,
    estimatedMinutes: formData.get('estimatedMinutes'),
    priority: (formData.get('priority') as any) || 'MEDIUM',
    difficulty: (formData.get('difficulty') as any) || 'MEDIUM',
  }

  const parsed = taskSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  try {
    const task = await prisma.task.create({
      data: {
        projectId,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim(),
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        estimatedMinutes: parsed.data.estimatedMinutes,
        priority: parsed.data.priority,
        difficulty: parsed.data.difficulty,
        status: 'PENDING',
      },
    })

    revalidatePath(`/projetos/${projectId}`)
    revalidatePath('/hoje')
    return { success: true, task }
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return { error: 'Não foi possível adicionar a tarefa.' }
  }
}

export async function toggleTaskCompleteAction(taskId: string, isCompleted: boolean) {
  const user = await requireAuth()

  try {
    // Verificar que a tarefa pertence a um projeto do usuário
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          userId: user.id,
        },
      },
    })

    if (!task) {
      return { error: 'Tarefa não encontrada ou sem permissão.' }
    }

    const newStatus = isCompleted ? 'COMPLETED' : 'PENDING'
    const completedAt = isCompleted ? new Date() : null

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt,
      },
    })

    let rewardResult = null
    if (isCompleted) {
      // Conceder XP e Moedas calculados conforme dificuldade e prioridade (RF14)
      const { xp, coins } = getTaskRewardValues(task.difficulty, task.priority)
      rewardResult = await awardActivityReward({
        userId: user.id,
        activityType: 'TASK',
        activityId: taskId,
        xp,
        coins,
      })
    }

    revalidatePath('/hoje')
    revalidatePath(`/projetos/${task.projectId}`)
    revalidatePath('/progresso')

    return {
      success: true,
      task: updatedTask,
      reward: rewardResult,
    }
  } catch (error) {
    console.error('Erro ao alternar conclusão da tarefa:', error)
    return { error: 'Não foi possível atualizar a tarefa.' }
  }
}

export async function recordTaskObstacleAction(params: {
  taskId: string
  obstacle: string
  newDueDate?: string
}) {
  const user = await requireAuth()
  const { taskId, obstacle, newDueDate } = params

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          userId: user.id,
        },
      },
    })

    if (!task) {
      return { error: 'Tarefa não encontrada ou sem permissão.' }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        obstacle: obstacle.trim(),
        dueDate: newDueDate ? new Date(newDueDate) : task.dueDate,
      },
    })

    revalidatePath('/hoje')
    revalidatePath(`/projetos/${task.projectId}`)
    return { success: true, task: updated }
  } catch (error) {
    console.error('Erro ao registrar obstáculo:', error)
    return { error: 'Falha ao registrar obstáculo da tarefa.' }
  }
}
