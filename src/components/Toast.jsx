import React, { useEffect } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'

const TOAST_CONFIG = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info,
    iconColor: 'text-blue-600'
  }
}

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info
  const Icon = config.icon

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-slideDown">
      <div
        className={`
          ${config.bg} ${config.border} ${config.text}
          max-w-md w-full rounded-2xl px-4 py-3 shadow-lg border
          flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform
        `}
        onClick={onClose}
      >
        <Icon size={20} className={config.iconColor} strokeWidth={2.5} />
        <span className="flex-1 font-medium text-sm">{message}</span>
      </div>
    </div>
  )
}
