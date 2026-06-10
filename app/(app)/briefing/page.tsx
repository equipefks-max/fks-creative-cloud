'use client'
import { useState, useRef, useEffect } from 'react'
import { enviarBriefing, getJobStatus } from '@/lib/api'
import { CLIENTES, EQUIPE, FORMATOS, OBJETIVOS, ETAPAS_PIPELINE } from '@/lib/types'

type Etapa        = 'form' | 'progress' | 'concluido' | 'erro'
type BriefingModo = 'texto' | 'arquivo' | 'ambos'

export default function BriefingPage() {
  const [etapa, setEtapa]               = useState<Etapa>('form')
  const [jobId, setJobId]               = useState('')
  const [jobStatus, setJobStatus]       = useState<any>(null)
  const [erroEnvio, setErroEnvio]       = useState('')
  const [loading, setLoading]           = useState(false)
  const [referencias, setReferencias]   = useState<File[]>([])
  const [responsaveis, setResponsaveis] = useState<string[]>([])
  const [formatos, setFormatos]         = useState<string[]>([])
  const [objetivo, setObjetivo]         = useState('')
  const [prazoVal, setPrazoVal]         = useState('')
  const [clienteVal, setClienteVal]     = useState('')
  const [briefingModo, setBriefingModo] = useState<BriefingModo>('texto')
  const [briefingArquivo, setBriefingArquivo] = useState<File | null>(null)
  const [briefingDragOver, setBriefingDragOver] = useState(false)
  const [refDragOver, setRefDragOver]   = useState(false)
  const [animatedIdx, setAnimatedIdx]   = useState(-1)
  const animTargetRef = useRef(-1)
  const refInputRef      = useRef<HTMLInputElement>(null)
  const briefingInputRef = useRef<HTMLInputElement>(null)
  const pollingRef       = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!jobStatus) return
    const idx = ETAPAS_PIPELINE.findIndex(e => e.key === jobStatus.etapa)
    if (idx >= 0) animTargetRef.current = idx
  }, [jobStatus?.etapa])

  useEffect(() => {
    if (animatedIdx >= animTargetRef.current) return
    const delay = animatedIdx < 0 ? 250 : 450
    const timer = setTimeout(() => setAnimatedIdx(prev => prev + 1), delay)
    return () => clearTimeout(timer)
  }, [animatedIdx, jobStatus?.etapa])

  function toggleItem(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val])
  }

  function addReferencias(files: FileList | null) {
    if (!files) return
    setReferencias(prev => [...prev, ...Array.from(files).filter(f => f.type.startsWith('image/'))])
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
    if (!clienteVal)                { setErroEnvio('Selecione um cliente'); return }
    if (responsaveis.length === 0)  { setErroEnvio('Selecione pelo menos um responsável'); return }
    if (formatos.length === 0)      { setErroEnvio('Selecione pelo menos um formato'); return }
    const textoEl = (e.currentTarget.elements.namedItem('briefing') as HTMLTextAreaElement | null)
    const textoVal = textoEl?.value?.trim() || ''
    if (briefingModo === 'texto'   && !textoVal)         { setErroEnvio('Preencha o texto do briefing'); return }
    if (briefingModo === 'arquivo' && !briefingArquivo)  { setErroEnvio('Anexe o arquivo de briefing'); return }
    if (briefingModo === 'ambos'   && !textoVal && !briefingArquivo) { setErroEnvio('Preencha texto ou anexe arquivo'); return }
    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('responsaveis',   JSON.stringify(responsaveis))
      fd.set('formatos',       JSON.stringify(formatos))
      fd.set('briefing_modo',  briefingModo)
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

  function resetForm() {
    setEtapa('form'); setReferencias([]); setResponsaveis([]); setFormatos([])
    setBriefingArquivo(null); setBriefingModo('texto'); setJobStatus(null)
    setAnimatedIdx(-1); setObjetivo(''); setPrazoVal(''); setClienteVal('')
  }

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const prazoDisplay = prazoVal
    ? (() => { const [y,m,d] = prazoVal.split('-'); return { dia: d, mes: MESES[+m-1] + ' · ' + y } })()
    : { dia: '—', mes: 'Defina a data de entrega' }

  // ── Tela de progresso ────────────────────────────────────────────────────────
  if (etapa === 'progress' || etapa === 'concluido' || etapa === 'erro') {
    const etapaAtualIdx = animatedIdx
    return (
      <div>
        <header className="topbar">
          <div className="topbar-inner">
            <div style={{ fontSize:14, color:'var(--muted-foreground)' }}>
              Workspace <span style={{ opacity:.4, margin:'0 6px' }}>/</span>
              <span style={{ color:'var(--foreground)' }}>Processando Briefing</span>
            </div>
            <div className="online-pill">
              <span className="pulse-dot" />
              <span>Pipeline ativo</span>
            </div>
          </div>
        </header>

        <div style={{ padding:'32px 48px 120px', maxWidth:700 }}>
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:600, letterSpacing:'-.02em' }}>
              <span className="kinetic">Pipeline</span> <span className="kinetic-blue">em andamento</span>
            </h1>
            <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:6 }}>Job #{jobId}</div>
          </div>

          <div className="bento p7" style={{ marginBottom:20 }}>
            <div style={{ fontSize:14, color:'var(--foreground)', fontWeight:500, marginBottom:20 }}>
              {jobStatus?.mensagem || 'Iniciando...'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {ETAPAS_PIPELINE.map((ep, idx) => {
                const done    = idx < etapaAtualIdx || (idx === etapaAtualIdx && jobStatus?.etapa === 'concluido')
                const current = idx === etapaAtualIdx && jobStatus?.etapa !== 'concluido' && etapa !== 'erro'
                const hasErro = etapa === 'erro' && idx === etapaAtualIdx
                const color   = hasErro ? '#f87171' : done ? '#00c471' : current ? 'var(--primary-glow)' : 'var(--muted-foreground)'
                const bg      = hasErro ? 'rgba(239,68,68,0.15)' : done ? 'rgba(0,196,113,0.15)' : current ? 'rgba(57,125,255,0.15)' : 'rgba(255,255,255,0.05)'
                const border  = hasErro ? 'rgba(239,68,68,0.4)'  : done ? 'rgba(0,196,113,0.4)'  : current ? 'rgba(57,125,255,0.4)'  : 'rgba(255,255,255,0.08)'
                return (
                  <div key={ep.key} style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div className={current ? 'step-current' : ''}
                      style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                               display:'grid', placeItems:'center', fontSize:11, fontWeight:700,
                               background:bg, border:`1px solid ${border}`, color, transition:'all .4s' }}>
                      {done ? '✓' : hasErro ? '✗' : current ? '…' : idx + 1}
                    </div>
                    <span style={{ fontSize:13, color, transition:'color .4s' }}>{ep.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {etapa === 'concluido' && (
            <div style={{ background:'rgba(0,196,113,0.08)', border:'1px solid rgba(0,196,113,0.2)',
                          borderRadius:20, padding:24, marginBottom:16 }}>
              <div style={{ color:'#00c471', fontWeight:600, marginBottom:8 }}>Pipeline concluído!</div>
              {jobStatus?.clickup_url && (
                <a href={jobStatus.clickup_url} target="_blank" rel="noopener noreferrer"
                  className="btn-ghost" style={{ marginTop:8 }}>
                  Ver task no ClickUp ↗
                </a>
              )}
            </div>
          )}

          {etapa === 'erro' && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                          borderRadius:20, padding:24, marginBottom:16 }}>
              <div style={{ color:'#f87171', fontWeight:600, marginBottom:4 }}>Erro no pipeline</div>
              <div style={{ color:'var(--muted-foreground)', fontSize:13 }}>{jobStatus?.erro_detalhe || 'Verifique os logs.'}</div>
            </div>
          )}

          <button onClick={resetForm} className="btn-primary shimmer" style={{ marginTop:8 }}>
            ⚡ Novo Briefing
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── Formulário ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div style={{ fontSize:14, color:'var(--muted-foreground)' }}>
            Workspace <span style={{ opacity:.4, margin:'0 6px' }}>/</span>
            <span style={{ color:'var(--foreground)' }}>Novo Briefing</span>
          </div>
          <div className="online-pill">
            <span className="pulse-dot" /><span>Sistema online</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ padding:'24px 32px 220px' }}>

        {/* Page title */}
        <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:24 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:'clamp(1.5rem,3vw,2rem)', letterSpacing:'-.02em', lineHeight:1 }}>
            <span className="kinetic">Novo</span> <span className="kinetic-blue">Briefing</span>
          </h1>
          <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--primary-glow)' }}>Pipeline FKS</span>
        </div>

        {/* Bento grid */}
        <div className="bgrid">

          {/* Cliente */}
          <div className="bento col-12 md-7 p7" style={{ minHeight:'auto' }}>
            <div className="field-label" style={{ color:'var(--primary-glow)' }}>Cliente</div>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24, marginTop:16 }}>
              <select name="cliente" required className="select-big"
                value={clienteVal} onChange={e => setClienteVal(e.target.value)}>
                <option value="">Selecionar cliente…</option>
                {CLIENTES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div style={{ display:'grid', placeItems:'center', width:48, height:48, flexShrink:0,
                            borderRadius:16, border:'1px solid var(--glass-border)', background:'#ffffff0d' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24" style={{ color:'var(--muted-foreground)' }}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:20, fontSize:12, color:'var(--muted-foreground)' }}>
              <span style={{ width:6, height:6, borderRadius:'9999px', background:'var(--primary-glow)', flexShrink:0 }} />
              Campo obrigatório para iniciar o pipeline
            </div>
          </div>

          {/* Prazo */}
          <div className="bento col-12 md-5 p6" style={{ display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'auto' }}>
            <div className="field-label">Prazo</div>
            <div style={{ marginTop:12 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'-.04em', lineHeight:.9, fontSize:'3.5rem' }}>
                {prazoDisplay.dia}
              </div>
              <div style={{ marginTop:4, fontSize:11, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--muted-foreground)' }}>
                {prazoDisplay.mes}
              </div>
            </div>
            <input type="date" name="prazo" className="date-input"
              value={prazoVal} onChange={e => setPrazoVal(e.target.value)} />
          </div>

          {/* Responsáveis */}
          <div className="bento col-12 md-7 p7" style={{ minHeight:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div className="field-label">Responsáveis</div>
                <p style={{ marginTop:4, fontSize:12, color:'var(--muted-foreground)' }}>Selecione membros do squad (múltiplos)</p>
              </div>
              <div style={{ fontSize:12, color:'var(--muted-foreground)' }}>{responsaveis.length} selecionados</div>
            </div>
            <div className="chip-wrap">
              {EQUIPE.map(m => (
                <button key={m.nome} type="button"
                  className={`chip${responsaveis.includes(m.nome) ? ' active' : ''}`}
                  onClick={() => toggleItem(responsaveis, setResponsaveis, m.nome)}>
                  <span className="mini-av">{m.nome[0]}</span>
                  {m.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div className="bento col-12 md-5 p7" style={{ minHeight:'auto' }}>
            <div className="field-label">Objetivo</div>
            <div className="chip-wrap">
              {OBJETIVOS.map(o => (
                <button key={o} type="button"
                  className={`chip${objetivo === o ? ' active' : ''}`}
                  onClick={() => setObjetivo(prev => prev === o ? '' : o)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                  {o}
                </button>
              ))}
            </div>
            <input type="hidden" name="objetivo" value={objetivo} />
          </div>

          {/* Formatos */}
          <div className="bento col-12 p7" style={{ minHeight:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div className="field-label">Formatos de conteúdo</div>
                <p style={{ marginTop:4, fontSize:12, color:'var(--muted-foreground)' }}>Quais entregáveis fazem parte deste briefing?</p>
              </div>
              <div style={{ fontSize:12, color:'var(--muted-foreground)' }}>{formatos.length} selecionados</div>
            </div>
            <div className="chip-wrap">
              {FORMATOS.map(f => (
                <button key={f} type="button"
                  className={`chip${formatos.includes(f) ? ' active' : ''}`}
                  onClick={() => toggleItem(formatos, setFormatos, f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Briefing */}
          <div className="bento col-12 md-8 p8" style={{ minHeight:'auto' }}>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div className="field-label" style={{ color:'var(--primary-glow)' }}>O Briefing</div>
                <h3 style={{ marginTop:4, fontSize:22, fontWeight:600, fontFamily:'var(--font-display)' }}>O que vamos criar hoje?</h3>
              </div>
              {/* Modo tabs */}
              <div style={{ display:'inline-flex', gap:2, padding:4, borderRadius:'9999px',
                            border:'1px solid var(--glass-border)', background:'#0000004d', fontSize:12 }}>
                {(['texto','arquivo','ambos'] as BriefingModo[]).map((m, i) => {
                  const icons = ['✏️','📄','🔗']; const labels = ['Texto','Arquivo','Ambos']
                  return (
                    <button key={m} type="button" onClick={() => setBriefingModo(m)}
                      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px',
                               borderRadius:'9999px', fontWeight: briefingModo === m ? 600 : 500,
                               background: briefingModo === m ? 'var(--gradient-primary)' : 'none',
                               color: briefingModo === m ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                               boxShadow: briefingModo === m ? 'var(--shadow-glow)' : 'none',
                               transition:'all .15s' }}>
                      {icons[i]} {labels[i]}
                    </button>
                  )
                })}
              </div>
            </div>

            {(briefingModo === 'texto' || briefingModo === 'ambos') && (
              <textarea name="briefing" className="brief"
                rows={briefingModo === 'ambos' ? 4 : 6}
                placeholder="Descreva o conteúdo que precisa ser criado, objetivo da campanha, referências, restrições…" />
            )}

            {(briefingModo === 'arquivo' || briefingModo === 'ambos') && (
              briefingArquivo ? (
                <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:12,
                              padding:'14px 20px', background:'rgba(57,125,255,0.08)',
                              border:'1px solid rgba(57,125,255,0.2)', borderRadius:16 }}>
                  <span style={{ fontSize:24 }}>📄</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {briefingArquivo.name}
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:2 }}>
                      {(briefingArquivo.size/1024).toFixed(0)} KB
                    </div>
                  </div>
                  <button type="button" className="btn-ghost" style={{ padding:'4px 12px', borderRadius:99 }}
                    onClick={() => setBriefingArquivo(null)}>Remover</button>
                </div>
              ) : (
                <div className={`dropzone${briefingDragOver ? ' drag' : ''}`}
                  onClick={() => briefingInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setBriefingDragOver(true) }}
                  onDragLeave={() => setBriefingDragOver(false)}
                  onDrop={e => { e.preventDefault(); setBriefingDragOver(false); const f = e.dataTransfer.files[0]; if(f) setBriefingArquivo(f) }}>
                  <input ref={briefingInputRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display:'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if(f) setBriefingArquivo(f) }} />
                  <div style={{ fontSize:14, color:'var(--muted-foreground)' }}>Arraste o arquivo do briefing aqui</div>
                  <div style={{ marginTop:4, fontSize:11, color:'#5b6776' }}>PDF, DOCX, TXT · ou clique para selecionar</div>
                </div>
              )
            )}
          </div>

          {/* CTA + Público */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="col-12 md-4">
            <div className="bento bento-accent p6" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'auto' }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--primary-glow)' }}>CTA</div>
                <input type="text" name="cta" className="text-input" placeholder="Ex: Acesse o link na bio"
                  style={{ marginTop:12 }} />
              </div>
              <div style={{ marginTop:16, fontSize:10, color:'var(--muted-foreground)' }}>Sugestão de chamada para ação</div>
            </div>
            <div className="bento p6" style={{ flex:1, minHeight:'auto' }}>
              <div className="field-label">Público-alvo</div>
              <input type="text" name="publico_alvo" className="text-input"
                placeholder="Ex: Mulheres 25–40, interesse em moda" style={{ marginTop:12 }} />
            </div>
          </div>

          {/* Referências visuais */}
          <div className="bento col-12 p7" style={{ minHeight:'auto' }}>
            <div className="field-label">
              Referências visuais / fotos do produto{' '}
              <span style={{ fontWeight:400, color:'#5b6776', textTransform:'none', letterSpacing:0 }}>(opcional)</span>
            </div>
            <div className={`dropzone${refDragOver ? ' drag' : ''}`}
              onClick={() => refInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setRefDragOver(true) }}
              onDragLeave={() => setRefDragOver(false)}
              onDrop={e => { e.preventDefault(); setRefDragOver(false); addReferencias(e.dataTransfer.files) }}>
              <input ref={refInputRef} type="file" multiple accept="image/*" style={{ display:'none' }}
                onChange={e => addReferencias(e.target.files)} />
              <div style={{ fontSize:14, color:'var(--muted-foreground)' }}>Arraste imagens de referência aqui</div>
              <div style={{ marginTop:4, fontSize:11, color:'#5b6776' }}>JPG, PNG, GIF, WebP · ou clique para selecionar</div>
            </div>
            {referencias.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:16 }}>
                {referencias.map((f, i) => {
                  const url = URL.createObjectURL(f)
                  return (
                    <div key={i} style={{ position:'relative', width:72, height:72, borderRadius:14,
                                          overflow:'hidden', border:'1px solid var(--glass-border)' }}>
                      <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      <button type="button" onClick={() => setReferencias(prev => prev.filter((_,j) => j !== i))}
                        style={{ position:'absolute', top:4, right:4, width:18, height:18, borderRadius:'9999px',
                                 background:'#000000b3', color:'#fff', fontSize:11, display:'grid', placeItems:'center' }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>{/* end bgrid */}

        {/* Erro */}
        {erroEnvio && (
          <div style={{ marginTop:16, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                        borderRadius:14, padding:'12px 16px', fontSize:13, color:'#f87171' }}>
            {erroEnvio}
          </div>
        )}

        {/* Dock flutuante */}
        <div className="dock-wrap">
          <div className="dock">
            <div style={{ display:'flex', alignItems:'center', gap:12, paddingRight:12 }}>
              <div style={{ display:'grid', placeItems:'center', width:36, height:36, borderRadius:12,
                            background:'#397dff33', color:'var(--primary-glow)' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>
                </svg>
              </div>
              <div style={{ lineHeight:1.2 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--primary-glow)' }}>Status</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:600 }}>
                  {clienteVal ? 'Pronto para enviar' : 'Preencha o cliente'}
                </div>
              </div>
            </div>
            <div style={{ width:1, height:36, background:'var(--glass-border)', flexShrink:0 }} />
            <div style={{ display:'flex', flex:1, alignItems:'center', gap:16, fontSize:12, color:'var(--muted-foreground)' }}>
              <span><b style={{ color:'var(--foreground)', fontWeight:600 }}>{formatos.length}</b> formatos</span>
              <span><b style={{ color:'var(--foreground)', fontWeight:600 }}>{responsaveis.length}</b> no squad</span>
              <span><b style={{ color:'var(--foreground)', fontWeight:600 }}>{objetivo || '—'}</b></span>
            </div>
            <button type="submit" disabled={loading} className="btn-primary shimmer">
              {loading ? 'Enviando…' : '⚡ Iniciar Pipeline'}
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
