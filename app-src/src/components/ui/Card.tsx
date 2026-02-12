import type { ReactNode, HTMLAttributes } from 'react'
import { colors, borderRadius, shadows } from '../../styles/tokens'

type CardVariant = 'default' | 'outlined' | 'elevated'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: ReactNode
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const variantStyles: Record<CardVariant, { bg: string; border: string; shadow: string }> = {
  default: {
    bg: colors.surface,
    border: `1px solid ${colors.border}`,
    shadow: 'none',
  },
  outlined: {
    bg: 'transparent',
    border: `1px solid ${colors.border}`,
    shadow: 'none',
  },
  elevated: {
    bg: colors.surface,
    border: `1px solid ${colors.border}`,
    shadow: shadows.md,
  },
}

export function Card({ variant = 'default', children, className = '', style, ...props }: CardProps) {
  const variantStyle = variantStyles[variant]
  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: variantStyle.bg,
        border: variantStyle.border,
        boxShadow: variantStyle.shadow,
        borderRadius: borderRadius.lg,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-b ${className}`} style={{ borderColor: colors.border }} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-t ${className}`} style={{ borderColor: colors.border }} {...props}>
      {children}
    </div>
  )
}
