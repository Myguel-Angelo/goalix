interface GoalixLogoProps {
  className?: string
}

export function GoalixLogo({ className = '' }: GoalixLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Placeholder - substitua pelo SVG da logo real */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"
          fill="currentColor"
        />
        <path
          d="M16 10c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 9c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"
          fill="currentColor"
        />
      </svg>
      <span className="text-xl font-bold text-foreground">Goalix</span>
    </div>
  )
}
