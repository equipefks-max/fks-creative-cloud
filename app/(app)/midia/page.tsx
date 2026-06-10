'use client'
import { useState } from 'react'
import { gerarMidia } from '@/lib/api'

const TIPOS = ['Imagem feed', 'Stories', 'Carrossel', 'Reels thumbnail', 'TikTok thumbnail']
const ESTILOS = ['Realista', 'Flat design', 'Minimalista', 'Fotográfico', 'Ilustração']
const FORMATOS_SAIDA = ['1:1 (Feed)', '9:16 (Stories/Reels)', '16:9 (YouTube)', '4:5 (Feed)']

export default function MidiaPage() {
  const [tipo, setTipo]           = useState(TIPOS[0])
  const [estilo, setEstilo]       = useState(ESTILOS[0])
  const [formato, setFormato]     = useState(FORMATOS_SAIDA[0])
  const [prompt, setPrompt]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState('')
  const [resultado, setResultado] = useState<{ url?: string; tipo: string } | null>(null)

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) { setErro('Descreva o conteúdo desejado'); return }
    setErro(''); setLoading(true); setResultado(null)
    try {
      // Montar FormData com os campos esperados pelo backend
      const fd = new FormData()
      fd.append('modo', 't2i')   // text-to-image
      // Enriquecer prompt com estilo e tipo escolhidos
      const promptFinal = `${prompt.trim()}. Estilo: ${estilo}. Tipo: ${tipo}. Formato: ${formato}.`
      fd.append('prompt', promptFinal)
      const res = await gerarMidia(fd)
      if (!res.sucesso || !res.data_url) {
        throw new Error((res as any).erro || 'Servidor não retornou imagem')
      }
      setResultado({ url: res.data_url, tipo })
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar mídia')
    } finally {
      setLoading(false)
    }
  }

  function baixar() {
    if (!resultado) return
    const src = resultado.url || ''
    if (!src) return
    const a = document.createElement('a')
    a.href = src; a.download = `fks-midia-${Date.now()}.png`; a.click()
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
                Descrição / Prompt
              </label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
                placeholder="Ex: Produto de skincare sobre fundo branco minimalista, luz suave lateral, textura premium..."
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
              ) : '🎨 Gerar Imagem'}
            </button>
          </div>
        </form>

        {/* Painel direito — resultado */}
        <div className="bento p7" style={{ display:'flex', flexDirection:'column', alignItems:'center',
                      justifyContent: resultado || loading ? 'flex-start' : 'center', minHeight:400 }}>
          {!resultado && !loading && (
            <div style={{ textAlign:'center', color:'#374151' }}>
              <div style={{ fontSize:48, marginBottom:12, opacity:.3 }}>🖼️</div>
              <div style={{ fontSize:13 }}>A imagem gerada aparecerá aqui</div>
            </div>
          )}
          {loading && (
            <div style={{ textAlign:'center', color:'#6b7280', paddingTop:60 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>✨</div>
              <div style={{ fontSize:13, marginBottom:4 }}>Gerando imagem...</div>
              <div style={{ fontSize:11, color:'#374151' }}>Isso pode levar alguns segundos</div>
            </div>
          )}
          {resultado && (
            <>
              {resultado.url ? (
                <img
                  src={resultado.url}
                  alt="Mídia gerada"
                  style={{ width:'100%', borderRadius:12, objectFit:'contain', maxHeight:360 }}
                />
              ) : (
                <div style={{ color:'#6b7280', fontSize:13, padding:20, textAlign:'center' }}>
                  Imagem gerada com sucesso mas sem preview disponível.
                </div>
              )}
              <div style={{ display:'flex', gap:8, marginTop:16, width:'100%' }}>
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
