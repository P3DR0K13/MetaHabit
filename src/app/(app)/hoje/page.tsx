import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserHabitsWithTodayStatus } from '@/app/actions/habits'
import { DailyHabitItem } from '@/components/dashboard/DailyHabitItem'
import { DailyTaskItem } from '@/components/dashboard/DailyTaskItem'
import Link from 'next/link'
import {
  Sparkles,
  Repeat,
  CheckCircle2,
  ListTodo,
  Plus,
  ArrowRight,
  Flame,
  Clock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HojePage() {
  const user = await requireAuth()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Formatar data em português
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(today)

  // 1. Hábitos ativos do usuário com status de hoje
  const habits = await getUserHabitsWithTodayStatus(todayStr)
  const habitsDoneCount = habits.filter((h) => h.isCompletedToday).length

  // 2. Tarefas prioritárias ou previstas para hoje (RF12)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const tasks = await prisma.task.findMany({
    where: {
      project: {
        userId: user.id,
        status: { in: ['IN_PROGRESS', 'PLANNING'] },
      },
      OR: [
        { dueDate: { lte: endOfToday } },
        { priority: { in: ['URGENT', 'HIGH'] }, status: 'PENDING' },
        { status: 'PENDING' },
      ],
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' }, // PENDING primeiro, COMPLETED depois
      { dueDate: 'asc' },
    ],
    take: 10,
  })

  const pendingTasksCount = tasks.filter((t) => t.status === 'PENDING').length

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="capitalize">{dateFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            O que faço agora?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Seu cockpit diário: complete os hábitos e as tarefas essenciais para avançar na sua jornada.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <Repeat className="w-4 h-4 text-indigo-400" />
            <div className="text-xs">
              <span className="font-bold text-white">{habitsDoneCount}/{habits.length}</span>
              <span className="text-slate-400 ml-1">hábitos</span>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <ListTodo className="w-4 h-4 text-amber-400" />
            <div className="text-xs">
              <span className="font-bold text-white">{pendingTasksCount}</span>
              <span className="text-slate-400 ml-1">pendentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: HÁBITOS DE HOJE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Hábitos do Dia</h2>
          </div>
          <Link
            href="/habitos"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Gerenciar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {habits.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Você ainda não tem nenhum hábito diário cadastrado.
            </p>
            <Link
              href="/habitos"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Primeiro Hábito</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {habits.map((habit) => (
              <DailyHabitItem
                key={habit.id}
                habit={habit}
                todayDateStr={todayStr}
              />
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: TAREFAS DOS PROJETOS */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              Missões e Tarefas Prioritárias
            </h2>
          </div>
          <Link
            href="/projetos"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Ver Projetos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Tudo em dia por aqui!
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Nenhuma tarefa pendente para hoje. Que tal criar um novo projeto com plano gerado por IA?
            </p>
            <Link
              href="/projetos"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Projeto com IA</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {tasks.map((task) => (
              <DailyTaskItem key={task.id} task={task as any} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
