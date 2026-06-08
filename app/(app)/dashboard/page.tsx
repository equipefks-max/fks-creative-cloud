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
      <header style={{ padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                       background:'rgba(10,10,15,0.85)', backdropFilter:'blur(12px)',
                       position:'sticky', top:0, zIndex:10,
                       display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ color:'#fff', fontSize:18, fontWeight:600 }}>Dashboard</div>
          <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>
            Status do sistema em tempo real
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {lastUpdate && (
            <span style={{ fontSize:11, color:'#374151' }}>
              Atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button onClick={carregar} disabled={loading}
            style={{ padding:'8px 14px', borderRadius:10, fontSize:12, cursor:'pointer',
                     border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)',
                     color: loading ? '#374151' : '#9ca3af' }}>
            {loading ? '↻ ...' : '↻ Atualizar'}
          </button>
        </div>
      </header>

      <div style={{ padding:32 }}>

        {/* Cards de visão geral */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:28 }}>
          {[
            {
              label:'Serviços ativos',
              valor: loading ? '...' : `${onlineCount}/${total}`,
              cor: onlineCount === total ? '#22c55e' : onlineCount > 0 ? '#f59e0b' : '#f87171',
              icon:'⚡',
            },
            {
              label:'ngrok',
              valor: loading ? '...' : (status?.ngrok ? 'Online' : 'Offline'),
              cor: status?.ngrok ? '#22c55e' : '#f87171',
              icon:'🌐',
            },
            {
              label:'API',
              valor: loading ? '...' : (status?.api_server ? 'Online' : 'Offline'),
              cor: status?.api_server ? '#22c55e' : '#f87171',
              icon:'🔌',
            },
            {
              label:'Webhook',
              valor: loading ? '...' : (status?.webhook ? 'Online' : 'Offline'),
              cor: status?.webhook ? '#22c55e' : '#f87171',
              icon:'📡',
            },
          ].map(card => (
            <div key={card.label}
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
                       borderRadius:14, padding:'20px 20px 16px',
                       display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:20 }}>{card.icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color: card.cor }}>{card.valor}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Detalhes dos serviços */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                      borderRadius:16, overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                        fontSize:13, fontWeight:600, color:'#9ca3af' }}>
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
          <div style={{ background:'rgba(6,182,212,0.04)', border:'1px solid rgba(6,182,212,0.12)',
                        borderRadius:14, padding:'16px 20px' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#06b6d4', marginBottom:8 }}>
              URL pública (ngrok)
            </div>
            <div style={{ fontFamily:'monospace', fontSize:13, color:'#a5f3fc',
                          wordBreak:'break-all' }}>
              {status.ngrok_url}
            </div>
            <div style={{ fontSize:11, color:'#164e63', marginTop:6 }}>
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
