'use client'

import { useRegistration } from '@/contexts/RegistrationContext'
import { OptionCard } from '@/components/OptionCard'
import { COMPANY_SIZES } from '@/types/registrationType'

export function CompanySizeStep() {
  const { data, updateData, setCurrentStep } = useRegistration()

  const handleSelect = (value: string) => {
    updateData({ companySize: value })
    setCurrentStep('role')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Qual o tamanho da empresa?
        </h1>
        <p className="text-sm text-muted-foreground">Número de funcionários</p>
      </div>

      <div className="space-y-2">
        {COMPANY_SIZES.map((size) => (
          <OptionCard
            key={size.value}
            label={size.label}
            selected={data.companySize === size.value}
            onClick={() => handleSelect(size.value)}
          />
        ))}
      </div>
    </div>
  )
}
