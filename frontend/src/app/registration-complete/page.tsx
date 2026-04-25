'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoalixLogo } from '@/components/GoalixLogo'
import { useRegistration } from '@/contexts/RegistrationContext'

export default function RegistrationCompletePage() {
  const { data } = useRegistration()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <GoalixLogo className="justify-center" />

        <div className="flex pt-4 justify-center">
          <CheckCircle className=" h-16 w-16 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Cadastro realizado com sucesso!
          </h1>
          <p className="text-muted-foreground">
            {data.fullName ? `Olá, ${data.fullName.split(' ')[0]}! ` : ''}
            Sua conta foi criada. Você já pode começar a usar a Goalix.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full" size="lg">
              Começar a usar
            </Button>
          </Link>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Ir para o login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
