'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getUser, logout } from '@/lib/auth'

const NAV = [
  {
    href: '/briefing',
    label: 'Novo Briefing',
    adminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: '/historico',
    label: 'Histórico',
    adminOnly: false,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/midia',
    label: 'Gerar Mídia',
    adminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    adminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const isAdmin  = user?.role === 'admin'
  const inicial  = user?.nome?.[0]?.toUpperCase() ?? 'U'

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin)

  return (
    <aside
      style={{ width: 220, flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh',
               display: 'flex', flexDirection: 'column', padding: '24px 16px',
               borderRight: '1px solid rgba(255,255,255,0.05)',
               background: 'rgba(255,255,255,0.03)', zIndex: 20 }}
    >
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 8px', marginBottom:32 }}>
        <div style={{ width:28, height:28, borderRadius:8,
                      background:'linear-gradient(135deg,#f59e0b,#d97706)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:700, color:'#000', flexShrink:0 }}>F</div>
        <div>
          <div style={{ color:'#fff', fontSize:14, fontWeight:600, lineHeight:1 }}>FKS</div>
          <div style={{ color:'#f59e0b', opacity:.7, fontSize:9, fontWeight:600, letterSpacing:'.15em' }}>
            CREATIVE CLOUD
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display:'flex', flexDirection:'column', gap:4, flex:1 }}>
        {visibleNav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 12px', borderRadius:10, fontSize:14,
                border: `1px solid ${active ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
                background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
                color: active ? '#f59e0b' : '#6b7280',
                textDecoration:'none', transition:'all .15s',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color='#e5e7eb' }}}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='#6b7280' }}}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:16,
                    display:'flex', alignItems:'center', gap:10, paddingLeft:8 }}>
        <div style={{ width:32, height:32, borderRadius:'50%',
                      background:'linear-gradient(135deg,#f59e0b,#ea580c)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:700, color:'#000', flexShrink:0 }}>
          {inicial}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'#fff', fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.nome ?? 'Usuário'}
          </div>
          <div style={{ color:'#6b7280', fontSize:10 }}>
            {user?.role === 'admin' ? 'Admin' : 'Cliente'}
          </div>
        </div>
        <button onClick={handleLogout} title="Sair"
          style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', padding:4 }}
          onMouseEnter={e => (e.currentTarget.style.color='#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color='#6b7280')}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
