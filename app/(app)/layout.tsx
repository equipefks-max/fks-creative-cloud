import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div style={{ display:'flex', minHeight:'100vh' }}>
        <Sidebar />
        <main style={{ flex:1, marginLeft:220, minHeight:'100vh' }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
