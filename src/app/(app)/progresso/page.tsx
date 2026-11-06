import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLevelProgress } from '@/lib/gamification'
import {
  Trophy,
  Coins,
  Repeat,
  CheckCircle2,
  FolderKanban,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const RANKS_LADDER = [
  { name: 'Bronze (Iniciante)', minLevel: 1, color: 'text-amber-600 border-amber-600/30 bg-amber-600/10' },
  { name: 'Prata (Focado)', minLevel: 5, color: 'text-slate-300 border-slate-400/30 bg-slate-400/10' },
  { name: 'Ouro (Disciplinado)', minLevel: 10, color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  { name: 'Platina (Estrategista)', minLevel: 20, color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
  { name: 'Diamante (Mestre dos Hábitos)', minLevel: 35, color: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10' },
  { name: 'Lendário (Grão-Mestre)', minLevel: 50, color: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
]

export default async function ProgressoPage() {
  const user = await requireAuth()
  const progress = getLevelProgress(user.experiencePoints)

  // Estatísticas agregadas
  const totalHabitLogs = await prisma.habitLog.count({
    where: {
      habit: { userId: user.id },
      status: 'COMPLETED',
    },
  })

  const totalTasksCompleted = await prisma.task.count({
    where: {
      project: { userId: user.id },
      status: 'COMPLETED',
    },
  })

  const totalProjects = await prisma.project.count({
    where: { userId: user.id },
  })

  const totalRedemptions = await prisma.rewardRedemption.count({
    where: { userId: user.id },
  })

  // Histórico recente de atividades que geraram XP (RF18)
  const recentActivityRewards = await prisma.activityReward.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Painel de Evolução & Gamificação
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Acompanhe seu avanço de Nível, subida de Rank e conquistas de produtividade.
        </p>
      </div>

      {/* Main Player Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-indigo-500/30">
              {progress.currentLevel}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold">
                  Nível {progress.currentLevel}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-semibold text-amber-400">
                  {progress.currentRank}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {user.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.experiencePoints} XP acumulados no total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm flex items-center gap-2">
              <Coins className="w-5 h-5" />
              <span>{user.coins} moedas</span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">
              Progresso para o Nível {progress.currentLevel + 1}
            </span>
            <span className="text-indigo-400 font-bold">
              {progress.currentXp - progress.levelBaseXp} / {progress.nextLevelXp - progress.levelBaseXp} XP ({progress.progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 via-violet-400 to-amber-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Faltam apenas <strong>{progress.xpRemaining} XP</strong> para atingir o próximo nível!
          </p>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <Repeat className="w-5 h-5 text-indigo-400 mb-2" />
          <div className="text-xl font-extrabold text-white">{totalHabitLogs}</div>
          <div className="text-xs text-slate-400 mt-0.5">Hábitos Realizados</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
          <div className="text-xl font-extrabold text-white">{totalTasksCompleted}</div>
          <div className="text-xs text-slate-400 mt-0.5">Tarefas Concluídas</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <FolderKanban className="w-5 h-5 text-violet-400 mb-2" />
          <div className="text-xl font-extrabold text-white">{totalProjects}</div>
          <div className="text-xs text-slate-400 mt-0.5">Projetos Ativos</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <Award className="w-5 h-5 text-amber-400 mb-2" />
          <div className="text-xl font-extrabold text-white">{totalRedemptions}</div>
          <div className="text-xs text-slate-400 mt-0.5">Recompensas Resgatadas</div>
        </div>
      </div>

      {/* Ranks Ladder */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Escada de Ranks</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {RANKS_LADDER.map((r, i) => {
            const isCurrent = user.level >= r.minLevel && (i === RANKS_LADDER.length - 1 || user.level < RANKS_LADDER[i + 1].minLevel)
            const isUnlocked = user.level >= r.minLevel

            return (
              <div
                key={r.name}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'ring-2 ring-indigo-500 bg-slate-900 shadow-lg'
                    : isUnlocked
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${r.color}`}>
                    Nível {r.minLevel}+
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      ★ Seu Rank Atual
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-white mt-1">{r.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity Rewards Audit Feed (RF18) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Histórico de Recompensas Recentes (Auditoria)</span>
        </h3>

        {recentActivityRewards.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhuma atividade pontuada ainda. Conclua hábitos ou tarefas para receber XP e moedas.
          </p>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl divide-y divide-slate-800/80">
            {recentActivityRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-3.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {reward.activityType === 'HABIT' ? 'Hábito' : 'Tarefa'}
                  </span>
                  <span className="text-slate-400">
                    {new Date(reward.createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(reward.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-bold">
                  <span className="text-indigo-400">+{reward.experiencePoints} XP</span>
                  <span className="text-amber-400">+{reward.coins} 🪙</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
