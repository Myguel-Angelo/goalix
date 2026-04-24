import { createContext, useContext, useState, type ReactNode } from "react";

import type { RegistrationData, RegistrationStep } from "../types/registrationType";

interface RegistrationContextType {
  data: RegistrationData
  currentStep: RegistrationStep
  updateData: (updates: Partial<RegistrationData>) => void
  setCurrentStep: (step: RegistrationStep) => void
  resetRegistration: () => void
}

const initialData = {
  fullName: '',
  email: '',
  password: '',
  industry: '',
  companySize: '',
  role: '',
  objective: '',
  company_name: '',
  token: '',
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined)

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RegistrationData>(initialData)
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('name')

  const updateData = (updates: Partial<RegistrationData>) => {
    setData((prev: any) => ({ ...prev, ...updates }))
  }

  const resetRegistration = () => {
    setData(initialData)
    setCurrentStep('name')
  }

  return <RegistrationContext.Provider
    value={{
      data,
      currentStep,
      updateData,
      setCurrentStep,
      resetRegistration
    }}
  >
    {children}
  </RegistrationContext.Provider>
}

export function useRegistration() {
  const context = useContext(RegistrationContext)
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider')
  }
  return context
}
