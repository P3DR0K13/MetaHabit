'use server'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  generateProjectPlanWithAI,
  adaptProjectPlanWithAI,
  GeneratedTaskProposal,
} from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

export async function requestAIPlanAction(params: {
  projectId: string
  referenceMaterials?: string
}) {
  const user = await requireAuth()
  const { projectId, referenceMaterials } = params

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
  })

  if (!project) {
    return { error: 'Projeto não encontrado ou acesso não autorizado.' }
  }

  try {
    const planResult = await generateProjectPlanWithAI({
      title: project.title,
      objective: project.objective,
      description: project.description || undefined,
      deadline: project.deadline ? project.deadline.toISOString().split('T')[0] : undefined,
      availableTime: project.availableTime || undefined,
      difficulties: project.difficulties || undefined,
      referenceMaterials,
    })

    return {
      success: true,
      planResult,
    }
  } catch (error) {
    console.error('Erro na solicitação de plano via IA:', error)
    return {
      error: 'Não foi possível gerar a sugestão da IA no momento. Os dados do seu projeto foram preservados.',
    }
  }
}

export async function confirmAIPlanAction(params: {
  projectId: string
  approvedTasks: GeneratedTaskProposal[]
}) {
  const user = await requireAuth()
  const { projectId, approvedTasks } = params

  if (!approvedTasks || approvedTasks.length === 0) {
    return { error: 'Nenhuma tarefa foi selecionada para inclusão no projeto.' }
  }

  // Verificar permissão
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
  })

  if (!project) {
    return { error: 'Projeto não encontrado.' }
  }

  try {
    // Persistir apenas as tarefas aprovadas pelo usuário (RF10, CA10)
    const today = new Date()
    const tasksToInsert = approvedTasks.map((t) => {
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + (t.dayOffset || 1))

      return {
        projectId,
        title: t.title.trim(),
        description: t.description?.trim() || null,
        dueDate,
        estimatedMinutes: t.estimatedMinutes || 30,
        priority: t.priority || 'MEDIUM',
        difficulty: t.difficulty || 'MEDIUM',
        status: 'PENDING',
      }
    })

    await prisma.$transaction(
      tasksToInsert.map((data) => prisma.task.create({ data }))
    )

    revalidatePath(`/projetos/${projectId}`)
    revalidatePath('/projetos')
    revalidatePath('/hoje')

    return {
      success: true,
      count: tasksToInsert.length,
    }
  } catch (error) {
    console.error('Erro ao salvar tarefas aprovadas do plano:', error)
    return { error: 'Falha ao gravar as tarefas aprovadas no projeto.' }
  }
}

export async function requestAIAdaptationAction(params: {
  projectId: string
  reportedDifficulties: string
}) {
  const user = await requireAuth()
  const { projectId, reportedDifficulties } = params

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
    include: {
      tasks: {
        where: {
          status: 'PENDING',
        },
      },
    },
  })

  if (!project) {
    return { error: 'Projeto não encontrado.' }
  }

  if (project.tasks.length === 0) {
    return { error: 'Não há tarefas pendentes neste projeto para adaptar.' }
  }

  try {
    const result = await adaptProjectPlanWithAI({
      projectTitle: project.title,
      reportedDifficulties,
      pendingTasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        difficulty: t.difficulty,
        estimatedMinutes: t.estimatedMinutes || 30,
      })),
    })

    return {
      success: true,
      adaptationResult: result,
    }
  } catch (error) {
    console.error('Erro na solicitação de adaptação:', error)
    return { error: 'Não foi possível adaptar o plano. Seus dados permanecem intactos.' }
  }
}

export async function confirmAIAdaptationAction(params: {
  projectId: string
  approvedAdjustments: {
    originalTaskId?: string
    title: string
    description?: string
    newDueDateOffset: number
    estimatedMinutes: number
    priority: string
    difficulty: string
  }[]
}) {
  const user = await requireAuth()
  const { projectId, approvedAdjustments } = params

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
  })

  if (!project) {
    return { error: 'Projeto não encontrado.' }
  }

  try {
    const today = new Date()

    await prisma.$transaction(
      approvedAdjustments.map((adj) => {
        const newDueDate = new Date(today)
        newDueDate.setDate(newDueDate.getDate() + (adj.newDueDateOffset || 1))

        if (adj.originalTaskId) {
          return prisma.task.update({
            where: { id: adj.originalTaskId },
            data: {
              title: adj.title,
              description: adj.description,
              dueDate: newDueDate,
              estimatedMinutes: adj.estimatedMinutes,
              priority: adj.priority,
              difficulty: adj.difficulty,
            },
          })
        } else {
          return prisma.task.create({
            data: {
              projectId,
              title: adj.title,
              description: adj.description,
              dueDate: newDueDate,
              estimatedMinutes: adj.estimatedMinutes,
              priority: adj.priority,
              difficulty: adj.difficulty,
              status: 'PENDING',
            },
          })
        }
      })
    )

    revalidatePath(`/projetos/${projectId}`)
    revalidatePath('/hoje')
    return { success: true }
  } catch (error) {
    console.error('Erro ao aplicar adaptação de tarefas:', error)
    return { error: 'Não foi possível aplicar as alterações.' }
  }
}
