'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTaskAction, toggleTaskCompleteAction } from '@/app/actions/projects'
import { AIPlanReviewModal } from './AIPlanReviewModal'
import { AIAdaptModal } from './AIAdaptModal'
import {
  Sparkles,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  ListTodo,
  AlertCircle,
  HelpCircle,
  X,
  Repeat,
  FolderKanban,
  Check,
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string | null
  dueDate?: Date | string | null
  estimatedMinutes?: number | null
  priority: string
  difficulty: string
  status: string
  obstacle?: string | null
  completedAt?: Date | string | null
}

interface Project {
  id: string
  title: string
  objective: string
  description?: string | null
  deadline?: Date | string | null
  availableTime?: string | null
  difficulties?: string | null
  status: string
  tasks: Task[]
}

export function ProjectDetailView({ project: initialProject }: { project: Project }) {
  const router = useRouter()
  const [project, setProject] = useState<Project>(initialProject)
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')

  // Modals state
  const [isAIPlanModalOpen, setIsAIPlanModalOpen] = useState(false)
  const [isAIAdaptModalOpen, setIsAIAdaptModalOpen] = useState(false)
  const [isManualTaskModalOpen, setIsManualTaskModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)

  const completedCount = project.tasks.filter((t) => t.status === 'COMPLETED').length
  const totalCount = project.tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const filteredTasks = project.tasks.filter((t) => {
    if (activeTab === 'PENDING') return t.status === 'PENDING'
    if (activeTab === 'COMPLETED') return t.status === 'COMPLETED'
    return true
  })

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextCompleted = currentStatus !== 'COMPLETED'
    try {
      const res = await toggleTaskCompleteAction(taskId, nextCompleted)
      if (res.success && res.task) {
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? (res.task as any) : t)),
        }))
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateManualTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setTaskError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await createTaskAction(project.id, formData)
      if (res.error) {
        setTaskError(res.error)
      } else if (res.task) {
        setProject((prev) => ({
          ...prev,
          tasks: [res.task as any, ...prev.tasks],
        }))
        setIsManualTaskModalOpen(false)
        router.refresh()
      }
    } catch {
      setTaskError('Erro ao criar tarefa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <div>
        <Link
          href="/projetos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Projetos</span>
        </Link>
      </div>

      {/* Project Card Header */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Projeto Ativo
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              {project.title}
            </h1>
          </div>

          {/* AI and Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAIPlanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Plano com IA</span>
            </button>

            {project.tasks.length > 0 && (
              <button
                onClick={() => setIsAIAdaptModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs border border-amber-500/30 transition-colors cursor-pointer"
                title="Relatar atraso ou mudança para a IA reorganizar as tarefas"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Adaptar com IA</span>
              </button>
            )}

            <button
              onClick={() => setIsManualTaskModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {project.objective}
        </p>

        {/* Context metadata (available time, deadline, difficulties) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Prazo Final</span>
            <span className="font-medium text-slate-200">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString('pt-BR')
                : 'Não definido'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Disponibilidade</span>
            <span className="font-medium text-slate-200">
              {project.availableTime || 'Não informada'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Dificuldades Previstas</span>
            <span className="font-medium text-slate-200 line-clamp-1">
              {project.difficulties || 'Nenhuma informada'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Progresso do Projeto</span>
            <span className="font-semibold text-slate-200">
              {completedCount} de {totalCount} concluídas ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks Section with Filter Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'PENDING'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendentes ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'COMPLETED'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Concluídas ({completedCount})
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
            <p className="text-xs text-slate-400">
              Nenhuma tarefa nesta visualização.
            </p>
            {project.tasks.length === 0 && (
              <button
                onClick={() => setIsAIPlanModalOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Plano com IA Agora</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'COMPLETED'
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                    isDone
                      ? 'bg-emerald-950/15 border-emerald-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className={`w-6 h-6 mt-0.5 rounded-lg shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : 'border-2 border-slate-700 hover:border-indigo-400 bg-slate-950/50 text-transparent'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold transition-colors ${
                          isDone ? 'text-slate-400 line-through' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {task.description}
                        </p>
                      )}
                      {task.obstacle && (
                        <p className="text-[11px] text-amber-400 mt-1">
                          ⚠️ Obstáculo registrado: {task.obstacle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
                    {task.estimatedMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimatedMinutes}m
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">
                      {task.priority}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Nova Tarefa Manual */}
      {isManualTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsManualTaskModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">
              Adicionar Tarefa ao Projeto
            </h2>

            {taskError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateManualTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="O que deve ser feito?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Detalhes ou critérios de conclusão..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Prazo
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Duração Estimada
                  </label>
                  <input
                    type="number"
                    name="estimatedMinutes"
                    defaultValue={30}
                    min={5}
                    step={5}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Dificuldade
                  </label>
                  <select
                    name="difficulty"
                    defaultValue="MEDIUM"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EASY">Fácil (+15 XP)</option>
                    <option value="MEDIUM">Média (+35 XP)</option>
                    <option value="HARD">Difícil (+75 XP)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Plan Review Modal (RF08, RF09, RF10) */}
      <AIPlanReviewModal
        projectId={project.id}
        projectTitle={project.title}
        isOpen={isAIPlanModalOpen}
        onClose={() => setIsAIPlanModalOpen(false)}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* AI Adapt Modal (RF19, RF20) */}
      <AIAdaptModal
        projectId={project.id}
        projectTitle={project.title}
        isOpen={isAIAdaptModalOpen}
        onClose={() => setIsAIAdaptModalOpen(false)}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
