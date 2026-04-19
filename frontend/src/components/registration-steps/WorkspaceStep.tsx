import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/input'
import { useRegistration } from '../../contexts/RegistrationContext'

export function WorkspaceStep() {
  const navigate = useNavigate()
  const { data, updateData } = useRegistration()
  const [workspace, setWorkspace] = useState(data.workspaceName)
  const [error, setError] = useState('')

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!workspace.trim()) {
      setError('Por favor, insira um nome para o workspace')
      return
    }

    if (workspace.trim().length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres')
      return
    }

    updateData({ workspaceName: workspace.trim() })
    finishRegistration()
  }

  const handleSkip = () => {
    updateData({ workspaceName: '' })
    finishRegistration()
  }

  const finishRegistration = () => {
    // Aqui você pode adicionar a lógica de envio para a API
    console.log('Dados do registro:', { ...data, workspaceName: workspace })
    navigate('/registration-complete')
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

        <Button type="submit" className="w-full">
          Continuar
        </Button>
      </form>

      <button
        type="button"
        onClick={handleSkip}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Pular por agora
      </button>
    </div>
  )
}
