import Link from 'next/link'
import { Target } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#0B0F19] relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand logo */}
      <div className="mb-8 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 group mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Target className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Meta
          </span>
        </Link>
        <p className="text-xs text-slate-400 font-medium">
          Hábitos, Projetos, IA e Gamificação
        </p>
      </div>

      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
