/**
 * PromoInput — standalone promo code component
 * Props:
 *   appliedPromo  : string | null
 *   onApply(code) : called with the valid code string
 *   onRemove()    : called when user removes applied code
 */

const PROMO_CODES = {
  WELCOME20: { type: 'percent',  value: 20, label: '20% off' },
  FREEDEL:   { type: 'delivery', value: 0,  label: 'Free delivery' },
  BIRYANISO: { type: 'flat',     value: 50, label: '৳50 off' },
  NEWUSER:   { type: 'flat',     value: 30, label: '৳30 off' },
}

export { PROMO_CODES }

import { useState } from 'react'

export default function PromoInput({ appliedPromo, onApply, onRemove }) {
  const [input, setInput]     = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleApply = () => {
    const code = input.trim().toUpperCase()
    if (!code) { setError('Enter a promo code'); return }
    if (PROMO_CODES[code]) {
      setError('')
      setSuccess(`✓ ${PROMO_CODES[code].label} applied!`)
      onApply(code)
    } else {
      setSuccess('')
      setError('Invalid promo code')
    }
  }

  const handleRemove = () => {
    setInput('')
    setError('')
    setSuccess('')
    onRemove()
  }

  const suggestedCodes = Object.entries(PROMO_CODES).filter(([k]) => k !== appliedPromo)

  if (appliedPromo) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-bold text-sm">✓</span>
          <div>
            <p className="text-sm font-bold text-green-700">{appliedPromo}</p>
            <p className="text-xs text-green-600">{PROMO_CODES[appliedPromo]?.label}</p>
          </div>
        </div>
        <button onClick={handleRemove} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="input flex-1 uppercase text-sm font-mono"
          placeholder="Enter code e.g. WELCOME20"
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <button onClick={handleApply} className="btn-primary px-4 text-sm flex-shrink-0">
          Apply
        </button>
      </div>

      {error   && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-600 text-xs">{success}</p>}

      <div>
        <p className="text-xs text-gray-400 mb-2">Available vouchers — tap to apply:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedCodes.map(([code, info]) => (
            <button
              key={code}
              onClick={() => { setInput(code); setError(''); setSuccess(`✓ ${info.label} applied!`); onApply(code) }}
              className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 hover:border-brand text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
            >
              🏷️ {code} <span className="text-orange-400 font-normal">· {info.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
