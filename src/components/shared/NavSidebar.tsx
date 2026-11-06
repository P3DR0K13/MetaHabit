'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  Repeat,
  FolderKanban,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  {
    name: 'O que faço agora?',
    href: '/hoje',
    icon: Compass,
    badge: 'Diário',
  },
  {
    name: 'Hábitos',
    href: '/habitos',
    icon: Repeat,
  },
  {
    name: 'Projetos',
    href: '/projetos',
    icon: FolderKanban,
  },
  {
    name: 'Loja Pessoal',
    href: '/loja',
    icon: ShoppingBag,
  },
  {
    name: 'Progresso',
    href: '/progresso',
    icon: TrendingUp,
  },
]

export function NavSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-[#0B0F19] p-4 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Navegação Principal
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/hoje' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Motivation Card */}
        <div className="mt-auto p-4 rounded-xl bg-gradient-to-b from-slate-900 to-indigo-950/30 border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <span>✨ Dica do Dia</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Conclua hábitos e tarefas para subir de Rank e resgatar suas recompensas favoritas na Loja!
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/hoje' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
