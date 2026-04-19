import { useRegistration } from '../../contexts/RegistrationContext'
import { RegistrationLayout } from '../../components/RegistrationLayout'
import {
  NameStep,
  EmailStep,
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
  'industry',
  'company-size',
  'role',
  'objectives',
  'workspace',
]

export default function RegisterPage() {
  const { currentStep, setCurrentStep } = useRegistration()

  const currentStepIndex = STEP_ORDER.indexOf(currentStep)

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1])
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'name':
        return <NameStep />
      case 'email':
        return <EmailStep />
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

  return (
    <RegistrationLayout
      showBackButton={currentStepIndex > 0}
      onBack={handleBack}
    >
      {renderStep()}
    </RegistrationLayout>
  )
}
