'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changePassword, saveSession } from '@/lib/auth'

export default function TrocarSenhaPage() {
  const router = useRouter()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha]   = useState('')
  const [confirma, setConfirma]     = useState('')
  const [erro, setErro]             = useState('')
  const [loading, setLoading]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (novaSenha !== confirma) { setErro('As senhas não coincidem'); return }
    if (novaSenha.length < 6)   { setErro('A nova senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    try {
      const res = await changePassword(senhaAtual, novaSenha)
      saveSession(res.token, res.user)
      router.replace('/briefing')
    } catch (err: any) {
      setErro(err.message || 'Erro ao trocar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'#0a0a0f', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:48, height:48, borderRadius:14,
                        background:'linear-gradient(135deg,#f59e0b,#d97706)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:22, fontWeight:700, color:'#000', margin:'0 auto 16px' }}>F</div>
          <div style={{ color:'#fff', fontSize:20, fontWeight:700 }}>Defina sua senha</div>
          <div style={{ color:'#6b7280', fontSize:13, marginTop:6, maxWidth:300, margin:'8px auto 0' }}>
            Você está usando uma senha temporária. Por segurança, defina uma senha pessoal antes de continuar.
          </div>
        </div>

        <form onSubmit={handleSubmit}
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                   borderRadius:20, padding:32 }}>

          {/* Indicador de obrigatoriedade */}
          <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)',
                        borderRadius:10, padding:'10px 14px', fontSize:12, color:'#f59e0b', marginBottom:24 }}>
            Primeiro acesso detectado — troca de senha obrigatória.
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              Senha atual (temporária)
            </label>
            <input type="password" required value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
              placeholder="1234alterar"
              className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }} />
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              Nova senha
            </label>
            <input type="password" required value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }} />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              Confirmar nova senha
            </label>
            <input type="password" required value={confirma} onChange={e => setConfirma(e.target.value)}
              placeholder="Repita a nova senha"
              className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }} />
          </div>

          {erro && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                          borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f87171', marginBottom:16 }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary"
            style={{ width:'100%', padding:13, borderRadius:12, fontSize:14, border:'none' }}>
            {loading ? 'Salvando...' : 'Salvar senha e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
