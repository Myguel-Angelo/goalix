'use client'

import { useRegistration } from '@/contexts/RegistrationContext'
import { OptionCard } from '@/components/OptionCard'
import { OBJECTIVES } from '@/types/registrationType'

export function ObjectivesStep() {
  const { data, updateData, setCurrentStep } = useRegistration()

  const handleSelect = (value: string) => {
    updateData({ objective: value })
    setCurrentStep('workspace')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Qual seu principal objetivo?
        </h1>
        <p className="text-sm text-muted-foreground">
          O que você quer alcançar com previsões
        </p>
      </div>

      <div className="space-y-2">
        {OBJECTIVES.map((objective) => (
          <OptionCard
            key={objective.value}
            label={objective.label}
            selected={data.objective === objective.value}
            onClick={() => handleSelect(objective.value)}
          />
        ))}
      </div>
    </div>
  )
}
