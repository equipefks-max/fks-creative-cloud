'use client'
import { useState, useEffect } from 'react'
import { getSistemaStatus } from '@/lib/api'
import { SistemaStatus } from '@/lib/types'

interface Servico {
  nome: string
  chave: keyof SistemaStatus
  descricao: string
}

const SERVICOS: Servico[] = [
  { nome:'API Server',      chave:'api_server',   descricao:'FastAPI na porta 8000' },
  { nome:'Webhook Server',  chave:'webhook',      descricao:'Recebe gatilhos de geração de imagem' },
  { nome:'Watchdog',        chave:'watchdog',     descricao:'Monitor de processos' },
  { nome:'ngrok Tunnel',    chave:'ngrok',        descricao:'Túnel público para a API' },
]

function StatusBadge({ ok, label }: { ok: boolean | undefined; label: string }) {
  if (ok === undefined) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
                   borderRadius:99, fontSize:11, background:'rgba(107,114,128,0.1)', color:'#6b7280' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'#4b5563', display:'inline-block' }} />
      {label}
    </span>
  )
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
                   borderRadius:99, fontSize:11,
                   background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                   color: ok ? '#22c55e' : '#f87171' }}>
      <span className={`status-dot ${ok ? 'dot-green' : 'dot-red'}`} />
      {label}
    </span>
  )
}

export default function DashboardPage() {
  const [status, setStatus]       = useState<SistemaStatus | null>(null)
  const [loading, setLoading]     = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  async function carregar() {
    setLoading(true)
    try {
      const s = await getSistemaStatus()
      setStatus(s)
      setLastUpdate(new Date())
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 30000)
    return () => clearInterval(t)
  }, [])

  const onlineCount = status
    ? SERVICOS.filter(s => status[s.chave]).length
    : 0
  const total = SERVICOS.length

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div style={{ fontSize:14, color:'var(--muted-foreground)' }}>
            Workspace <span style={{ opacity:.4, margin:'0 6px' }}>/</span>
            <span style={{ color:'var(--foreground)' }}>Dashboard</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:'auto' }}>
            {lastUpdate && (
              <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>
                Atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button onClick={carregar} disabled={loading} className="btn-ghost"
              style={{ padding:'6px 14px', fontSize:12 }}>
              {loading ? '↻ ...' : '↻ Atualizar'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding:'24px 32px 60px' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:24 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:'clamp(1.5rem,3vw,2rem)', letterSpacing:'-.02em', lineHeight:1 }}>
            <span className="kinetic">Dash</span><span className="kinetic-blue">board</span>
          </h1>
          <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--primary-glow)' }}>Visão geral</span>
        </div>

        {/* Cards de visão geral */}
        <div className="bgrid" style={{ marginBottom:28 }}>
          {[
            {
              label:'Serviços ativos',
              valor: loading ? '...' : `${onlineCount}/${total}`,
              cor: onlineCount === total ? 'var(--success)' : onlineCount > 0 ? '#f59e0b' : '#f87171',
              icon:'⚡',
            },
            {
              label:'ngrok',
              valor: loading ? '...' : (status?.ngrok ? 'Online' : 'Offline'),
              cor: status?.ngrok ? 'var(--success)' : '#f87171',
              icon:'🌐',
            },
            {
              label:'API',
              valor: loading ? '...' : (status?.api_server ? 'Online' : 'Offline'),
              cor: status?.api_server ? 'var(--success)' : '#f87171',
              icon:'🔌',
            },
            {
              label:'Webhook',
              valor: loading ? '...' : (status?.webhook ? 'Online' : 'Offline'),
              cor: status?.webhook ? 'var(--success)' : '#f87171',
              icon:'📡',
            },
          ].map(card => (
            <div key={card.label} className="bento md-3"
              style={{ padding:'20px 20px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:20 }}>{card.icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color: card.cor }}>{card.valor}</div>
              <div style={{ fontSize:12, color:'var(--muted-foreground)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Detalhes dos serviços */}
        <div className="bento" style={{ overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                        fontSize:13, fontWeight:600, color:'var(--muted-foreground)' }}>
            Processos do sistema
          </div>
          {SERVICOS.map((s, i) => (
            <div key={s.chave}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                       padding:'16px 24px',
                       borderBottom: i < SERVICOS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:'#e5e7eb' }}>{s.nome}</div>
                <div style={{ fontSize:12, color:'#4b5563', marginTop:2 }}>{s.descricao}</div>
              </div>
              <StatusBadge
                ok={loading ? undefined : (status?.[s.chave] as boolean | undefined)}
                label={loading ? 'Verificando...' : (status?.[s.chave] ? 'Online' : 'Offline')}
              />
            </div>
          ))}
        </div>

        {/* Informações do ambiente */}
        {status?.ngrok_url && (
          <div className="bento" style={{ padding:'16px 20px', marginBottom:20,
                        background:'rgba(57,125,255,0.04)', borderColor:'rgba(57,125,255,0.2)' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--primary-glow)', marginBottom:8 }}>
              URL pública (ngrok)
            </div>
            <div style={{ fontFamily:'monospace', fontSize:13, color:'#c7d8ff', wordBreak:'break-all' }}>
              {status.ngrok_url}
            </div>
            <div style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:6, opacity:.6 }}>
              Atualizar o NEXT_PUBLIC_API_URL no .env.local caso a URL mude
            </div>
          </div>
        )}

        {/* Aviso se sistema offline */}
        {!loading && status && onlineCount < total && (
          <div style={{ marginTop:20, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)',
                        borderRadius:14, padding:'14px 20px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#f59e0b', marginBottom:4 }}>
              Atenção: {total - onlineCount} serviço{total - onlineCount > 1 ? 's' : ''} offline
            </div>
            <div style={{ fontSize:12, color:'#92400e' }}>
              Execute <code style={{ background:'rgba(245,158,11,0.1)', padding:'1px 6px', borderRadius:4,
                                    fontFamily:'monospace' }}>iniciar_fks.bat</code> para reiniciar o sistema.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
