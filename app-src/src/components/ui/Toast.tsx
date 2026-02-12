import { useContext } from 'react'
import { ToastContext, type Toast as ToastType } from '../../contexts/ToastContext'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { colors } from '../../styles/tokens'

const variantConfig = {
  success: {
    icon: CheckCircle,
    bg: '#10b98120',
    border: '#10b981',
    text: '#10b981',
  },
  error: {
    icon: XCircle,
    bg: '#ef444420',
    border: '#ef4444',
    text: '#ef4444',
  },
  info: {
    icon: Info,
    bg: '#3b82f620',
    border: '#3b82f6',
    text: '#3b82f6',
  },
}

function ToastItem({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  const config = variantConfig[toast.variant]
  const Icon = config.icon

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md transition-opacity duration-200"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: config.text }} />
      <p className="flex-1 text-sm" style={{ color: colors.text }}>
        {toast.message}
      </p>
      <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const context = useContext(ToastContext)
  
  if (!context) return null

  const { toasts, removeToast } = context

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}
