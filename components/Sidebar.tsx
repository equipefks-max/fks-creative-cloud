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
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M13 21h8"/><path d="m15 5 4 4"/>
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
      </svg>
    ),
  },
  {
    href: '/historico',
    label: 'Histórico',
    adminOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
      </svg>
    ),
  },
  {
    href: '/midia',
    label: 'Gerar Mídia',
    adminOnly: true,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="m11.017 2.814 1.05 5.558a2 2 0 0 0 1.595 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594l1.051-5.558a1 1 0 0 1 1.966 0z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    adminOnly: true,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect width="7" height="9" x="3" y="3" rx="1"/>
        <rect width="7" height="5" x="14" y="3" rx="1"/>
        <rect width="7" height="9" x="14" y="12" rx="1"/>
        <rect width="7" height="5" x="3" y="16" rx="1"/>
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
    if (novaSenha !== confirmar) { setErro('As novas senhas não coincidem.'); return }
    if (novaSenha.length < 6)    { setErro('A nova senha deve ter pelo menos 6 caracteres.'); return }
    setCarregando(true)
    try {
      const res = await changePassword(senhaAtual, novaSenha)
      saveSession(res.token, res.user)
      setSucesso(true)
      setTimeout(() => { onClose(); router.push('/login') }, 2000)
    } catch (e: any) {
      setErro(e.message || 'Erro ao trocar a senha.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} className="overlay">
      <div className="modal">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ color:'#fff', fontSize:16, fontWeight:600, fontFamily:'var(--font-display)' }}>Trocar senha</div>
            <div style={{ color:'var(--muted-foreground)', fontSize:12, marginTop:2 }}>Após trocar você será redirecionado para o login.</div>
          </div>
          <button onClick={onClose} style={{ color:'var(--muted-foreground)', padding:4 }}
            onMouseEnter={e => (e.currentTarget.style.color='#fff')}
            onMouseLeave={e => (e.currentTarget.style.color='var(--muted-foreground)')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {sucesso ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
            <div style={{ color:'#00c471', fontWeight:600, fontSize:15 }}>Senha alterada com sucesso!</div>
            <div style={{ color:'var(--muted-foreground)', fontSize:12, marginTop:6 }}>Redirecionando para o login…</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {(['Senha atual', 'Nova senha', 'Confirmar nova senha'] as const).map((label, i) => (
              <div key={i}>
                <label className="field-label" style={{ display:'block', marginBottom:6 }}>{label}</label>
                <input type="password" required autoFocus={i === 0}
                  placeholder="••••••••" className="input-glass"
                  style={{ width:'100%', borderRadius:10, padding:'10px 14px', fontSize:14 }}
                  value={i === 0 ? senhaAtual : i === 1 ? novaSenha : confirmar}
                  onChange={e => { if (i===0) setSenhaAtual(e.target.value); else if (i===1) setNovaSenha(e.target.value); else setConfirmar(e.target.value) }} />
              </div>
            ))}

            {erro && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                            borderRadius:8, padding:'10px 14px', color:'#f87171', fontSize:13 }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={carregando} className="btn-primary"
              style={{ marginTop:4, width:'100%', padding:'12px', borderRadius:10, fontSize:14 }}>
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

  const [menuAberto, setMenuAberto] = useState(false)
  const [modalSenha, setModalSenha] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() { logout(); router.push('/login') }

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      <aside style={{
        width: 260, flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', gap: 24, padding: 20,
        borderRight: '1px solid color-mix(in oklab, var(--glass-border) 60%, transparent)',
        background: '#0205158c', backdropFilter: 'blur(40px)', zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding:'8px 8px 0' }}>
          <img
            src="/fks-creative-cloud/logo.png"
            alt="FKS"
            style={{ width: 100, height: 'auto', display: 'block' }}
          />
          <div style={{ marginTop:6, fontSize:10, fontWeight:600, textTransform:'uppercase',
                        letterSpacing:'.18em', color:'var(--muted-foreground)' }}>Creative Cloud</div>
        </div>

        {/* Nav */}
        <nav style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <div className="field-label" style={{ marginBottom:8, padding:'0 8px' }}>Workspace</div>
          {visibleNav.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`nav-item${active ? ' active' : ''}`}>
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User card */}
        <div ref={menuRef} style={{ marginTop:'auto', position:'relative' }}>
          {menuAberto && (
            <div style={{
              position:'absolute', bottom:'calc(100% + 8px)', left:0, right:0,
              background:'rgba(10,18,46,0.98)', border:'1px solid var(--glass-border)',
              borderRadius:14, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <button onClick={() => { setMenuAberto(false); setModalSenha(true) }}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                         padding:'11px 14px', color:'var(--muted-foreground)', fontSize:13 }}
                onMouseEnter={e => { (e.currentTarget.style.background='rgba(255,255,255,0.06)'); (e.currentTarget.style.color='#fff') }}
                onMouseLeave={e => { (e.currentTarget.style.background='none'); (e.currentTarget.style.color='var(--muted-foreground)') }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                Trocar senha
              </button>
              <div style={{ height:1, background:'var(--glass-border)' }} />
              <button onClick={handleLogout}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                         padding:'11px 14px', color:'var(--muted-foreground)', fontSize:13 }}
                onMouseEnter={e => { (e.currentTarget.style.background='rgba(239,68,68,0.08)'); (e.currentTarget.style.color='#f87171') }}
                onMouseLeave={e => { (e.currentTarget.style.background='none'); (e.currentTarget.style.color='var(--muted-foreground)') }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sair
              </button>
            </div>
          )}

          <button onClick={() => setMenuAberto(v => !v)} style={{
            display:'flex', alignItems:'center', gap:12, width:'100%', padding:12,
            border:'1px solid var(--glass-border)', borderRadius:14,
            background: menuAberto ? '#ffffff0d' : '#ffffff08',
            textAlign:'left', transition:'background .2s',
          }}
            onMouseEnter={e => { if (!menuAberto) (e.currentTarget.style.background='rgba(255,255,255,0.07)') }}
            onMouseLeave={e => { if (!menuAberto) (e.currentTarget.style.background='#ffffff08') }}>
            <div style={{ display:'grid', placeItems:'center', width:36, height:36,
                          borderRadius:'9999px', background:'var(--gradient-primary)',
                          fontSize:14, fontWeight:600, flexShrink:0 }}>{inicial}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.nome ?? 'Usuário'}
              </div>
              <div style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:2 }}>
                {user?.role === 'admin' ? 'Admin' : 'Cliente'}
              </div>
            </div>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" viewBox="0 0 24 24"
              style={{ color:'var(--muted-foreground)', transform: menuAberto ? 'rotate(180deg)' : 'none', transition:'transform .2s', flexShrink:0 }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>
      </aside>

      {modalSenha && <ModalTrocaSenha onClose={() => setModalSenha(false)} />}
    </>
  )
}
