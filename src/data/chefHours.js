// Shared real-time chef availability helpers

export function getNowMins() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function fmt12(time24) {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function formatCountdown(mins) {
  if (mins <= 0) return null
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`
}

// Returns 'open' | 'paused' | 'closed'
export function chefStatus(chef) {
  if (!chef) return 'closed'
  if (!chef.available) return 'paused'
  const { open, close } = chef.availableHours || {}
  if (!open || !close) return 'open'
  if (open === '00:00' && close === '23:59') return 'open'
  const now = getNowMins()
  return now >= toMin(open) && now < toMin(close) ? 'open' : 'closed'
}

// Returns full hours info object for display
export function parseHours(chef) {
  if (!chef?.availableHours) return null
  const { open, close } = chef.availableHours
  const is24Hours = open === '00:00' && close === '23:59'
  const status = chefStatus(chef)
  if (is24Hours) return { status, is24Hours: true, minsUntilClose: Infinity, minsUntilOpen: 0, open, close }
  const now = getNowMins()
  const minsUntilClose = toMin(close) - now
  const minsUntilOpen = toMin(open) - now
  return { status, is24Hours: false, minsUntilClose, minsUntilOpen, open, close }
}
