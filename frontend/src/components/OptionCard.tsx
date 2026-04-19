import { cn } from '../lib/utils'

interface OptionCardProps {
  label: string
  selected?: boolean
  onClick: () => void
}

export function OptionCard({ label, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
        'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5 text-foreground'
          : 'border-border bg-card text-foreground'
      )}
    >
      {label}
    </button>
  )
}
