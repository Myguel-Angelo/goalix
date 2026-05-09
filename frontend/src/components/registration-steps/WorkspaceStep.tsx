'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegistration } from '@/contexts/RegistrationContext'
import { registerTenant } from '@/services/auth.service'

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
    // Se pular, usa o nome padrão
    const defaultName = data.fullName
      ? slugify(data.fullName.split(' ')[0] + '-empresa')
      : 'minha-empresa'
    updateData({ company_name: defaultName })
    await finishRegistration(defaultName)
  }

  const finishRegistration = async (companyName: string) => {
    setIsLoading(true)
    setError('')

    if (!data.accessToken) {
      setError('Sessão expirada. Por favor, reinicie o cadastro.')
      setIsLoading(false)
      return
    }

    const result = await registerTenant(
      {
        company_name: companyName,
        company_sector: data.industry,
        company_size: data.companySize,
        company_country: 'BR',
      },
      data.accessToken,
    )

    if (result.success) {
      // Store the full JWT tokens (with tenant_id) — replaces registration tokens
      updateData({
        accessToken: result.data?.access || '',
        refreshToken: result.data?.refresh || '',
      })
      router.push('/registration-complete')
    } else {
      setError(result.error || 'Erro ao criar empresa. Tente novamente.')
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
          {isLoading ? 'Criando empresa...' : 'Continuar'}
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
