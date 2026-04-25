'use client'

import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { GoalixLogo } from './GoalixLogo'

interface RegistrationLayoutProps {
  children: ReactNode
  showBackButton?: boolean
  onBack?: () => void
}

export function RegistrationLayout({
  children,
  showBackButton = false,
  onBack,
}: RegistrationLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center border-b border-border px-4">
        <div className="relative flex w-full items-center justify-center">
          {showBackButton && onBack ? (
            <button
              onClick={onBack}
              className="absolute left-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <div />
          )}
          <GoalixLogo />
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
