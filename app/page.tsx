'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    const user = getUser()
    if (user?.force_change_password) { router.replace('/trocar-senha'); return }
    router.replace('/briefing')
  }, [router])
  return null
}
