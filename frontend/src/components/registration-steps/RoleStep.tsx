'use client'

import { useRegistration } from '@/contexts/RegistrationContext'
import { OptionCard } from '@/components/OptionCard'
import { ROLES } from '@/types/registrationType'

export function RoleStep() {
  const { data, updateData, setCurrentStep } = useRegistration()

  const handleSelect = (value: string) => {
    updateData({ role: value })
    setCurrentStep('objectives')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Qual é o seu cargo?
        </h1>
        <p className="text-sm text-muted-foreground">Sua posição na empresa</p>
      </div>

      <div className="space-y-2">
        {ROLES.map((role) => (
          <OptionCard
            key={role.value}
            label={role.label}
            selected={data.role === role.value}
            onClick={() => handleSelect(role.value)}
          />
        ))}
      </div>
    </div>
  )
}
