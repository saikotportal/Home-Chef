// Shared utility — real-time open/closed logic for chefs
// Used by both Chefs.jsx (listing) and ChefProfile.jsx (detail page)

function toMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function nowMin() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/**
 * Returns 'open' | 'closed' | '24h'
 * Respects notAcceptingOrders override.
 */
export function getChefStatus(chef) {
  if (!chef) return 'closed'
  if (chef.notAcceptingOrders) return 'closed'

  const { open, close } = chef.availableHours || {}
  if (!open || !close) return 'open'

  if (open === '00:00' && close === '23:59') return '24h'

  const now = nowMin()
  return now >= toMin(open) && now < toMin(close) ? 'open' : 'closed'
}

/** Format "08:00" → "8:00 AM", "23:00" → "11:00 PM" */
export function fmt12(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

/** Returns a short human label like "8 AM – 9 PM" */
export function hoursLabel(chef) {
  const { open, close } = chef.availableHours || {}
  if (!open || !close) return null
  if (open === '00:00' && close === '23:59') return '24 Hours'
  return `${fmt12(open)} – ${fmt12(close)}`
}

/** Minutes until opening (positive) or until closing (negative, means currently open) */
export function minutesUntilChange(chef) {
  const { open, close } = chef.availableHours || {}
  if (!open || !close) return null
  const now = nowMin()
  const status = getChefStatus(chef)
  if (status === '24h') return null
  if (status === 'open') return toMin(close) - now   // mins until close
  return toMin(open) - now                            // mins until open (may be negative = yesterday)
}
