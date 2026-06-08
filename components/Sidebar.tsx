'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { getUser, logout, changePassword, saveSession } from '@/lib/auth'

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

// ── Modal de troca de senha ────────────────────────────────────────────────────
function ModalTrocaSenha({ onClose }: { onClose: () => void }) {
  const [senhaAtual,  setSenhaAtual]  = useState('')
  const [novaSenha,   setNovaSenha]   = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [erro,        setErro]        = useState('')
  const [sucesso,     setSucesso]     = useState(false)
  const [carregando,  setCarregando]  = useState(false)

  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (novaSenha !== confirmar) {
      setErro('As novas senhas não coincidem.')
      return
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    setCarregando(true)
    try {
      const res = await changePassword(senhaAtual, novaSenha)
      // Atualiza sessão com novos dados vindos do servidor
      saveSession(res.token, res.user)
      setSucesso(true)
      setTimeout(() => {
        onClose()
        router.push('/login')
      }, 2000)
    } catch (e: any) {
      setErro(e.message || 'Erro ao trocar a senha.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    // Overlay
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'rgba(18,18,24,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18, padding: '32px 28px', width: 360,
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Trocar senha</div>
            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
              Após trocar você será redirecionado para o login.
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sucesso ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ color: '#22c55e', fontWeight: 600, fontSize: 15 }}>Senha alterada com sucesso!</div>
            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>Redirecionando para o login…</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600,
                              letterSpacing: '.05em', textTransform: 'uppercase',
                              display: 'block', marginBottom: 6 }}>
                Senha atual
              </label>
              <input
                type="password" value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                placeholder="••••••••" required autoFocus
                className="input-glass"
                style={{ width: '100%', borderRadius: 10, padding: '10px 14px',
                         fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600,
                              letterSpacing: '.05em', textTransform: 'uppercase',
                              display: 'block', marginBottom: 6 }}>
                Nova senha
              </label>
              <input
                type="password" value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="••••••••" required
                className="input-glass"
                style={{ width: '100%', borderRadius: 10, padding: '10px 14px',
                         fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600,
                              letterSpacing: '.05em', textTransform: 'uppercase',
                              display: 'block', marginBottom: 6 }}>
                Confirmar nova senha
              </label>
              <input
                type="password" value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="••••••••" required
                className="input-glass"
                style={{ width: '100%', borderRadius: 10, padding: '10px 14px',
                         fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {erro && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={carregando}
              style={{
                marginTop: 4,
                padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: carregando ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: '#000', fontWeight: 700, fontSize: 14, transition: 'opacity .15s',
              }}
            >
              {carregando ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Sidebar principal ─────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const isAdmin  = user?.role === 'admin'
  const inicial  = user?.nome?.[0]?.toUpperCase() ?? 'U'

  const [menuAberto,  setMenuAberto]  = useState(false)
  const [modalSenha,  setModalSenha]  = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
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

        {/* User — clicável */}
        <div ref={menuRef} style={{ position: 'relative' }}>

          {/* Menu popover */}
          {menuAberto && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
              background: 'rgba(18,18,24,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <button
                onClick={() => { setMenuAberto(false); setModalSenha(true) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: 13, textAlign: 'left',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.06)'); (e.currentTarget.style.color = '#fff') }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'none'); (e.currentTarget.style.color = '#9ca3af') }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Trocar senha
              </button>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: 13, textAlign: 'left',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(239,68,68,0.08)'); (e.currentTarget.style.color = '#f87171') }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'none'); (e.currentTarget.style.color = '#9ca3af') }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          )}

          {/* Área clicável do usuário */}
          <button
            onClick={() => setMenuAberto(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '12px 8px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: menuAberto ? 'rgba(255,255,255,0.04)' : 'none',
              border: 'none', borderRadius: menuAberto ? 10 : 0,
              cursor: 'pointer', textAlign: 'left',
              transition: 'background .15s',
            }}
            onMouseEnter={e => { if (!menuAberto) (e.currentTarget.style.background = 'rgba(255,255,255,0.04)') }}
            onMouseLeave={e => { if (!menuAberto) (e.currentTarget.style.background = 'none') }}
          >
            <div style={{ width:32, height:32, borderRadius:'50%',
                          background:'linear-gradient(135deg,#f59e0b,#ea580c)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:700, color:'#000', flexShrink:0 }}>
              {inicial}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'#fff', fontSize:13, fontWeight:500,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.nome ?? 'Usuário'}
              </div>
              <div style={{ color:'#6b7280', fontSize:10 }}>
                {user?.role === 'admin' ? 'Admin' : 'Cliente'}
              </div>
            </div>
            {/* Chevron */}
            <svg width="12" height="12" fill="none" stroke="#4b5563" viewBox="0 0 24 24"
              style={{ transform: menuAberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Modal de troca de senha */}
      {modalSenha && (
        <ModalTrocaSenha onClose={() => setModalSenha(false)} />
      )}
    </>
  )
}
