import { getToken } from './auth'
import type { JobStatus, Task, SistemaStatus } from './types'

const BASE = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE()}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Erro ${res.status}`)
  }
  return res.json()
}

// ── Briefing ──────────────────────────────────────────────────────────────────

export async function enviarBriefing(form: FormData): Promise<{ job_id: string }> {
  const token = getToken()
  const res = await fetch(`${BASE()}/api/briefing`, {
    method:  'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

export async function gerarMidia(form: FormData): Promise<{
  sucesso: boolean
  arquivo?: string
  data_url?: string
  erro?: string
}> {
  const token = getToken()
  const res = await fetch(`${BASE()}/api/midia`, {
    method:  'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body:    form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Erro ao gerar mídia')
  }
  return res.json()
}
