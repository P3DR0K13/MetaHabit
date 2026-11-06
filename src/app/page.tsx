import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  Target,
  Sparkles,
  Repeat,
  FolderKanban,
  Trophy,
  Coins,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
} from 'lucide-react'

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/hoje')
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background visual glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-600/15 via-violet-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Meta
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            Criar Conta
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Transforme objetivos amplos em missões diárias com IA</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          A clareza de saber exatamente{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-amber-300">
            o que fazer agora.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          O <strong>Meta</strong> reúne seus hábitos recorrentes e projetos complexos em um único painel diário. A IA planeja e adapta suas tarefas, e sua disciplina é recompensada com XP, níveis, ranks e moedas para gastar na sua própria loja.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/cadastro"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:opacity-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 transition-all group"
          >
            <span>Começar Minha Jornada</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-base border border-slate-800 transition-colors"
          >
            Já tenho uma conta
          </Link>
        </div>

        {/* Value Proposition Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Planejamento com IA</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Informe seu objetivo, prazo, disponibilidade e editais. A IA propõe tarefas realistas que você revisa e aprova antes de salvar.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
              <Repeat className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Hábitos & 'O que faço agora?'</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Diga adeus a listas caóticas. Uma única tela diária mostra os hábitos do dia e tarefas prioritárias dos seus projetos.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Gamificação Real</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Suba do Rank Bronze até o Lendário. Ganhe moedas por cada hábito ou tarefa concluída e resgate recompensas cadastradas por você.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-6 text-center text-xs text-slate-400">
        <p>Meta — Sistema de Produtividade, Hábitos & Gamificação</p>
      </footer>
    </div>
  )
}
