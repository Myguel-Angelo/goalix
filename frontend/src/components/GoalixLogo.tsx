import Image from 'next/image'

interface GoalixLogoProps {
  className?: string
}

export function GoalixLogo({ className = '' }: GoalixLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo-goalix.svg"
        alt="Goalix Logo"
        width={92}
        height={26}
        className="object-contain"
        priority
      />
    </div>
  )
}
