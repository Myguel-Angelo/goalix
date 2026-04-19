interface GoalixLogoProps {
  className?: string
}

export function GoalixLogo({ className = '' }: GoalixLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-goalix.svg"
        alt="Goalix Logo"
        width={115}
        height={32}
        className="object-contain"
      />
    </div>
  )
}
