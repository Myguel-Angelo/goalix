// Tipagem dos dados de registro da empresa e do gerente/funcionario

export interface RegistrationData {
  // Dados do usuário
  fullName: string
  email: string
  password: string
  token: string

  // Método de autenticação: 'email' ou 'google'
  authMethod: 'email' | 'google' | ''
  google_id: string

  // JWT tokens (preenchidos após criar o owner e fazer login)
  accessToken: string
  refreshToken: string

  // Dados da empresa
  industry: string
  companySize: string
  role: string
  objective: string
  company_name: string
}

export const INDUSTRIES = [
  { value: 'technology', label: 'Tecnologia' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'retail', label: 'Varejo' },
  { value: 'health', label: 'Saúde' },
  { value: 'education', label: 'Educação' },
  // { value: 'marketing', label: 'Marketing' },
  { value: 'logistics', label: 'Logística' },
  { value: 'construction', label: 'Construção' },
  { value: 'other', label: 'Outro' },
] as const

export const COMPANY_SIZES = [
  { value: 'micro', label: '1-10 funcionários' },
  { value: 'small', label: '11-50 funcionários' },
  { value: 'medium', label: '51-200 funcionários' },
  { value: 'large', label: '200-1000 funcionários' },
  { value: 'extra_large', label: '+ 1000 funcionários' },
] as const

export const ROLES = [
  { value: 'ceo-fundador', label: 'CEO / Fundador' },
  { value: 'cto', label: 'CTO' },
  { value: 'coo', label: 'COO' },
  { value: 'vp', label: 'VP' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'outro', label: 'Outro' },
] as const

export const OBJECTIVES = [
  { value: 'prever-deadlines', label: 'Prever deadlines com mais precisão' },
  { value: 'melhorar-sprints', label: 'Melhorar planejamento de sprints' },
  { value: 'identificar-riscos', label: 'Identificar riscos antecipadamente' },
  { value: 'aumentar-engajamento', label: 'Aumentar engajamento do time' },
  { value: 'prever-metricas', label: 'Prever métricas de negócio' },
  { value: 'outro', label: 'Outro' },
] as const

export type RegistrationStep =
  | 'name'
  | 'email'
  | 'industry'
  | 'verification'
  | 'company-size'
  | 'role'
  | 'objectives'
  | 'workspace'
