import { useState, useEffect } from 'react'
import { useRegistration } from '../../contexts/RegistrationContext'
import { RegistrationLayout } from '../../components/RegistrationLayout'
import {
  NameStep,
  EmailStep,
  VerificationStep,
  IndustryStep,
  CompanySizeStep,
  RoleStep,
  ObjectivesStep,
  WorkspaceStep,
} from '../../components/registration-steps'
import type { RegistrationStep } from '../../types/registrationType'

const STEP_ORDER: RegistrationStep[] = [
  'name',
  'email',
  'verification',
  'industry',
  'company-size',
  'role',
  'objectives',
  'workspace',
]

export default function RegisterPage() {
  const { currentStep, setCurrentStep } = useRegistration()
  const [direction, setDirection] = useState<'forward' | 'back' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayStep, setDisplayStep] = useState(currentStep)

  const currentStepIndex = STEP_ORDER.indexOf(currentStep)
  // const previousStepIndex = STEP_ORDER.indexOf(displayStep)

  useEffect(() => {
    if (currentStep !== displayStep) {
      const newIndex = STEP_ORDER.indexOf(currentStep)
      const oldIndex = STEP_ORDER.indexOf(displayStep)

      setDirection(newIndex > oldIndex ? 'forward' : 'back')
      setIsAnimating(true)

      // Aguarda a animação de saída completar
      setTimeout(() => {
        setDisplayStep(currentStep)
      }, 150)

      // Completa a animação de entrada
      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    }
  }, [currentStep, displayStep])

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1])
    }
  }

  const renderStep = () => {
    switch (displayStep) {
      case 'name':
        return <NameStep />
      case 'email':
        return <EmailStep />
      case 'verification':
        return <VerificationStep />
      case 'industry':
        return <IndustryStep />
      case 'company-size':
        return <CompanySizeStep />
      case 'role':
        return <RoleStep />
      case 'objectives':
        return <ObjectivesStep />
      case 'workspace':
        return <WorkspaceStep />
      default:
        return <NameStep />
    }
  }

  // Classes de animação baseadas na direção
  const getAnimationClasses = () => {
    if (!isAnimating && direction === null) {
      return 'opacity-100 translate-x-0'
    }

    if (direction === 'forward') {
      return isAnimating
        ? 'opacity-0 -translate-x-8'
        : 'opacity-100 translate-x-0'
    }

    // direction === 'back'
    return isAnimating
      ? 'opacity-0 translate-x-8'
      : 'opacity-100 translate-x-0'
  }

  return (
    <RegistrationLayout
      showBackButton={currentStepIndex > 0}
      onBack={handleBack}
    >
      <div
        className={`transition-all duration-300 ease-out ${getAnimationClasses()}`}
        key={displayStep}
      >
        {renderStep()}
      </div>
    </RegistrationLayout>
  )
}
