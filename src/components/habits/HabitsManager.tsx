'use client'

import { useState } from 'react'
import {
  createHabitAction,
  updateHabitAction,
  toggleHabitStatusAction,
  deleteHabitAction,
} from '@/app/actions/habits'
import {
  Plus,
  Repeat,
  Pause,
  Play,
  Trash2,
  Edit2,
  X,
  Calendar,
  CheckCircle2,
} from 'lucide-react'

interface Habit {
  id: string
  name: string
  description?: string | null
  frequency: string
  status: string
  createdAt: Date | string
  _count?: {
    logs: number
  }
}

interface HabitsManagerProps {
  initialHabits: Habit[]
}

export function HabitsManager({ initialHabits }: HabitsManagerProps) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCreateModal = () => {
    setEditingHabit(null)
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (h: Habit) => {
    setEditingHabit(h)
    setError(null)
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (habit: Habit) => {
    const nextStatus = habit.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setLoading(true)
    try {
      const res = await toggleHabitStatusAction(habit.id, nextStatus)
      if (res.success) {
        setHabits((prev) =>
          prev.map((h) => (h.id === habit.id ? { ...h, status: nextStatus } : h))
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (habitId: string) => {
    if (!confirm('Deseja realmente excluir este hábito e seu histórico?')) return
    setLoading(true)
    try {
      const res = await deleteHabitAction(habitId)
      if (res.success) {
        setHabits((prev) => prev.filter((h) => h.id !== habitId))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (editingHabit) {
        const res = await updateHabitAction(editingHabit.id, formData)
        if (res.error) {
          setError(res.error)
        } else if (res.habit) {
          setHabits((prev) =>
            prev.map((h) => (h.id === editingHabit.id ? (res.habit as any) : h))
          )
          setIsModalOpen(false)
        }
      } else {
        const res = await createHabitAction(formData)
        if (res.error) {
          setError(res.error)
        } else if (res.habit) {
          setHabits((prev) => [res.habit as any, ...prev])
          setIsModalOpen(false)
        }
      }
    } catch {
      setError('Ocorreu um erro ao salvar o hábito.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Seus Hábitos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Gerencie rotinas diárias e construa consistência para ganhar XP.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Hábito</span>
        </button>
      </div>

      {/* Habits Grid / List */}
      {habits.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Nenhum hábito cadastrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Comece cadastrando hábitos simples como ler 15 minutos, exercitar-se ou beber água.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Hábito</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-4 rounded-xl border transition-all ${
                habit.status === 'PAUSED'
                  ? 'bg-slate-900/30 border-slate-800/60 opacity-70'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{habit.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        habit.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {habit.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  {habit.description && (
                    <p className="text-xs text-slate-400 mt-1">{habit.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(habit)}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={habit.status === 'ACTIVE' ? 'Pausar hábito' : 'Ativar hábito'}
                  >
                    {habit.status === 'ACTIVE' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(habit)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    title="Editar hábito"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Excluir hábito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {habit.frequency === 'DAILY' ? 'Frequência Diária' : 'Recorrente'}
                </span>
                <span className="text-[11px] font-semibold text-indigo-400">
                  +20 XP por dia
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">
                {editingHabit ? 'Editar Hábito' : 'Cadastrar Novo Hábito'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina a atividade que você deseja transformar em hábito diário.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingHabit?.name || ''}
                  placeholder="Ex: Ler 20 páginas, Caminhada matinal, Meditação"
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
                  defaultValue={editingHabit?.description || ''}
                  placeholder="Detalhes ou lembretes sobre a execução do hábito..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Frequência
                </label>
                <select
                  name="frequency"
                  defaultValue={editingHabit?.frequency || 'DAILY'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DAILY">Diária (Todos os dias)</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="SPECIFIC_DAYS">Dias Específicos</option>
                </select>
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
                  {loading ? 'Salvando...' : editingHabit ? 'Atualizar Hábito' : 'Criar Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
