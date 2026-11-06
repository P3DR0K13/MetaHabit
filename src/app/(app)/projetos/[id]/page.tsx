import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProjectDetailView } from '@/components/projects/ProjectDetailView'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjetoDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  const { id } = await params

  // RF03 — Controle de acesso rigoroso no servidor
  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      tasks: {
        orderBy: [
          { status: 'asc' }, // PENDING primeiro
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      },
    },
  })

  if (!project) {
    notFound()
  }

  return <ProjectDetailView project={project as any} />
}
