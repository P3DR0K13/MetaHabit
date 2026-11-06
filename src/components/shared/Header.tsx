import Link from 'next/link'
import { getLevelProgress } from '@/lib/gamification'
import { logoutAction } from '@/app/actions/auth'
import { Coins, LogOut, Flame, Target, Trophy } from 'lucide-react'

interface HeaderProps {
  user: {
    id: string
    name: string
    email: string
    experiencePoints: number
    level: number
    rank: string
    coins: number
  }
}

export function Header({ user }: HeaderProps) {
  const progress = getLevelProgress(user.experiencePoints)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/hoje" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Meta
            </span>
            <span className="text-[10px] text-slate-400 -mt-1 font-medium tracking-wide uppercase">
              Produtividade & XP
            </span>
          </div>
        </Link>

        {/* Player Gamification Stats Bar */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Level and Rank Badge */}
          <Link
            href="/progresso"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-colors group"
            title="Ver sua evolução completa"
          >
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
              {progress.currentLevel}
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {progress.currentRank.split(' ')[0]}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-violet-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  {progress.progressPercent}%
                </span>
              </div>
            </div>
          </Link>

          {/* Coins Badge */}
          <Link
            href="/loja"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors text-amber-400 font-bold text-sm shadow-sm group"
            title="Loja pessoal: resgate suas recompensas"
          >
            <Coins className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>{user.coins}</span>
            <span className="text-[11px] font-normal text-amber-300/80 hidden sm:inline">
              moedas
            </span>
          </Link>

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-300 font-medium hidden md:inline truncate max-w-[120px]">
              {user.name.split(' ')[0]}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
