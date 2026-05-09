'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useRegistration } from '@/contexts/RegistrationContext'
import { registerOwner } from '@/services/auth.service'
import { GoalixLogo } from '@/components/GoalixLogo'

/**
 * Google OAuth callback page.
 *
 * The backend's GoogleCallbackView redirects here with query params:
 *
 * - type=register (new user):
 *     ?type=register&google_id=...&email=...&full_name=...
 *     → Registers the owner, gets JWT, continues to registration steps
 *
 * - type=register (existing user, no tenant):
 *     ?type=register&google_id=...&email=...&full_name=...&access=...&refresh=...&owner_exists=true
 *     → Already has JWT, continues to registration steps
 *
 * - type=login (existing user with tenant):
 *     ?type=login&access=...&refresh=...&tenant_slug=...
 *     → Stores tokens and redirects to dashboard
 *
 * - type=error:
 *     ?type=error&error=...
 *     → Displays error message
 */
function GoogleCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { updateData, setCurrentStep } = useRegistration()
  const [pageStatus, setPageStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const type = searchParams.get('type')

      // --- Error ---
      if (type === 'error') {
        setPageStatus('error')
        setErrorMsg(searchParams.get('error') || 'Erro na autenticação com Google.')
        return
      }

      // --- Login (existing user with tenant) ---
      if (type === 'login') {
        const access = searchParams.get('access')
        const refresh = searchParams.get('refresh')
        const tenantSlug = searchParams.get('tenant_slug')

        if (!access || !refresh) {
          setPageStatus('error')
          setErrorMsg('Tokens de autenticação não encontrados.')
          return
        }

        // TODO: Store tokens in auth store / localStorage
        // For now, redirect to dashboard
        router.push(`/`)
        return
      }

      // --- Registration (new user or existing without tenant) ---
      if (type === 'register') {
        const googleId = searchParams.get('google_id')
        const email = searchParams.get('email')
        const fullName = searchParams.get('full_name')
        const ownerExists = searchParams.get('owner_exists') === 'true'

        if (!googleId || !email) {
          setPageStatus('error')
          setErrorMsg('Dados do Google não encontrados. Tente novamente.')
          return
        }

        // If owner already exists (incomplete registration), use existing JWT
        if (ownerExists) {
          const access = searchParams.get('access')
          const refresh = searchParams.get('refresh')

          updateData({
            google_id: googleId,
            email: email,
            fullName: fullName || '',
            authMethod: 'google',
            accessToken: access || '',
            refreshToken: refresh || '',
          })

          setCurrentStep('industry')
          router.push('/register')
          return
        }

        // New user — register owner first
        updateData({
          google_id: googleId,
          email: email,
          fullName: fullName || '',
          authMethod: 'google',
        })

        const result = await registerOwner({
          full_name: fullName || '',
          email: email,
          google_id: googleId,
        })

        if (result.success) {
          updateData({
            accessToken: result.data?.access || '',
            refreshToken: result.data?.refresh || '',
          })
          setCurrentStep('industry')
          router.push('/register')
        } else {
          setPageStatus('error')
          setErrorMsg(result.error || 'Erro ao criar conta com Google.')
        }
        return
      }

      // Unknown type
      setPageStatus('error')
      setErrorMsg('Resposta inesperada do servidor.')
    }

    handleCallback()
  }, [searchParams, router, updateData, setCurrentStep])

  if (pageStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <GoalixLogo className="justify-center" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Erro na autenticação</h1>
            <p className="text-muted-foreground">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.push('/register')}
            className="text-primary hover:underline text-sm"
          >
            Voltar ao cadastro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <GoalixLogo className="justify-center" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Autenticando com Google...</h1>
          <p className="text-muted-foreground">Aguarde enquanto configuramos sua conta.</p>
        </div>
      </div>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Carregando...</h1>
          </div>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}
