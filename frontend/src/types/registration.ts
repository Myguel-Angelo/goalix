// Tipagem dos dados de registro da empresa e do gerente/funcionario

export interface RegistrationData {
  // Dados do usuário
  fullName: string
  email: string
  password: string

  // Dados da empresa
  industry: string
  companySize: string
  role: string
  objective: string
  workspaceName: string
}

export const INDUSTRIES = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'industria', label: 'Indústria' },
  { value: 'outro', label: 'Outro' },
] as const

export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 funcionários' },
  { value: '11-50', label: '11-50 funcionários' },
  { value: '51-200', label: '51-200 funcionários' },
  { value: '200+', label: '200+ funcionários' },
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
  | 'company-size'
  | 'role'
  | 'objectives'
  | 'workspace'

