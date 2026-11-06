'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createProjectAction, deleteProjectAction } from '@/app/actions/projects'
import {
  FolderKanban,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react'

interface Project {
  id: string
  title: string
  objective: string
  description?: string | null
  deadline?: Date | string | null
  availableTime?: string | null
  difficulties?: string | null
  status: string
  createdAt: Date | string
  tasks: {
    id: string
    status: string
  }[]
}

interface ProjectsListProps {
  initialProjects: Project[]
}

export function ProjectsList({ initialProjects }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await createProjectAction(formData)
      if (res.error) {
        setError(res.error)
      } else if (res.project) {
        setProjects((prev) => [{ ...res.project, tasks: [] } as any, ...prev])
        setIsModalOpen(false)
      }
    } catch {
      setError('Ocorreu um erro ao criar o projeto.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Deseja realmente excluir este projeto e todas as suas tarefas?')) return

    try {
      const res = await deleteProjectAction(projectId)
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
      }
    } catch {
      alert('Erro ao excluir projeto.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Projetos & Missões
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Transforme objetivos em etapas concretas com auxílio da IA.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Projeto</span>
        </button>
      </div>

      {/* Grid of Projects */}
      {projects.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Nenhum projeto em andamento</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Crie seu primeiro projeto informando seu objetivo e deixe a IA propor as missões necessárias.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Projeto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const totalTasks = project.tasks.length
            const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length
            const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <Link
                key={project.id}
                href={`/projetos/${project.id}`}
                className="group p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {project.status === 'COMPLETED' ? 'Concluído' : 'Em Progresso'}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {project.objective}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Progresso</span>
                      <span className="font-semibold text-slate-200">
                        {completedTasks}/{totalTasks} tarefas ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline & Meta info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString('pt-BR')
                          : 'Sem prazo'}
                      </span>
                    </div>
                    <span className="text-indigo-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Abrir <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal Criar Projeto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Planejamento Inteligente</span>
              </div>
              <h2 className="text-lg font-bold text-white">Criar Novo Projeto</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Preencha os detalhes do seu objetivo. Você poderá solicitar um plano de tarefas para a IA logo em seguida.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Título do Projeto *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Aprender Next.js 15, Passar no Concurso, Lançar MVP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Objetivo Principal e Resultado Desejado *
                </label>
                <textarea
                  name="objective"
                  required
                  rows={2}
                  placeholder="O que exatamente significa ter sucesso neste projeto?"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Prazo Final (Deadline)
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Disponibilidade de Tempo
                  </label>
                  <input
                    type="text"
                    name="availableTime"
                    placeholder="Ex: 1h por dia, 5h no sábado"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Dificuldades ou Obstáculos Conhecidos
                </label>
                <input
                  type="text"
                  name="difficulties"
                  placeholder="Ex: Pouco conhecimento prévio, cansaço no final do dia"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
