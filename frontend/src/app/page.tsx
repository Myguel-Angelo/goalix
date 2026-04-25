'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GoalixLogo } from '@/components/GoalixLogo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <GoalixLogo className="justify-center" />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Bem-vindo ao Goalix
          </h1>
          <p className="text-muted-foreground">
            Gerencie metas e previsões do seu time de forma inteligente
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/register" className="block">
            <Button className="w-full" size="lg">
              Criar conta
            </Button>
          </Link>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Entrar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
