'use client'

import { useState } from 'react'
import { recordTaskObstacleAction } from '@/app/actions/projects'
import { AlertCircle, Calendar, X } from 'lucide-react'

interface ObstacleModalProps {
  task: {
    id: string
    title: string
    dueDate?: Date | string | null
  }
  isOpen: boolean
  onClose: () => void
}

export function ObstacleModal({ task, isOpen, onClose }: ObstacleModalProps) {
  const [obstacle, setObstacle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obstacle.trim()) {
      setError('Por favor, informe a dificuldade ou motivo.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await recordTaskObstacleAction({
        taskId: task.id,
        obstacle: obstacle.trim(),
        newDueDate: newDueDate || undefined,
      })

      if (res.error) {
        setError(res.error)
      } else {
        onClose()
      }
    } catch {
      setError('Ocorreu um erro ao registrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Registrar Dificuldade / Reagendar
          </h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Tarefa: <strong>{task.title}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              O que impediu a conclusão?
            </label>
            <textarea
              required
              rows={3}
              value={obstacle}
              onChange={(e) => setObstacle(e.target.value)}
              placeholder="Ex: Falta de tempo, imprevisto de trabalho, dúvida na execução..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Reagendar para quando? (Opcional)
            </label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar e Reagendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
