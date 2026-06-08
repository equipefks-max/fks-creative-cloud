'use client'
import { useState, useRef } from 'react'
import { enviarBriefing, getJobStatus } from '@/lib/api'
import { CLIENTES, EQUIPE, FORMATOS, OBJETIVOS, ETAPAS_PIPELINE } from '@/lib/types'

type Etapa        = 'form' | 'progress' | 'concluido' | 'erro'
type BriefingModo = 'texto' | 'arquivo' | 'ambos'

const BRIEFING_ACEITOS = '.pdf,.doc,.docx,.txt'
const BRIEFING_ACEITOS_LABEL = 'PDF, Word (.doc/.docx) ou TXT'

function extensaoIcon(nome: string) {
  const ext = nome.split('.').pop()?.toLowerCase()
  if (ext === 'pdf')  return '📄'
  if (ext === 'doc' || ext === 'docx') return '📝'
  return '📃'
}

export default function BriefingPage() {
  const [etapa, setEtapa]               = useState<Etapa>('form')
  const [jobId, setJobId]               = useState('')
  const [jobStatus, setJobStatus]       = useState<any>(null)
  const [erroEnvio, setErroEnvio]       = useState('')
  const [loading, setLoading]           = useState(false)
  const [referencias, setReferencias]   = useState<File[]>([])
  const [responsaveis, setResponsaveis] = useState<string[]>([])
  const [formatos, setFormatos]         = useState<string[]>([])
  // Briefing: modo + arquivo
  const [briefingModo, setBriefingModo]     = useState<BriefingModo>('texto')
  const [briefingArquivo, setBriefingArquivo] = useState<File | null>(null)
  const [briefingDragOver, setBriefingDragOver] = useState(false)

  const refInputRef      = useRef<HTMLInputElement>(null)
  const briefingInputRef = useRef<HTMLInputElement>(null)
  const pollingRef       = useRef<NodeJS.Timeout | null>(null)

  function toggleCheck(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val])
  }

  function onDropReferencias(e: React.DragEvent) {
    e.preventDefault()
    setReferencias(prev => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  function onDropBriefing(e: React.DragEvent) {
    e.preventDefault()
    setBriefingDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setBriefingArquivo(file)
  }

  function startPolling(id: string) {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await getJobStatus(id)
        setJobStatus(status)
        if (status.concluido) { clearInterval(pollingRef.current!); setEtapa('concluido') }
        if (status.erro)      { clearInterval(pollingRef.current!); setEtapa('erro') }
      } catch {}
    }, 3000)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroEnvio('')
    if (responsaveis.length === 0) { setErroEnvio('Selecione pelo menos um responsável'); return }
    if (formatos.length === 0)     { setErroEnvio('Selecione pelo menos um formato'); return }

    // Validar briefing conforme modo
    const textoEl = (e.currentTarget.elements.namedItem('briefing') as HTMLTextAreaElement | null)
    const textoVal = textoEl?.value?.trim() || ''
    if (briefingModo === 'texto' && !textoVal)    { setErroEnvio('Preencha o texto do briefing'); return }
    if (briefingModo === 'arquivo' && !briefingArquivo) { setErroEnvio('Anexe o arquivo de briefing'); return }
    if (briefingModo === 'ambos'  && !textoVal && !briefingArquivo) {
      setErroEnvio('Preencha o texto ou anexe um arquivo de briefing'); return
    }

    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('responsaveis', JSON.stringify(responsaveis))
      fd.set('formatos',     JSON.stringify(formatos))
      fd.set('briefing_modo', briefingModo)
      if (briefingArquivo) fd.set('briefing_arquivo', briefingArquivo)
      referencias.forEach(f => fd.append('referencias', f))
      const { job_id } = await enviarBriefing(fd)
      setJobId(job_id)
      setJobStatus({ etapa:'iniciando', mensagem:'Iniciando pipeline...' })
      setEtapa('progress')
      startPolling(job_id)
    } catch (err: any) {
      setErroEnvio(err.message || 'Erro ao enviar briefing')
    } finally {
      setLoading(false)
    }
  }

  const etapaAtualIdx = ETAPAS_PIPELINE.findIndex(e => e.key === jobStatus?.etapa)

  // ── Tela de progresso ────────────────────────────────────────────────────────
  if (etapa === 'progress' || etapa === 'concluido' || etapa === 'erro') {
    return (
      <div>
        <header style={{ padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                         background:'rgba(10,10,15,0.85)', backdropFilter:'blur(12px)' }}>
          <div style={{ color:'#fff', fontSize:18, fontWeight:600 }}>Processando Briefing</div>
          <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>Job #{jobId}</div>
        </header>
        <div style={{ padding:32, maxWidth:600 }}>

          {/* Barra de progresso */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                        borderRadius:16, padding:28, marginBottom:20 }}>
            <div style={{ fontSize:14, color:'#e5e7eb', fontWeight:500, marginBottom:20 }}>
              {jobStatus?.mensagem || 'Iniciando...'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {ETAPAS_PIPELINE.map((ep, idx) => {
                const done    = etapa === 'concluido' || idx < etapaAtualIdx
                const current = idx === etapaAtualIdx && etapa === 'progress'
                const hasErro = etapa === 'erro' && current
                return (
                  <div key={ep.key} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:24, height:24, borderRadius:'50%', flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700,
                      background: hasErro ? 'rgba(239,68,68,0.2)' : done ? 'rgba(34,197,94,0.2)' : current ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${hasErro ? 'rgba(239,68,68,0.4)' : done ? 'rgba(34,197,94,0.4)' : current ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: hasErro ? '#f87171' : done ? '#22c55e' : current ? '#f59e0b' : '#4b5563',
                    }}>
                      {done ? '✓' : current ? (hasErro ? '✗' : '…') : idx + 1}
                    </div>
                    <span style={{ fontSize:13, color: done ? '#22c55e' : current ? (hasErro ? '#f87171' : '#f59e0b') : '#6b7280' }}>
                      {ep.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Concluído */}
          {etapa === 'concluido' && (
            <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)',
                          borderRadius:14, padding:20, marginBottom:16 }}>
              <div style={{ color:'#22c55e', fontWeight:600, marginBottom:8 }}>Pipeline concluído!</div>
              {jobStatus?.clickup_url && (
                <a href={jobStatus.clickup_url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px',
                           borderRadius:10, background:'rgba(245,158,11,0.15)', color:'#f59e0b',
                           textDecoration:'none', fontSize:13, fontWeight:500 }}>
                  Ver task no ClickUp ↗
                </a>
              )}
            </div>
          )}

          {/* Erro */}
          {etapa === 'erro' && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                          borderRadius:14, padding:20, marginBottom:16 }}>
              <div style={{ color:'#f87171', fontWeight:600, marginBottom:4 }}>Erro no pipeline</div>
              <div style={{ color:'#9ca3af', fontSize:13 }}>{jobStatus?.erro_detalhe || 'Verifique os logs.'}</div>
            </div>
          )}

          <button onClick={() => { setEtapa('form'); setReferencias([]); setResponsaveis([]); setFormatos([]); setBriefingArquivo(null); setBriefingModo('texto') }}
            className="btn-primary"
            style={{ padding:'10px 24px', borderRadius:12, fontSize:14, border:'none' }}>
            Novo Briefing
          </button>
        </div>
      </div>
    )
  }

  // ── Formulário ───────────────────────────────────────────────────────────────
  return (
    <div>
      <header style={{ padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                       background:'rgba(10,10,15,0.85)', backdropFilter:'blur(12px)',
                       position:'sticky', top:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ color:'#fff', fontSize:18, fontWeight:600 }}>Novo Briefing</div>
          <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>Preencha os campos abaixo para iniciar o pipeline</div>
        </div>
        <div style={{ display:'flex', gap:16, fontSize:12 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6, color:'#22c55e' }}>
            <span className="status-dot dot-green" /> Sistema online
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ padding:32, maxWidth:700 }}>

        {/* Cliente */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
            Cliente
          </label>
          <select name="cliente" required className="input-glass"
            style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }}>
            <option value="">Selecionar cliente...</option>
            {CLIENTES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Responsáveis */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
            Responsáveis <span style={{ color:'#4b5563' }}>(múltiplos)</span>
          </label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {EQUIPE.map(m => (
              <label key={m.nome} className={`glass glass-hover`}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                         borderRadius:10, cursor:'pointer', fontSize:13,
                         border: responsaveis.includes(m.nome) ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                         background: responsaveis.includes(m.nome) ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                         color: responsaveis.includes(m.nome) ? '#f59e0b' : '#9ca3af' }}>
                <input type="checkbox" style={{ display:'none' }}
                  checked={responsaveis.includes(m.nome)}
                  onChange={() => toggleCheck(responsaveis, setResponsaveis, m.nome)} />
                {m.nome}
              </label>
            ))}
          </div>
        </div>

        {/* Formatos */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
            Formatos de conteúdo
          </label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {FORMATOS.map(f => (
              <label key={f}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                         borderRadius:10, cursor:'pointer', fontSize:13,
                         border: formatos.includes(f) ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                         background: formatos.includes(f) ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                         color: formatos.includes(f) ? '#f59e0b' : '#9ca3af' }}>
                <input type="checkbox" style={{ display:'none' }}
                  checked={formatos.includes(f)}
                  onChange={() => toggleCheck(formatos, setFormatos, f)} />
                {f}
              </label>
            ))}
          </div>
        </div>

        {/* Briefing — modo seletor */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <label style={{ fontSize:12, fontWeight:500, color:'#9ca3af' }}>Briefing</label>
            {/* Tabs de modo */}
            <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:10,
                          border:'1px solid rgba(255,255,255,0.08)', padding:3, gap:2 }}>
              {([
                { key:'texto',   icon:'✏️', label:'Texto' },
                { key:'arquivo', icon:'📄', label:'Arquivo' },
                { key:'ambos',   icon:'🔗', label:'Ambos' },
              ] as { key: BriefingModo; icon: string; label: string }[]).map(tab => (
                <button key={tab.key} type="button" onClick={() => setBriefingModo(tab.key)}
                  style={{ padding:'5px 12px', borderRadius:8, fontSize:12, cursor:'pointer', border:'none',
                           fontWeight: briefingModo === tab.key ? 600 : 400,
                           background: briefingModo === tab.key ? 'rgba(245,158,11,0.15)' : 'transparent',
                           color: briefingModo === tab.key ? '#f59e0b' : '#6b7280',
                           transition:'all .15s', display:'flex', alignItems:'center', gap:5 }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Texto */}
          {(briefingModo === 'texto' || briefingModo === 'ambos') && (
            <textarea name="briefing"
              rows={briefingModo === 'ambos' ? 4 : 6}
              placeholder="Descreva o conteúdo que precisa ser criado, objetivo da campanha, referências, restrições..."
              className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14, resize:'vertical',
                       marginBottom: briefingModo === 'ambos' ? 10 : 0 }} />
          )}

          {/* Upload de arquivo de briefing */}
          {(briefingModo === 'arquivo' || briefingModo === 'ambos') && (
            briefingArquivo ? (
              /* Arquivo selecionado */
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                            background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)',
                            borderRadius:12 }}>
                <span style={{ fontSize:24 }}>{extensaoIcon(briefingArquivo.name)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#e5e7eb',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {briefingArquivo.name}
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                    {(briefingArquivo.size / 1024).toFixed(0)} KB · {briefingArquivo.type || 'documento'}
                  </div>
                </div>
                <button type="button" onClick={() => setBriefingArquivo(null)}
                  style={{ flexShrink:0, padding:'4px 10px', borderRadius:8, fontSize:12, cursor:'pointer',
                           border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#6b7280' }}>
                  Remover
                </button>
              </div>
            ) : (
              /* Dropzone */
              <div
                onDrop={onDropBriefing}
                onDragOver={e => { e.preventDefault(); setBriefingDragOver(true) }}
                onDragLeave={() => setBriefingDragOver(false)}
                onClick={() => briefingInputRef.current?.click()}
                style={{ border:`2px dashed ${briefingDragOver ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                         borderRadius:12, padding:'28px 20px', textAlign:'center', cursor:'pointer',
                         background: briefingDragOver ? 'rgba(245,158,11,0.04)' : 'transparent',
                         transition:'all .15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(245,158,11,0.3)')}
                onMouseLeave={e => { if (!briefingDragOver) e.currentTarget.style.borderColor='rgba(255,255,255,0.1)' }}>
                <input ref={briefingInputRef} type="file" accept={BRIEFING_ACEITOS} style={{ display:'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) setBriefingArquivo(f) }} />
                <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
                <div style={{ fontSize:13, color:'#9ca3af', fontWeight:500 }}>
                  Arraste o arquivo de briefing aqui
                </div>
                <div style={{ fontSize:11, color:'#4b5563', marginTop:4 }}>
                  {BRIEFING_ACEITOS_LABEL} · ou clique para selecionar
                </div>
              </div>
            )
          )}
        </div>

        {/* Objetivo + Prazo */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              Objetivo
            </label>
            <select name="objetivo" className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }}>
              <option value="">Selecionar...</option>
              {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              Prazo
            </label>
            <input type="date" name="prazo" className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }} />
          </div>
        </div>

        {/* CTA + Público */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>CTA</label>
            <input type="text" name="cta" placeholder="Ex: Acesse o link na bio" className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
              Público-alvo
            </label>
            <input type="text" name="publico_alvo" placeholder="Ex: Mulheres 25-40, interesse em moda"
              className="input-glass"
              style={{ width:'100%', borderRadius:12, padding:'12px 16px', fontSize:14 }} />
          </div>
        </div>

        {/* Upload de referências */}
        <div style={{ marginBottom:28 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
            Referências visuais / fotos do produto
            <span style={{ fontWeight:400, color:'#4b5563', marginLeft:6 }}>(opcional)</span>
          </label>
          <div onDrop={onDropReferencias} onDragOver={e => e.preventDefault()}
            onClick={() => refInputRef.current?.click()}
            style={{ border:'2px dashed rgba(255,255,255,0.1)', borderRadius:14, padding:'20px 28px',
                     textAlign:'center', cursor:'pointer', transition:'border-color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(6,182,212,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.1)')}>
            <input ref={refInputRef} type="file" multiple accept="image/*" style={{ display:'none' }}
              onChange={e => setReferencias(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <div style={{ color:'#4b5563', fontSize:13 }}>Arraste imagens de referência aqui</div>
            <div style={{ color:'#374151', fontSize:11, marginTop:3 }}>JPG, PNG, GIF, WebP · ou clique para selecionar</div>
          </div>
          {referencias.length > 0 && (
            <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
              {referencias.map((f, i) => (
                <span key={i} style={{ fontSize:11, padding:'4px 10px', borderRadius:99,
                                       background:'rgba(6,182,212,0.1)', color:'#06b6d4',
                                       border:'1px solid rgba(6,182,212,0.2)', display:'inline-flex', alignItems:'center', gap:4 }}>
                  {f.name}
                  <button type="button" onClick={() => setReferencias(prev => prev.filter((_, j) => j !== i))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:10, lineHeight:1 }}>✕</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {erroEnvio && (
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                        borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f87171', marginBottom:16 }}>
            {erroEnvio}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, color:'#4b5563' }}>
            O pipeline será executado automaticamente após o envio.
          </span>
          <button type="submit" disabled={loading} className="btn-primary"
            style={{ padding:'12px 24px', borderRadius:12, fontSize:14, border:'none',
                     display:'flex', alignItems:'center', gap:8 }}>
            {loading ? 'Enviando...' : '⚡ Iniciar Pipeline'}
          </button>
        </div>
      </form>
    </div>
  )
}
