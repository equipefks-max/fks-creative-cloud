'use client'
import { useState, useRef, useCallback } from 'react'
import { gerarPrompt, gerarMidia } from '@/lib/api'
import { CLIENTES } from '@/lib/types'

const FORMATOS_SAIDA = ['1:1 (Feed)', '9:16 (Stories/Reels)', '16:9 (YouTube)', '4:5 (Feed)']

interface Referencia {
  file: File
  preview: string
}

export default function MidiaPage() {
  // Passo 1 — entrada
  const [cliente, setCliente]     = useState('')
  const [formato, setFormato]     = useState(FORMATOS_SAIDA[0])
  const [descricao, setDescricao] = useState('')

  // Referências — coletadas no Passo 1, usadas no Passo 2
  const [refs, setRefs]           = useState<Referencia[]>([])
  const [dragOver, setDragOver]   = useState(false)
  const inputFileRef              = useRef<HTMLInputElement>(null)

  // Passo 2 — prompt gerado (editável)
  const [promptEditavel, setPromptEditavel] = useState('')
  const [negativoGerado, setNegativoGerado] = useState('')
  const [modoDetectado, setModoDetectado]   = useState('')
  const [promptPronto, setPromptPronto]     = useState(false)

  // Loading e resultado
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [loadingImagem, setLoadingImagem] = useState(false)
  const [erro, setErro]                   = useState('')
  const [resultado, setResultado]         = useState<{ url: string } | null>(null)

  // ── Upload ────────────────────────────────────────────────────────────────
  const adicionarArquivos = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setRefs(prev => [...prev, ...arr.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
  }, [])

  function removerRef(idx: number) {
    setRefs(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    adicionarArquivos(e.dataTransfer.files)
  }

  // ── Passo 1: Gerar Prompt ─────────────────────────────────────────────────
  async function handleGerarPrompt(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) { setErro('Descreva o que você quer gerar'); return }
    setErro(''); setLoadingPrompt(true); setPromptPronto(false); setResultado(null)
    try {
      const fd = new FormData()
      fd.append('descricao', descricao.trim())
      fd.append('cliente', cliente)
      fd.append('formato', formato)
      fd.append('tem_referencias', refs.length > 0 ? 'true' : 'false')
      const res = await gerarPrompt(fd)
      if (!res.sucesso || !res.prompt) throw new Error(res.erro || 'Prompt não retornado')
      setPromptEditavel(res.prompt)
      setNegativoGerado(res.negative_prompt || '')
      setModoDetectado(res.modo_detectado || 't2i')
      setPromptPronto(true)
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar prompt')
    } finally {
      setLoadingPrompt(false)
    }
  }

  // ── Passo 2: Gerar Imagem ─────────────────────────────────────────────────
  async function handleGerarImagem(e: React.FormEvent) {
    e.preventDefault()
    if (!promptEditavel.trim()) { setErro('O prompt não pode estar vazio'); return }
    const precisaRef = modoDetectado === 'i2i' || modoDetectado === 'comp'
    if (precisaRef && refs.length === 0) { setErro('Adicione ao menos uma imagem de referência'); return }
    setErro(''); setLoadingImagem(true); setResultado(null)
    try {
      const fd = new FormData()
      fd.append('modo', modoDetectado === 'comp' ? 'i2i' : (modoDetectado || 't2i'))
      fd.append('prompt', promptEditavel.trim())
      fd.append('formato', formato)
      refs.forEach(r => fd.append('referencias', r.file))
      const res = await gerarMidia(fd)
      if (!res.sucesso || !res.data_url) throw new Error((res as any).erro || 'Sem imagem retornada')
      setResultado({ url: res.data_url })
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar imagem')
    } finally {
      setLoadingImagem(false)
    }
  }

  function baixar() {
    if (!resultado) return
    const a = document.createElement('a')
    a.href = resultado.url; a.download = `fks-midia-${Date.now()}.png`; a.click()
  }

  function resetar() {
    setResultado(null); setPromptPronto(false); setDescricao('')
    setPromptEditavel(''); setNegativoGerado(''); setModoDetectado('')
    refs.forEach(r => URL.revokeObjectURL(r.preview)); setRefs([])
  }

  const precisaRef = modoDetectado === 'i2i' || modoDetectado === 'comp'

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div style={{ fontSize:14, color:'var(--muted-foreground)' }}>
            Workspace <span style={{ opacity:.4, margin:'0 6px' }}>/</span>
            <span style={{ color:'var(--foreground)' }}>Gerar Mídia</span>
          </div>
          <div className="online-pill"><span className="pulse-dot" /><span>Sistema online</span></div>
        </div>
      </header>

      <div style={{ padding:'24px 32px 60px' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:24 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:'clamp(1.5rem,3vw,2rem)', letterSpacing:'-.02em', lineHeight:1 }}>
            <span className="kinetic">Gerar</span> <span className="kinetic-blue">Mídia</span>
          </h1>
          <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--primary-glow)' }}>IA Generativa</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, maxWidth:960 }}>

          {/* ── Coluna esquerda ─────────────────────────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* PASSO 1 */}
            <form onSubmit={handleGerarPrompt}>
              <div className="bento p7" style={{ display:'flex', flexDirection:'column', gap:16 }}>

                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <StepBadge n={1} />
                  <span style={{ fontSize:13, fontWeight:600 }}>Descreva o que você quer gerar</span>
                </div>

                {/* Cliente */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:6 }}>
                    Cliente <span style={{ color:'#4b5563', fontWeight:400 }}>(carrega identidade visual)</span>
                  </label>
                  <select value={cliente} onChange={e => setCliente(e.target.value)} className="input-glass"
                    style={{ width:'100%', borderRadius:10, padding:'9px 14px', fontSize:13 }}>
                    <option value="">Sem cliente específico</option>
                    {CLIENTES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                {/* Formato */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:6 }}>
                    Formato de saída
                  </label>
                  <select value={formato} onChange={e => setFormato(e.target.value)} className="input-glass"
                    style={{ width:'100%', borderRadius:10, padding:'9px 14px', fontSize:13 }}>
                    {FORMATOS_SAIDA.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:6 }}>
                    Descrição
                  </label>
                  <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
                    placeholder="Ex: Post de lançamento do KOS, fundo neutro, arquitetura em destaque, luz natural..."
                    className="input-glass"
                    style={{ width:'100%', borderRadius:12, padding:'12px 14px', fontSize:13, resize:'vertical' }} />
                </div>

                {/* Upload de referências — opcional no Passo 1 */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:6 }}>
                    Imagem de referência
                    <span style={{ marginLeft:6, fontSize:10, color:'#4b5563', fontWeight:400 }}>
                      (opcional — aciona modo imagem→imagem)
                    </span>
                  </label>

                  {refs.length > 0 ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                      {refs.map((r, i) => (
                        <div key={i} style={{ position:'relative', width:58, height:58, borderRadius:8,
                                              overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)', flexShrink:0 }}>
                          <img src={r.preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          <button type="button" onClick={() => removerRef(i)}
                            style={{ position:'absolute', top:2, right:2, width:16, height:16, borderRadius:'50%',
                                      background:'rgba(0,0,0,0.75)', border:'none', color:'#f87171',
                                      cursor:'pointer', fontSize:10, display:'grid', placeItems:'center' }}>✕</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => inputFileRef.current?.click()}
                        style={{ width:58, height:58, borderRadius:8, border:'1px dashed rgba(255,255,255,0.15)',
                                  background:'rgba(255,255,255,0.03)', color:'#4b5563', cursor:'pointer',
                                  fontSize:20, display:'grid', placeItems:'center', flexShrink:0 }}>+</button>
                    </div>
                  ) : (
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)} onDrop={onDrop}
                      onClick={() => inputFileRef.current?.click()}
                      style={{ border: dragOver ? '2px dashed #6366f1' : '2px dashed rgba(255,255,255,0.08)',
                                borderRadius:10, padding:'16px', textAlign:'center', cursor:'pointer',
                                background: dragOver ? 'rgba(99,102,241,0.06)' : 'transparent',
                                transition:'all .15s', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:22, opacity:.4 }}>🖼️</span>
                      <span style={{ fontSize:12, color:'#4b5563' }}>
                        Arraste ou <span style={{ color:'#6366f1' }}>clique</span> para adicionar referência
                      </span>
                    </div>
                  )}
                  <input ref={inputFileRef} type="file" multiple accept="image/*" style={{ display:'none' }}
                    onChange={e => e.target.files && adicionarArquivos(e.target.files)} />
                </div>

                {erro && !promptPronto && <ErrorBox msg={erro} />}

                <button type="submit" disabled={loadingPrompt} className="btn-primary"
                  style={{ padding:'11px 20px', borderRadius:12, fontSize:14, border:'none',
                           display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {loadingPrompt ? <><Spinner /> Gerando prompt...</> : '✦ Gerar Prompt'}
                </button>
              </div>
            </form>

            {/* PASSO 2 — aparece após prompt gerado */}
            {promptPronto && (
              <form onSubmit={handleGerarImagem}>
                <div className="bento p7" style={{ display:'flex', flexDirection:'column', gap:16,
                                                    border:'1px solid rgba(99,102,241,0.22)' }}>

                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <StepBadge n={2} />
                    <span style={{ fontSize:13, fontWeight:600 }}>Revise o prompt e gere a imagem</span>
                    {modoDetectado && modoDetectado !== 't2i' && (
                      <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, textTransform:'uppercase',
                                      letterSpacing:'.1em', color:'#818cf8', background:'rgba(99,102,241,0.12)',
                                      padding:'3px 8px', borderRadius:6 }}>
                        {modoDetectado}
                      </span>
                    )}
                  </div>

                  {/* Aviso se modo precisa de referência mas nenhuma foi adicionada */}
                  {precisaRef && refs.length === 0 && (
                    <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)',
                                  borderRadius:10, padding:'10px 14px', fontSize:12, color:'#fbbf24',
                                  display:'flex', alignItems:'center', gap:8 }}>
                      <span>⚠</span>
                      O Claude detectou modo <strong>{modoDetectado}</strong> — adicione uma imagem de referência acima antes de gerar.
                    </div>
                  )}

                  {/* Prompt editável */}
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:6 }}>
                      Prompt <span style={{ color:'#4b5563', fontWeight:400 }}>(edite se necessário)</span>
                    </label>
                    <textarea value={promptEditavel} onChange={e => setPromptEditavel(e.target.value)} rows={6}
                      className="input-glass"
                      style={{ width:'100%', borderRadius:12, padding:'12px 14px', fontSize:12,
                               fontFamily:'monospace', resize:'vertical', lineHeight:1.6 }} />
                  </div>

                  {/* Negative prompt */}
                  {negativoGerado && (
                    <div>
                      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:6 }}>
                        Negative prompt
                      </label>
                      <textarea value={negativoGerado} onChange={e => setNegativoGerado(e.target.value)} rows={2}
                        className="input-glass"
                        style={{ width:'100%', borderRadius:10, padding:'10px 14px', fontSize:11,
                                 fontFamily:'monospace', resize:'vertical', color:'#f87171', lineHeight:1.5 }} />
                    </div>
                  )}

                  {erro && <ErrorBox msg={erro} />}

                  <button type="submit" disabled={loadingImagem} className="btn-primary"
                    style={{ padding:'11px 20px', borderRadius:12, fontSize:14, border:'none',
                             display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {loadingImagem ? <><Spinner /> Gerando imagem...</> : '🎨 Gerar Imagem'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Coluna direita — resultado ──────────────────────────────── */}
          <div className="bento p7" style={{ display:'flex', flexDirection:'column', alignItems:'center',
                        justifyContent: resultado || loadingImagem || loadingPrompt ? 'flex-start' : 'center',
                        minHeight:440 }}>

            {!resultado && !loadingImagem && !loadingPrompt && (
              <div style={{ textAlign:'center', color:'#374151' }}>
                <div style={{ fontSize:48, marginBottom:12, opacity:.25 }}>🖼️</div>
                <div style={{ fontSize:13 }}>
                  {promptPronto
                    ? 'Prompt pronto. Clique em "Gerar Imagem".'
                    : 'Descreva o que quer criar e clique em "Gerar Prompt".'}
                </div>
              </div>
            )}

            {loadingPrompt && (
              <div style={{ textAlign:'center', color:'#6b7280', paddingTop:40 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✦</div>
                <div style={{ fontSize:13, marginBottom:4 }}>Especialista analisando...</div>
                <div style={{ fontSize:11, color:'#374151' }}>Claude está construindo o prompt</div>
              </div>
            )}

            {loadingImagem && (
              <div style={{ textAlign:'center', color:'#6b7280', paddingTop:40 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✨</div>
                <div style={{ fontSize:13, marginBottom:4 }}>Gerando imagem...</div>
                <div style={{ fontSize:11, color:'#374151' }}>Isso pode levar alguns segundos</div>
              </div>
            )}

            {resultado && (
              <>
                <img src={resultado.url} alt="Mídia gerada"
                  style={{ width:'100%', borderRadius:12, objectFit:'contain', maxHeight:400 }} />
                <div style={{ display:'flex', gap:8, marginTop:14, width:'100%' }}>
                  <button onClick={baixar} className="btn-primary"
                    style={{ flex:1, padding:'10px 16px', borderRadius:10, fontSize:13, border:'none' }}>
                    ↓ Baixar
                  </button>
                  <button onClick={resetar}
                    style={{ padding:'10px 16px', borderRadius:10, fontSize:13, cursor:'pointer',
                             border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#6b7280' }}>
                    Nova imagem
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span style={{ width:22, height:22, borderRadius:'50%', background:'var(--gradient-primary)',
                    display:'grid', placeItems:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
      {n}
    </span>
  )
}

function Spinner() {
  return (
    <span style={{ display:'inline-block', width:13, height:13, border:'2px solid rgba(0,0,0,0.2)',
                   borderTop:'2px solid #000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                  borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f87171' }}>
      {msg}
    </div>
  )
}
