'use client'

import { useState } from 'react'
import { logHabitAction } from '@/app/actions/habits'
import { Check, Repeat, Sparkles } from 'lucide-react'

interface DailyHabitItemProps {
  habit: {
    id: string
    name: string
    description?: string | null
    frequency: string
    isCompletedToday: boolean
  }
  todayDateStr: string
}

export function DailyHabitItem({ habit, todayDateStr }: DailyHabitItemProps) {
  const [completed, setCompleted] = useState(habit.isCompletedToday)
  const [loading, setLoading] = useState(false)
  const [showRewardToast, setShowRewardToast] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    const nextStatus = completed ? 'SKIPPED' : 'COMPLETED'
    setLoading(true)

    try {
      const res = await logHabitAction({
        habitId: habit.id,
        date: todayDateStr,
        status: nextStatus,
      })

      if (res.success) {
        setCompleted(nextStatus === 'COMPLETED')
        if (nextStatus === 'COMPLETED' && res.reward && !res.reward.alreadyRewarded) {
          setShowRewardToast(true)
          setTimeout(() => setShowRewardToast(false), 3000)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative group flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
        completed
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            completed
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'border-2 border-slate-700 hover:border-indigo-400 bg-slate-950/50 text-transparent'
          }`}
          title={completed ? 'Marcar como não realizado' : 'Concluir hábito hoje (+20 XP, +5 Moedas)'}
        >
          <Check className={`w-4 h-4 stroke-[3] ${completed ? 'opacity-100' : 'opacity-0'}`} />
        </button>

        <div className="min-w-0">
          <p
            className={`text-sm font-semibold truncate transition-colors ${
              completed ? 'text-slate-400 line-through' : 'text-slate-100'
            }`}
          >
            {habit.name}
          </p>
          {habit.description && (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {habit.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showRewardToast && (
          <span className="animate-bounce inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            +20 XP • +5 🪙
          </span>
        )}
        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
          {habit.frequency === 'DAILY' ? 'Diário' : 'Recorrente'}
        </span>
      </div>
    </div>
  )
}
