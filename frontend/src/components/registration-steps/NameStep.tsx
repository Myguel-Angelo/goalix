import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/input'
import { useRegistration } from '../../contexts/RegistrationContext'

export function NameStep() {
  const { data, updateData, setCurrentStep } = useRegistration()
  const [name, setName] = useState(data.fullName)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Por favor, insira seu nome')
      return
    }

    if (name.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres')
      return
    }

    updateData({ fullName: name.trim() })
    setCurrentStep('email')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Como devemos te chamar?
        </h1>
        <p className="text-sm text-muted-foreground">Seu nome completo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="João Silva"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full">
          Continuar
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
