import { useState, useRef, useEffect } from 'react'
import { useRegistration } from '../../contexts/RegistrationContext'
import { confirmVerification, requestVerification } from '../../services/auth.service'

export function VerificationStep() {
  const { data, updateData, setCurrentStep } = useRegistration()
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are filled
    if (newCode.every(digit => digit !== '') && value) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (verificationCode: string) => {
    setIsLoading(true)
    setError('')

    const result = await confirmVerification(data.email, verificationCode)

    if (result.success) {
      updateData({ token: result.data?.token })
      setCurrentStep('industry')
    } else {
      setError(result.error || 'Código inválido. Tente novamente.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }

    setIsLoading(false)
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setError('')

    const result = await requestVerification(data.email)

    if (result.success) {
      setResendCooldown(60)
    } else {
      setError(result.error || 'Erro ao reenviar código.')
    }

    setIsResending(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Confira seu email</h1>
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para{' '}
          <span className="font-semibold text-foreground">{data.email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={`
              h-14 w-12 rounded-lg border text-center text-xl font-semibold
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-destructive' : 'border-input'}
              bg-background text-foreground
            `}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Não recebeu o código?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending
            ? 'Reenviando...'
            : resendCooldown > 0
              ? `Reenviar código (${resendCooldown}s)`
              : 'Reenviar código'}
        </button>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-center text-sm text-muted-foreground">
          O código expira em alguns minutos. Confira sua caixa de entrada e spam.
        </p>
      </div>
    </div>
  )
}
