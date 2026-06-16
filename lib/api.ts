import { getToken } from './auth'
import type { JobStatus, Task, SistemaStatus } from './types'

const BASE = () => process.env.NEXT_PUBLIC_API_URL || 'https://ewa-regretable-shanae.ngrok-free.dev'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE()}${path}`, {
    ...options,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // FastAPI 422 returns detail as array of validation error objects
    const detail = Array.isArray(err.detail)
      ? err.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
      : (err.detail || `Erro ${res.status}`)
    throw new Error(detail)
  }
  return res.json()
}

// ── Briefing ──────────────────────────────────────────────────────────────────

export async function enviarBriefing(form: FormData): Promise<{ job_id: string }> {
  const token = getToken()
  const res = await fetch(`${BASE()}/api/briefing`, {
    method:  'POST',
    headers: { 'ngrok-skip-browser-warning': 'true', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body:    form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Erro ao enviar briefing')
  }
  return res.json()
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/api/briefing/${jobId}/status`)
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(params: {
  cliente?: string
  status?:  string
  page?:    number
} = {}): Promise<{ tasks: Task[]; pagina: number }> {
  const qs = new URLSearchParams()
  if (params.cliente) qs.set('cliente', params.cliente)
  if (params.status)  qs.set('status',  params.status)
  if (params.page)    qs.set('page',    String(params.page))
  return apiFetch(`/api/tasks?${qs.toString()}`)
}

// ── Status do sistema ─────────────────────────────────────────────────────────

export async function getSistemaStatus(): Promise<SistemaStatus> {
  return apiFetch<SistemaStatus>('/api/status')
}

// ── Mídia ─────────────────────────────────────────────────────────────────────

export async function gerarPrompt(form: FormData): Promise<{
  sucesso: boolean
  prompt?: string
  negative_prompt?: string
  modo_detectado?: string
  aspect_ratio?: string
  erro?: string
  [key: string]: unknown
}> {
  const token = getToken()
  const res = await fetch(`${BASE()}/api/gerar-prompt`, {
    method:  'POST',
    headers: { 'ngrok-skip-browser-warning': 'true', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body:    form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detail = Array.isArray(err.detail)
      ? err.detail.map((d: any) => d.msg).join(', ')
      : err.detail || 'Erro ao gerar prompt'
    throw new Error(detail)
  }
  return res.json()
}

export async function gerarMidia(form: FormData): Promise<{
  sucesso: boolean
  arquivo?: string
  data_url?: string
  prompt_original?: string
  prompt_melhorado?: string
  erro?: string
  [key: string]: unknown
}> {
  const token = getToken()
  const res = await fetch(`${BASE()}/api/midia`, {
    method:  'POST',
    headers: { 'ngrok-skip-browser-warning': 'true', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body:    form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detail = Array.isArray(err.detail)
      ? err.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
      : (err.detail || 'Erro ao gerar mídia')
    throw new Error(detail)
  }
  return res.json()
}
