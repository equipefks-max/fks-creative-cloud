'use client'
import { useState, useRef, useCallback } from 'react'
import { gerarMidia } from '@/lib/api'

const TIPOS = ['Imagem feed', 'Stories', 'Carrossel', 'Reels thumbnail', 'TikTok thumbnail']
const ESTILOS = ['Realista', 'Flat design', 'Minimalista', 'Fotográfico', 'Ilustração']
const FORMATOS_SAIDA = ['1:1 (Feed)', '9:16 (Stories/Reels)', '16:9 (YouTube)', '4:5 (Feed)']

interface Referencia {
  file: File
  preview: string
}

export default function MidiaPage() {
  const [modo, setModo]           = useState<'t2i' | 'i2i'>('t2i')
  const [tipo, setTipo]           = useState(TIPOS[0])
  const [estilo, setEstilo]       = useState(ESTILOS[0])
  const [formato, setFormato]     = useState(FORMATOS_SAIDA[0])
  const [prompt, setPrompt]       = useState('')
  const [refs, setRefs]           = useState<Referencia[]>([])
  const [dragOver, setDragOver]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState('')
  const [resultado, setResultado] = useState<{ url?: string; tipo: string; promptMelhorado?: string } | null>(null)

  const inputFileRef = useRef<HTMLInputElement>(null)

  const adicionarArquivos = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    const novos: Referencia[] = arr.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setRefs(prev => [...prev, ...novos])
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

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) { setErro('Descreva o conteúdo desejado'); return }
    if (modo === 'i2i' && refs.length === 0) { setErro('Adicione ao menos uma imagem de referência'); return }
    setErro(''); setLoading(true); setResultado(null)
    try {
      const fd = new FormData()
      fd.append('modo', modo)
      fd.append('prompt', `${prompt.trim()}. Estilo: ${estilo}. Tipo: ${tipo}.`)
      fd.append('formato', formato)
      if (modo === 'i2i') {
        refs.forEach(r => fd.append('referencias', r.file))
      }
      const res = await gerarMidia(fd)
      if (!res.sucesso || !res.data_url) {
        throw new Error((res as any).erro || 'Servidor não retornou imagem')
      }
      setResultado({ url: res.data_url, tipo, promptMelhorado: res.prompt_melhorado })
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar mídia')
    } finally {
      setLoading(false)
    }
  }

  function baixar() {
    if (!resultado?.url) return
    const a = document.createElement('a')
    a.href = resultado.url; a.download = `fks-midia-${Date.now()}.png`; a.click()
  }

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

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, maxWidth:900 }}>

          {/* Painel esquerdo — formulário */}
          <form onSubmit={handleGerar}>
            <div className="bento p7" style={{ display:'flex', flexDirection:'column', gap:18 }}>

              {/* Toggle de modo */}
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
                  Modo de geração
                </label>
                <div style={{ display:'flex', gap:0, borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
                  {(['t2i', 'i2i'] as const).map((m, i) => (
                    <button key={m} type="button" onClick={() => setModo(m)}
                      style={{
                        flex:1, padding:'9px 0', fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
                        borderRight: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        background: modo === m ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                        color: modo === m ? '#a5b4fc' : '#6b7280',
                        transition: 'background .15s, color .15s',
                      }}>
                      {m === 't2i' ? 'Texto → Imagem' : 'Imagem → Imagem'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zona de upload de referências (só no modo i2i) */}
              {modo === 'i2i' && (
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
                    Imagens de referência
                    <span style={{ marginLeft:6, fontSize:10, color:'#4b5563' }}>(PNG, JPG — múltiplas)</span>
                  </label>

                  {/* Thumbnails das referências adicionadas */}
                  {refs.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                      {refs.map((r, i) => (
                        <div key={i} style={{ position:'relative', width:64, height:64, borderRadius:8,
                                              overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
                          <img src={r.preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          <button type="button" onClick={() => removerRef(i)}
                            style={{
                              position:'absolute', top:2, right:2, width:18, height:18, borderRadius:'50%',
                              background:'rgba(0,0,0,0.7)', border:'none', color:'#f87171', cursor:'pointer',
                              fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1,
                            }}>✕</button>
                        </div>
                      ))}
                      {/* Botão adicionar mais */}
                      <button type="button" onClick={() => inputFileRef.current?.click()}
                        style={{
                          width:64, height:64, borderRadius:8, border:'1px dashed rgba(255,255,255,0.15)',
                          background:'rgba(255,255,255,0.03)', color:'#4b5563', cursor:'pointer', fontSize:20,
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        }}>+</button>
                    </div>
                  )}

                  {/* Dropzone (só aparece quando não há refs ainda, ou sempre pequena) */}
                  {refs.length === 0 && (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => inputFileRef.current?.click()}
                      style={{
                        border: dragOver ? '2px dashed #6366f1' : '2px dashed rgba(255,255,255,0.1)',
                        borderRadius:12, padding:'28px 16px', textAlign:'center', cursor:'pointer',
                        background: dragOver ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                        transition:'all .15s',
                      }}>
                      <div style={{ fontSize:28, marginBottom:8, opacity:.5 }}>🖼️</div>
                      <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>
                        Arraste imagens aqui ou <span style={{ color:'#818cf8', textDecoration:'underline' }}>clique para selecionar</span>
                      </div>
                      <div style={{ fontSize:10, color:'#374151' }}>PNG, JPG · múltiplas imagens aceitas</div>
                    </div>
                  )}

                  <input ref={inputFileRef} type="file" multiple accept="image/*" style={{ display:'none' }}
                    onChange={e => e.target.files && adicionarArquivos(e.target.files)} />
                </div>
              )}

              {/* Tipo de conteúdo */}
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
                  Tipo de conteúdo
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {TIPOS.map(t => (
                    <button key={t} type="button" onClick={() => setTipo(t)}
                      className={`chip${tipo===t?' active':''}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo */}
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
                  Estilo visual
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {ESTILOS.map(s => (
                    <button key={s} type="button" onClick={() => setEstilo(s)}
                      className={`chip${estilo===s?' active':''}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formato de saída */}
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
                  Formato de saída
                </label>
                <select value={formato} onChange={e => setFormato(e.target.value)} className="input-glass"
                  style={{ width:'100%', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
                  {FORMATOS_SAIDA.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Prompt */}
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#9ca3af', marginBottom:8 }}>
                  {modo === 'i2i' ? 'Instrução / Transformação' : 'Descrição / Prompt'}
                </label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
                  placeholder={modo === 'i2i'
                    ? 'Ex: Mantenha a composição mas aplique o estilo minimalista da marca DAXO, fundo neutro e luz suave...'
                    : 'Ex: Produto de skincare sobre fundo branco minimalista, luz suave lateral, textura premium...'}
                  className="input-glass"
                  style={{ width:'100%', borderRadius:12, padding:'12px 14px', fontSize:13, resize:'vertical' }} />
              </div>

              {erro && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                              borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f87171' }}>
                  {erro}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary"
                style={{ padding:'12px 20px', borderRadius:12, fontSize:14, border:'none',
                         display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? (
                  <>
                    <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(0,0,0,0.3)',
                                    borderTop:'2px solid #000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    Gerando...
                  </>
                ) : (modo === 'i2i' ? '🎨 Transformar Imagem' : '🎨 Gerar Imagem')}
              </button>
            </div>
          </form>

          {/* Painel direito — resultado */}
          <div className="bento p7" style={{ display:'flex', flexDirection:'column', alignItems:'center',
                        justifyContent: resultado || loading ? 'flex-start' : 'center', minHeight:400 }}>
            {!resultado && !loading && (
              <div style={{ textAlign:'center', color:'#374151' }}>
                <div style={{ fontSize:48, marginBottom:12, opacity:.3 }}>🖼️</div>
                <div style={{ fontSize:13 }}>
                  {modo === 'i2i' && refs.length > 0
                    ? `${refs.length} referência${refs.length>1?'s':''} carregada${refs.length>1?'s':''}. Descreva a transformação e gere.`
                    : 'A imagem gerada aparecerá aqui'}
                </div>
                {/* Mini preview das referências no painel direito */}
                {modo === 'i2i' && refs.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginTop:16 }}>
                    {refs.map((r, i) => (
                      <img key={i} src={r.preview} alt=""
                        style={{ width:56, height:56, objectFit:'cover', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                )}
              </div>
            )}
            {loading && (
              <div style={{ textAlign:'center', color:'#6b7280', paddingTop:60 }}>
                <div style={{ fontSize:36, marginBottom:12 }}>✨</div>
                <div style={{ fontSize:13, marginBottom:4 }}>
                  {modo === 'i2i' ? 'Transformando imagem...' : 'Gerando imagem...'}
                </div>
                <div style={{ fontSize:11, color:'#374151' }}>Isso pode levar alguns segundos</div>
              </div>
            )}
            {resultado && (
              <>
                {resultado.url ? (
                  <img
                    src={resultado.url}
                    alt="Mídia gerada"
                    style={{ width:'100%', borderRadius:12, objectFit:'contain', maxHeight:320 }}
                  />
                ) : (
                  <div style={{ color:'#6b7280', fontSize:13, padding:20, textAlign:'center' }}>
                    Imagem gerada com sucesso mas sem preview disponível.
                  </div>
                )}

                {/* Prompt melhorado pelo especialista */}
                {resultado.promptMelhorado && (
                  <div style={{
                    marginTop:14, width:'100%', borderRadius:10,
                    background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)',
                    padding:'10px 12px',
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em',
                                  color:'#818cf8', marginBottom:6 }}>
                      Prompt enviado ao GPT-Image-2
                    </div>
                    <p style={{ fontSize:11, color:'#a5b4fc', lineHeight:1.6, margin:0, fontFamily:'monospace' }}>
                      {resultado.promptMelhorado}
                    </p>
                  </div>
                )}

                <div style={{ display:'flex', gap:8, marginTop:12, width:'100%' }}>
                  <button onClick={baixar} className="btn-primary"
                    style={{ flex:1, padding:'10px 16px', borderRadius:10, fontSize:13, border:'none' }}>
                    ↓ Baixar
                  </button>
                  <button onClick={() => setResultado(null)}
                    style={{ padding:'10px 16px', borderRadius:10, fontSize:13, cursor:'pointer',
                             border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#6b7280' }}>
                    Limpar
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
