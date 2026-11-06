import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/shared/Header'
import { NavSidebar } from '@/components/shared/NavSidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Header user={user} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <NavSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
