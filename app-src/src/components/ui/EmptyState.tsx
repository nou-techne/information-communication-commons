import type { ReactNode } from 'react'
import { colors } from '../../styles/tokens'
import { Button } from '../Button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 opacity-50" style={{ color: colors.textMuted }}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
        {title}
      </h3>
      <p className="text-sm mb-6 max-w-md" style={{ color: colors.textSecondary }}>
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
