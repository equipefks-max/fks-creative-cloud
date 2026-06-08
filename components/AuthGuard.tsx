'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, getUser } from '@/lib/auth'

const ADMIN_ONLY = ['/briefing', '/midia', '/dashboard']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    const user = getUser()
    // Forçar troca de senha
    if (user?.force_change_password && pathname !== '/trocar-senha') {
      router.replace('/trocar-senha')
      return
    }
    // Bloquear clientes em rotas admin
    if (user?.role === 'cliente' && ADMIN_ONLY.some(r => pathname.startsWith(r))) {
      router.replace('/historico')
    }
  }, [pathname, router])

  return <>{children}</>
}
