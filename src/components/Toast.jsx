import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [message])

  if (!message) return null

  const styles = {
    success: 'bg-dark text-white border-l-4 border-brand',
    error:   'bg-dark text-white border-l-4 border-red-400',
    info:    'bg-dark text-white border-l-4 border-blue-400',
    warning: 'bg-dark text-white border-l-4 border-yellow-400',
  }

  const icons = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
    warning: '⚠️',
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl
        max-w-xs w-full text-sm font-medium
        transition-all duration-300
        ${styles[type] || styles.success}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <span className="text-base">{icons[type]}</span>
      <span className="flex-1">{message}</span>
    </div>
  )
}
