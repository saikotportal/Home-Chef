import { useEffect, useRef, useState } from 'react'

// Leaflet loaded via CDN in index.html — available as window.L
// Map shows 3 pins: chef kitchen, rider (moving), customer drop-off

const DHAKA_CENTER = [23.7634, 90.3890]

function lerp(a, b, t) {
  return a + (b - a) * t
}

export default function LiveTrackingMap({ order, chef, currentStepIdx, isDelivered }) {
  const mapRef    = useRef(null)
  const mapObj    = useRef(null)
  const riderRef  = useRef(null)
  const tRef      = useRef(0)
  const animRef   = useRef(null)

  // Derive coords from order / chef data
  const chefCoord    = chef?.lat ? [chef.lat, chef.lng] : DHAKA_CENTER
  // Customer coord: slight offset from chef (we don't have real customer GPS)
  const customerCoord = [
    chefCoord[0] + 0.018,
    chefCoord[1] + 0.012,
  ]
  // Rider starts at chef, moves to customer
  const riderStart = chefCoord
  const riderEnd   = customerCoord

  const [leafletReady, setLeafletReady] = useState(!!window.L)

  // Load Leaflet CSS + JS if not already present
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    if (!document.getElementById('leaflet-js')) {
      const script    = document.createElement('script')
      script.id       = 'leaflet-js'
      script.src      = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload   = () => setLeafletReady(true)
      document.head.appendChild(script)
    }
  }, [])

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapObj.current) return

    const L = window.L

    const map = L.map(mapRef.current, {
      center: [
        (chefCoord[0] + customerCoord[0]) / 2,
        (chefCoord[1] + customerCoord[1]) / 2,
      ],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // ── Chef marker (orange house pin) ──
    const chefIcon = L.divIcon({
      className: '',
      html: `<div style="background:#FF6B35;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
               <span style="transform:rotate(45deg);font-size:16px;display:block;text-align:center;line-height:30px;">🍳</span>
             </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    })
    L.marker(chefCoord, { icon: chefIcon })
      .addTo(map)
      .bindPopup(`<b>${chef?.name || 'Chef Kitchen'}</b><br/>Preparing your order`)

    // ── Customer marker (blue drop) ──
    const customerIcon = L.divIcon({
      className: '',
      html: `<div style="background:#3B82F6;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
               <span style="transform:rotate(45deg);font-size:16px;display:block;text-align:center;line-height:30px;">🏠</span>
             </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    })
    L.marker(customerCoord, { icon: customerIcon })
      .addTo(map)
      .bindPopup('<b>Your location</b><br/>Delivery address')

    // ── Dashed route line ──
    L.polyline([chefCoord, customerCoord], {
      color: '#FF6B35',
      weight: 3,
      dashArray: '8 8',
      opacity: 0.6,
    }).addTo(map)

    // ── Rider marker (animated scooter) ──
    const riderIcon = L.divIcon({
      className: '',
      html: `<div id="rider-pin" style="background:white;width:40px;height:40px;border-radius:50%;border:3px solid #FF6B35;box-shadow:0 2px 10px rgba(255,107,53,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    const riderMarker = L.marker(riderStart, { icon: riderIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<b>Your rider</b><br/>On the way!')

    riderRef.current = riderMarker
    mapObj.current   = map
  }, [leafletReady])

  // ── Animate rider based on status ──────────────────────────
  useEffect(() => {
    if (!mapObj.current || !riderRef.current) return
    if (animRef.current) clearInterval(animRef.current)

    // Only animate from picked_up onward
    if (currentStepIdx < 2) {
      riderRef.current.setLatLng(riderStart)
      return
    }

    if (isDelivered) {
      riderRef.current.setLatLng(riderEnd)
      return
    }

    // t progresses 0 → 1 over ~30 seconds (simulated ride)
    tRef.current = currentStepIdx >= 3 ? 0.5 : 0.05
    animRef.current = setInterval(() => {
      tRef.current = Math.min(tRef.current + 0.008, 1)
      const lat = lerp(riderStart[0], riderEnd[0], tRef.current)
      const lng = lerp(riderStart[1], riderEnd[1], tRef.current)
      riderRef.current.setLatLng([lat, lng])

      if (tRef.current >= 1) clearInterval(animRef.current)
    }, 200)

    return () => clearInterval(animRef.current)
  }, [currentStepIdx, isDelivered])

  if (!leafletReady) {
    return (
      <div className="h-56 rounded-2xl bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-xs">Loading map…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ isolation: 'isolate', zIndex: 0 }}>
      <div ref={mapRef} style={{ height: '240px', width: '100%', position: 'relative', zIndex: 0 }} />

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow text-xs">
        <div className="flex items-center gap-2"><span>🍳</span><span className="text-gray-600">Chef Kitchen</span></div>
        <div className="flex items-center gap-2"><span>🛵</span><span className="text-gray-600">Rider</span></div>
        <div className="flex items-center gap-2"><span>🏠</span><span className="text-gray-600">Your address</span></div>
      </div>

      {/* Live badge */}
      {!isDelivered && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow text-xs font-semibold text-green-600">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      )}
    </div>
  )
}
