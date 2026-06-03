/**
 * useFaviconByRole
 * Swaps the browser tab favicon, title, and theme-color
 * whenever the logged-in user's role changes.
 *
 * Favicons live in /public/:
 *   favicon.svg          — default / logged-out
 *   favicon-customer.svg — customer role
 *   favicon-chef.svg     — chef role
 *   favicon-rider.svg    — rider role
 */
import { useEffect } from 'react'

const ROLE_CONFIG = {
  customer: {
    favicon:     '/favicon-customer.svg',
    title:       'HomeChef — Order Food',
    themeColor:  '#FF6B35',
  },
  chef: {
    favicon:     '/favicon-chef.svg',
    title:       'HomeChef — Chef Dashboard',
    themeColor:  '#16A34A',
  },
  rider: {
    favicon:     '/favicon-rider.svg',
    title:       'HomeChef — Rider Dashboard',
    themeColor:  '#4F46E5',
  },
  default: {
    favicon:     '/favicon.svg',
    title:       'HomeChef Marketplace',
    themeColor:  '#FF6B35',
  },
}

export function useFaviconByRole(role) {
  useEffect(() => {
    const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.default

    // ── Tab title ──
    document.title = config.title

    // ── Favicon ──
    let link = document.getElementById('favicon-link')
    if (!link) {
      link = document.createElement('link')
      link.id   = 'favicon-link'
      link.rel  = 'icon'
      link.type = 'image/svg+xml'
      document.head.appendChild(link)
    }
    link.href = config.favicon

    // ── Theme color (mobile browser chrome) ──
    let meta = document.getElementById('theme-color-meta')
    if (!meta) {
      meta = document.createElement('meta')
      meta.id   = 'theme-color-meta'
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = config.themeColor
  }, [role])
}
