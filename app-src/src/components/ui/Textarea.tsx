import type { TextareaHTMLAttributes } from 'react'
import { colors, borderRadius } from '../../styles/tokens'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Textarea({ label, error, helperText, className = '', ...props }: TextareaProps) {
  const hasError = !!error
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none ${className}`}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${hasError ? colors.error : colors.border}`,
          borderRadius: borderRadius.md,
        }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs" style={{ color: colors.error }}>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
          {helperText}
        </p>
      )}
    </div>
  )
}
