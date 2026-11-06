import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectsList } from '@/components/projects/ProjectsList'

export const dynamic = 'force-dynamic'

export default async function ProjetosPage() {
  const user = await requireAuth()

  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
    },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return <ProjectsList initialProjects={projects as any} />
}
