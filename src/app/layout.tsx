import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meta — Sistema de Produtividade, Hábitos & Gamificação',
  description: 'Transforme objetivos amplos em missões diárias com hábitos, projetos inteligentes com IA e gamificação.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#0B0F19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  )
}
