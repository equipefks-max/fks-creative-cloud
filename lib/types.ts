export interface User {
  id: string
  nome: string
  role: 'admin' | 'cliente'
  cliente?: string
  force_change_password?: boolean
}

export interface LoginResponse {
  token: string
  force_change_password: boolean
  user: User
}

export interface JobStatus {
  job_id: string
  etapa: string
  mensagem: string
  clickup_url: string
  clickup_task_id: string
  erro_detalhe: string
  iniciado_em: string
  concluido: boolean
  erro: boolean
}

export interface Task {
  id: string
  nome: string
  cliente: string
  status: string
  assignees: string[]
  data_criacao: string
  prazo: string
  url: string
  tags: string[]
}

export interface SistemaStatus {
  bot_telegram: boolean
  webhook: boolean
  watchdog: boolean
  api_server: boolean
  ngrok: boolean
  ngrok_url: string
  timestamp: string
}

export const CLIENTES = [
  { value: 'hprime',        label: 'HPrime' },
  { value: 'daxo',          label: 'DAXO' },
  { value: 'scheffer',      label: 'Scheffer Atelier' },
  { value: 'desmodus',      label: 'Desmodus' },
  { value: 'meus momentos', label: 'Meus Momentos' },
  { value: 'mutuo studio',  label: 'Mútuo Studio' },
]

export const EQUIPE = [
  { nome: 'Rafael',        clickup_id: '96270997'  },
  { nome: 'Giulia',        clickup_id: '101216504' },
  { nome: 'Luis May',      clickup_id: '96270997'  },
  { nome: 'Luiza',         clickup_id: '89317548'  },
  { nome: 'William',       clickup_id: '89129188'  },
  { nome: 'Erika',         clickup_id: '89340000'  },
  { nome: 'Paul',          clickup_id: '89353095'  },
  { nome: 'Maria Eduarda', clickup_id: '95320777'  },
  { nome: 'Pedro Juninho', clickup_id: '95324421'  },
]

export const FORMATOS = [
  'Feed', 'Stories', 'Carrossel', 'Reels', 'TikTok',
  'LinkedIn', 'Roteiro', 'Legenda', 'Meta Ads', 'Google Ads', 'E-mail',
]

export const OBJETIVOS = [
  'Awareness', 'Engajamento', 'Conversão', 'Tráfego pago', 'Lançamento',
]

export const ETAPAS_PIPELINE = [
  { key: 'drive',    label: 'Base de Conhecimento' },
  { key: 'copy',     label: 'Geração de Copy' },
  { key: 'canvas',   label: 'Moodboard Visual' },
  { key: 'revisao',  label: 'Revisão' },
  { key: 'clickup',  label: 'Criando Task' },
  { key: 'prompts',  label: 'Prompts de Imagem' },
  { key: 'concluido',label: 'Concluído' },
]
