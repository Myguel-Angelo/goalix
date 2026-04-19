import { useRegistration } from '../../contexts/RegistrationContext'
import { OptionCard } from '../OptionCard'
import { INDUSTRIES } from '../../types/registrationType'

export function IndustryStep() {
  const { data, updateData, setCurrentStep } = useRegistration()

  const handleSelect = (value: string) => {
    updateData({ industry: value })
    setCurrentStep('company-size')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Conte um pouco sobre sua empresa
        </h1>
        <p className="text-sm text-muted-foreground">Em qual setor você atua?</p>
      </div>

      <div className="space-y-2">
        {INDUSTRIES.map((industry) => (
          <OptionCard
            key={industry.value}
            label={industry.label}
            selected={data.industry === industry.value}
            onClick={() => handleSelect(industry.value)}
          />
        ))}
      </div>
    </div>
  )
}
