'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegistration } from '@/contexts/RegistrationContext'
import { registerTenantUser } from '@/services'

export function WorkspaceStep() {
  const router = useRouter()
  const { data, updateData } = useRegistration()
  const [workspace, setWorkspace] = useState(data.company_name)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const workspaceSlug = slugify(workspace)

  useEffect(() => {
    if (!workspace && data.fullName) {
      const defaultWorkspace = slugify(data.fullName.split(' ')[0] + '-empresa')
      setWorkspace(defaultWorkspace)
    }
  }, [data.fullName, workspace])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workspace.trim()) {
      setError('Por favor, insira um nome para o workspace')
      return
    }

    if (workspace.trim().length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres')
      return
    }

    updateData({ company_name: workspace.trim() })
    await finishRegistration(workspace.trim())
  }

  const handleSkip = async () => {
    updateData({ company_name: '' })
    await finishRegistration('')
  }

  const finishRegistration = async (company_name: string) => {
    setIsLoading(true)
    setError('')

    const payload = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      token: data.token,
      industry: data.industry,
      companySize: data.companySize,
      role: data.role,
      objective: data.objective,
      company_name: company_name,
    }

    const result = await registerTenantUser(payload)

    if (result.success) {
      // Navegação para página inicial levando os tokens JWT
      router.push('/registration-complete')
    } else {
      setError(result.error || 'Erro ao criar conta. Tente novamente.')
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Como você quer chamar seu workspace?
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha um nome que seu time vai reconhecer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="minha-empresa"
            value={workspace}
            onChange={(e) => {
              setWorkspace(e.target.value)
              setError('')
            }}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            URL: goalix.app/{workspaceSlug || 'workspace'}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Criando conta...' : 'Continuar'}
        </Button>
      </form>

      <button
        type="button"
        onClick={handleSkip}
        disabled={isLoading}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        Pular por agora
      </button>
    </div>
  )
}
