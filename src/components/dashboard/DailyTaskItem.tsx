'use client'

import { useState } from 'react'
import { toggleTaskCompleteAction } from '@/app/actions/projects'
import { ObstacleModal } from './ObstacleModal'
import {
  Check,
  Clock,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Folder,
} from 'lucide-react'

interface DailyTaskItemProps {
  task: {
    id: string
    title: string
    description?: string | null
    dueDate?: Date | string | null
    estimatedMinutes?: number | null
    priority: string
    difficulty: string
    status: string
    obstacle?: string | null
    project: {
      id: string
      title: string
    }
  }
}

export function DailyTaskItem({ task }: DailyTaskItemProps) {
  const [completed, setCompleted] = useState(task.status === 'COMPLETED')
  const [loading, setLoading] = useState(false)
  const [showRewardToast, setShowRewardToast] = useState<{ xp: number; coins: number } | null>(null)
  const [isObstacleModalOpen, setIsObstacleModalOpen] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    const nextCompleted = !completed
    setLoading(true)

    try {
      const res = await toggleTaskCompleteAction(task.id, nextCompleted)
      if (res.success) {
        setCompleted(nextCompleted)
        if (nextCompleted && res.reward && !res.reward.alreadyRewarded) {
          setShowRewardToast({
            xp: res.reward.xpAwarded,
            coins: res.reward.coinsAwarded,
          })
          setTimeout(() => setShowRewardToast(null), 3500)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const priorityColors: Record<string, string> = {
    URGENT: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    HIGH: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    MEDIUM: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    LOW: 'text-slate-400 bg-slate-800/80 border-slate-700',
  }

  const difficultyLabels: Record<string, string> = {
    EASY: 'Fácil (+15 XP)',
    MEDIUM: 'Média (+35 XP)',
    HARD: 'Difícil (+75 XP)',
  }

  return (
    <>
      <div
        className={`relative group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 transition-all ${
          completed
            ? 'bg-emerald-950/15 border-emerald-500/25'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-7 h-7 mt-0.5 sm:mt-0 rounded-lg shrink-0 flex items-center justify-center transition-all cursor-pointer ${
              completed
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'border-2 border-slate-700 hover:border-indigo-400 bg-slate-950/50 text-transparent'
            }`}
            title={completed ? 'Reabrir tarefa' : 'Concluir tarefa'}
          >
            <Check className={`w-4 h-4 stroke-[3] ${completed ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                <Folder className="w-3 h-3 text-indigo-400" />
                <span className="truncate max-w-[140px]">{task.project.title}</span>
              </span>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  priorityColors[task.priority] || priorityColors.MEDIUM
                }`}
              >
                {task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : task.priority === 'LOW' ? 'Baixa' : 'Média'}
              </span>

              {task.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  {task.estimatedMinutes}m
                </span>
              )}
            </div>

            <p
              className={`text-sm font-semibold mt-1 transition-colors ${
                completed ? 'text-slate-400 line-through' : 'text-slate-100'
              }`}
            >
              {task.title}
            </p>

            {task.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {task.description}
              </p>
            )}

            {task.obstacle && (
              <p className="text-[11px] text-amber-400/90 mt-1 inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Obstáculo: {task.obstacle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          {showRewardToast && (
            <span className="animate-bounce inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              +{showRewardToast.xp} XP • +{showRewardToast.coins} 🪙
            </span>
          )}

          {!completed && (
            <button
              onClick={() => setIsObstacleModalOpen(true)}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
              title="Registrar que não conseguiu fazer e reagendar"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dificuldade</span>
            </button>
          )}

          <span className="text-[11px] text-slate-400 hidden lg:inline">
            {difficultyLabels[task.difficulty] || 'Média'}
          </span>
        </div>
      </div>

      <ObstacleModal
        task={task}
        isOpen={isObstacleModalOpen}
        onClose={() => setIsObstacleModalOpen(false)}
      />
    </>
  )
}
