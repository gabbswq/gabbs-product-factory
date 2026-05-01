'use client'

interface StrengthLevel {
  label: string
  color: string   // Tailwind bg-* class
  width: string   // Tailwind w-* class
}

const LEVELS: StrengthLevel[] = [
  { label: 'Muito fraca', color: 'bg-red-500',    width: 'w-1/4'  },
  { label: 'Fraca',       color: 'bg-orange-400', width: 'w-2/4'  },
  { label: 'Boa',         color: 'bg-yellow-400', width: 'w-3/4'  },
  { label: 'Forte',       color: 'bg-green-500',  width: 'w-full' },
]

/**
 * Scores a password from 0 (empty) to 4 (very strong).
 * Returns 0 when the password is blank so the meter stays hidden.
 */
function score(password: string): number {
  if (!password) return 0
  let pts = 0
  if (password.length >= 8)          pts++
  if (password.length >= 12)         pts++
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) pts++
  if (/[^A-Za-z0-9]/.test(password)) pts++
  return Math.max(1, pts)           // at least 1 when non-empty
}

interface Props {
  password: string
}

export function PasswordStrengthMeter({ password }: Props) {
  const level = score(password)

  if (!password) return null

  const { label, color, width } = LEVELS[level - 1]

  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color} ${width}`}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Força da senha: <span className="font-medium">{label}</span>
      </p>
    </div>
  )
}
