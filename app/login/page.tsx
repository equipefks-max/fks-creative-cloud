'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, saveSession } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res = await login(email, senha)
      saveSession(res.token, res.user)
      if (res.force_change_password) {
        router.replace('/trocar-senha')
      } else {
        router.replace('/briefing')
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'#0a0a0f', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ width:48, height:48, borderRadius:14,
                        background:'linear-gradient(135deg,#f59e0b,#d97706)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:22, fontWeight:700, color:'#000', margin:'0 auto 16px' }}>F</div>
          <div style={{ color:'#fff', fontSize:22, fontWeight:700 }}>FKS Creative Cloud</div>
          <div style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>Acesse sua conta</div>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                   borderRadius:20, padding:32 }}>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              E-mail
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }}
            />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              Senha
            </label>
            <input
              type="password" required value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }}
            />
          </div>

          {erro && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                          borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f87171', marginBottom:16 }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary"
            style={{ width:'100%', padding:'13px', borderRadius:12, fontSize:14, border:'none' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#4b5563' }}>
          Agência FKS · Joinville, SC
        </div>
      </div>
    </div>
  )
}
