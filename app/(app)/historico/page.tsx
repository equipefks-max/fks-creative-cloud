'use client'
import { useState, useEffect, useCallback } from 'react'
import { getTasks } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { CLIENTES } from '@/lib/types'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'em andamento': { bg:'rgba(245,158,11,0.1)',  color:'#f59e0b' },
  'concluído':    { bg:'rgba(34,197,94,0.1)',   color:'#22c55e' },
  'revisão':      { bg:'rgba(6,182,212,0.1)',   color:'#06b6d4' },
  'aguardando':   { bg:'rgba(107,114,128,0.1)', color:'#6b7280' },
}

function statusStyle(s: string) {
  const k = s?.toLowerCase() || ''
  for (const [key, val] of Object.entries(STATUS_COLORS)) {
    if (k.includes(key)) return val
  }
  return { bg:'rgba(107,114,128,0.1)', color:'#6b7280' }
}

export default function HistoricoPage() {
  const user = getUser()
  const isAdmin = user?.role === 'admin'

  const [tasks, setTasks]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState('')
  const [filtroCliente, setFiltroCliente] = useState(isAdmin ? '' : (user?.cliente || ''))
  const [filtroStatus, setFiltroStatus]   = useState('')
  const [busca, setBusca]                 = useState('')
  const [pagina, setPagina]               = useState(1)
  const POR_PAGINA = 15

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      const data = await getTasks({ cliente: filtroCliente, status: filtroStatus })
      setTasks(Array.isArray(data) ? data : [])
      setPagina(1)
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }, [filtroCliente, filtroStatus])

  useEffect(() => { carregar() }, [carregar])

  const filtrado = tasks.filter(t =>
    !busca || t.name?.toLowerCase().includes(busca.toLowerCase())
  )
  const total    = filtrado.length
  const paginas  = Math.max(1, Math.ceil(total / POR_PAGINA))
  const slice    = filtrado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div>
      <header style={{ padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                       background:'rgba(10,10,15,0.85)', backdropFilter:'blur(12px)',
                       position:'sticky', top:0, zIndex:10 }}>
        <div style={{ color:'#fff', fontSize:18, fontWeight:600 }}>Histórico de Tasks</div>
        <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>
          {total} task{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
        </div>
      </header>

      <div style={{ padding:'24px 32px' }}>
        {/* Filtros */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <input placeholder="Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)}
            className="input-glass"
            style={{ flex:1, minWidth:200, borderRadius:10, padding:'10px 14px', fontSize:13 }} />

          {isAdmin && (
            <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
              className="input-glass"
              style={{ borderRadius:10, padding:'10px 14px', fontSize:13, minWidth:160 }}>
              <option value="">Todos os clientes</option>
              {CLIENTES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}

          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="input-glass"
            style={{ borderRadius:10, padding:'10px 14px', fontSize:13, minWidth:160 }}>
            <option value="">Todos os status</option>
            <option value="em andamento">Em andamento</option>
            <option value="revisão">Revisão</option>
            <option value="concluído">Concluído</option>
            <option value="aguardando">Aguardando</option>
          </select>

          <button onClick={carregar}
            style={{ padding:'10px 16px', borderRadius:10, fontSize:13, border:'1px solid rgba(255,255,255,0.1)',
                     background:'rgba(255,255,255,0.04)', color:'#9ca3af', cursor:'pointer' }}>
            ↻ Atualizar
          </button>
        </div>

        {/* Tabela */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
                      borderRadius:16, overflow:'hidden' }}>
          {/* Cabeçalho */}
          <div style={{ display:'grid', gridTemplateColumns:'3fr 1.2fr 1fr 1.2fr 1fr',
                        padding:'10px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)',
                        fontSize:11, fontWeight:600, color:'#4b5563', letterSpacing:'0.05em',
                        textTransform:'uppercase' }}>
            <span>Task</span>
            <span>Cliente</span>
            <span>Status</span>
            <span>Responsável</span>
            <span>Prazo</span>
          </div>

          {loading && (
            <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontSize:13 }}>
              Carregando...
            </div>
          )}
          {erro && (
            <div style={{ padding:24, textAlign:'center', color:'#f87171', fontSize:13 }}>
              {erro}
            </div>
          )}
          {!loading && !erro && slice.length === 0 && (
            <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontSize:13 }}>
              Nenhuma task encontrada.
            </div>
          )}
          {!loading && slice.map((t, i) => {
            const statusStr = typeof t.status === 'string' ? t.status : (t.status as any)?.status || ''
            const ss = statusStyle(statusStr)
            const assignees = Array.isArray(t.assignees)
              ? t.assignees.map((a: any) => typeof a === 'string' ? a : (a.username || a.name || '')).filter(Boolean).join(', ')
              : ''
            const prazo = t.prazo ? new Date(Number(t.prazo)).toLocaleDateString('pt-BR') : '—'
            const clienteLabel = CLIENTES.find(c => c.value === t.cliente)?.label
              || (t.cliente ? t.cliente.charAt(0).toUpperCase() + t.cliente.slice(1) : '—')
            return (
              <div key={t.id || i}
                style={{ display:'grid', gridTemplateColumns:'3fr 1.2fr 1fr 1.2fr 1fr',
                          padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                          fontSize:13, alignItems:'center', transition:'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.025)')}
                onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                <div>
                  {t.url ? (
                    <a href={t.url} target="_blank" rel="noopener noreferrer"
                      style={{ color:'#e5e7eb', textDecoration:'none', fontWeight:500 }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color='#f59e0b')}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color='#e5e7eb')}>
                      {t.nome}
                    </a>
                  ) : (
                    <span style={{ color:'#e5e7eb', fontWeight:500 }}>{t.nome}</span>
                  )}
                </div>
                <span style={{ color:'#9ca3af' }}>{clienteLabel}</span>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                               padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:500,
                               background: ss.bg, color: ss.color }}>
                  {statusStr || '—'}
                </span>
                <span style={{ color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {assignees || '—'}
                </span>
                <span style={{ color:'#6b7280', fontSize:12 }}>{prazo}</span>
              </div>
            )
          })}
        </div>

        {/* Paginação */}
        {paginas > 1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center',
                        gap:8, marginTop:20 }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              style={{ padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                       border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)',
                       color: pagina === 1 ? '#374151' : '#9ca3af' }}>
              ← Anterior
            </button>
            <span style={{ fontSize:12, color:'#6b7280' }}>
              Página {pagina} de {paginas}
            </span>
            <button onClick={() => setPagina(p => Math.min(paginas, p + 1))} disabled={pagina === paginas}
              style={{ padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                       border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)',
                       color: pagina === paginas ? '#374151' : '#9ca3af' }}>
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
