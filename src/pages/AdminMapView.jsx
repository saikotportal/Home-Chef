import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import chefsData from '../data/chefs.json'

const ZONE_LABELS = {
  1: 'Dhanmondi',
  2: 'Gulshan / Banani',
  3: 'Mirpur / Rampura',
  4: 'Old Dhaka / Motijheel',
  5: 'Uttara',
  6: 'Mohammadpur',
  7: 'Bashundhara',
}

function getNowMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function parseTime(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Single source of truth — matches ChefProfile logic exactly
function chefStatus(chef) {
  if (!chef?.available) return 'paused'
  const { open, close } = chef.availableHours || {}
  if (!open || !close) return 'open'
  if (open === '00:00' && close === '23:59') return 'open'
  const now = getNowMinutes()
  return now >= parseTime(open) && now < parseTime(close) ? 'open' : 'closed'
}

function isOpenNow(chef) {
  return chefStatus(chef) === 'open'
}

export default function AdminMapView() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markersRef = useRef([])
  const [filter, setFilter] = useState('all') // all | open | closed
  const [selectedZone, setSelectedZone] = useState('all')
  const [selectedChef, setSelectedChef] = useState(null)
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 })
  const [mapReady, setMapReady] = useState(false)

  const filteredChefs = chefsData.filter((c) => {
    const open = isOpenNow(c)
    if (filter === 'open' && !open) return false
    if (filter === 'closed' && open) return false
    if (selectedZone !== 'all' && c.zone !== Number(selectedZone)) return false
    return true
  })

  useEffect(() => {
    const total = chefsData.length
    const openCount = chefsData.filter(c => chefStatus(c) === 'open').length
    const pausedCount = chefsData.filter(c => chefStatus(c) === 'paused').length
    setStats({ total, open: openCount, paused: pausedCount, closed: total - openCount - pausedCount })
  }, [])

  // Load Leaflet CSS + JS dynamically if not already present
  useEffect(() => {
    const initMap = () => {
      if (leafletMap.current || !mapRef.current) return
      const L = window.L
      leafletMap.current = L.map(mapRef.current, {
        center: [23.777176, 90.399452],
        zoom: 12,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(leafletMap.current)
      setMapReady(true)
    }

    if (window.L) {
      initMap()
    } else {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'; link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!document.getElementById('leaflet-js')) {
        const s = document.createElement('script')
        s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        s.onload = initMap
        document.head.appendChild(s)
      } else {
        // script tag exists but may still be loading
        document.getElementById('leaflet-js').addEventListener('load', initMap)
      }
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
        setMapReady(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!leafletMap.current || !window.L) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    filteredChefs.forEach((chef) => {
      const status = chefStatus(chef)
      const open = status === 'open'
      const paused = status === 'paused'
      const ringColor = open ? '#FF6B35' : paused ? '#f59e0b' : '#6b7280'
      const dotColor = open ? '#22c55e' : paused ? '#f59e0b' : '#ef4444'

      const iconHtml = `
        <div style="
          width:40px;height:40px;border-radius:50%;
          border:3px solid ${ringColor};
          overflow:hidden;
          box-shadow: 0 0 ${open ? '10px #FF6B3588' : '4px #00000066'};
          background:#1A1A2E;
        ">
          <img src="${chef.avatar}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="
          width:10px;height:10px;border-radius:50%;
          background:${dotColor};
          border:2px solid #1A1A2E;
          position:absolute;bottom:0;right:0;
        "></div>
      `

      const icon = window.L.divIcon({
        html: `<div style="position:relative;width:40px;height:40px;">${iconHtml}</div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
      })

      const popup = window.L.popup({ className: 'hcm-popup', maxWidth: 260 }).setContent(`
        <div style="background:#16213E;color:#fff;border-radius:12px;padding:14px;font-family:Inter,sans-serif;min-width:220px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <img src="${chef.avatar}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #FF6B35;" />
            <div>
              <div style="font-weight:700;font-size:14px;">${chef.name}</div>
              <div style="font-size:11px;color:#FF6B35;">${chef.specialty}</div>
            </div>
          </div>
          <div style="font-size:12px;color:#9ca3af;margin-bottom:6px;">📍 ${chef.location}</div>
          <div style="font-size:12px;color:#9ca3af;margin-bottom:6px;">🕐 ${chef.availableHours.open} – ${chef.availableHours.close}</div>
          <div style="font-size:12px;color:#9ca3af;margin-bottom:10px;">⭐ ${chef.rating} · ${chef.totalOrders} orders</div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="
              padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;
              background:${open ? '#16a34a22' : paused ? '#f59e0b22' : '#dc262622'};
              color:${open ? '#4ade80' : paused ? '#fbbf24' : '#f87171'};
              border:1px solid ${open ? '#4ade8044' : paused ? '#fbbf2444' : '#f8717144'};
            ">${open ? '🟢 Open Now' : paused ? '⏸ Not Accepting' : '🔴 Closed'}</span>
            <span style="font-size:11px;color:#9ca3af;">Zone ${chef.zone}</span>
          </div>
        </div>
      `)

      const marker = window.L.marker([chef.lat, chef.lng], { icon })
        .addTo(leafletMap.current)
        .bindPopup(popup)

      marker.on('click', () => setSelectedChef(chef))
      markersRef.current.push(marker)
    })
  }, [filter, selectedZone, mapReady])

  function flyTo(chef) {
    if (!leafletMap.current) return
    leafletMap.current.flyTo([chef.lat, chef.lng], 15, { duration: 0.8 })
    setSelectedChef(chef)
  }

  return (
    <div className="bg-dark text-white flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div className="bg-dark-mid border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold">Live Chef Map</h1>
            <p className="text-xs text-gray-400">Real-time chef locations across Dhaka</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {stats.open} Open
          </span>
          <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {stats.paused ?? 0} Paused
          </span>
          <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {stats.closed} Closed
          </span>
          <span className="bg-white/10 px-3 py-1.5 rounded-full text-gray-300">
            {stats.total} Total
          </span>
        </div>
      </div>

      <div className="flex flex-1" style={{ minHeight: 0 }}>
        {/* Sidebar */}
        <div className="w-72 bg-dark-mid border-r border-white/10 flex flex-col" style={{ minHeight: 0 }}>
          {/* Filters */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Status</label>
              <div className="flex gap-2">
                {['all', 'open', 'closed'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                      filter === f
                        ? 'bg-brand text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Zone</label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-brand"
              >
                <option value="all">All Zones</option>
                {Object.entries(ZONE_LABELS).map(([z, label]) => (
                  <option key={z} value={z}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chef List */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="p-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
              {filteredChefs.length} chefs shown
            </div>
            {filteredChefs.map((chef) => {
              const status = chefStatus(chef)
              const open = status === 'open'
              const paused = status === 'paused'
              const isSelected = selectedChef?.id === chef.id
              return (
                <button
                  key={chef.id}
                  onClick={() => flyTo(chef)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition border-l-2 hover:bg-white/5 ${
                    isSelected
                      ? 'border-brand bg-brand/10'
                      : 'border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={chef.avatar}
                      alt={chef.name}
                      className="w-9 h-9 rounded-full object-cover border-2"
                      style={{ borderColor: open ? '#FF6B35' : paused ? '#f59e0b' : '#6b7280' }}
                    />
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-dark-mid"
                      style={{ background: open ? '#22c55e' : paused ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{chef.name}</div>
                    <div className="text-xs text-gray-400 truncate">{chef.specialty}</div>
                    <div className="text-xs mt-0.5" style={{ color: open ? '#4ade80' : paused ? '#fbbf24' : '#f87171' }}>
                      {chef.availableHours.open === '00:00' && chef.availableHours.close === '23:59' ? '24 Hours' : `${chef.availableHours.open} – ${chef.availableHours.close}`}{paused ? ' · ⏸ Paused' : ''}
                    </div>
                  </div>
                </button>
              )
            })}
            {filteredChefs.length === 0 && (
              <div className="px-4 py-12 text-center text-gray-500 text-sm">
                No chefs match this filter
              </div>
            )}
          </div>
        </div>

        {/* Map — isolated stacking context so Leaflet z-indexes don't escape */}
        <div className="flex-1 relative" style={{ isolation: 'isolate', zIndex: 0, minHeight: 0 }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Legend */}
          <div className="absolute bottom-6 right-6 bg-dark-mid/90 backdrop-blur border border-white/10 rounded-xl px-4 py-3 text-xs space-y-2">
            <div className="text-gray-400 font-medium mb-1">Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-gray-300">Open now</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-gray-300">Not accepting orders</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-gray-300">Closed / Outside hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand" />
              <span className="text-gray-300">Orange ring = selected</span>
            </div>
          </div>

          {/* Selected chef quick info card */}
          {selectedChef && (
            <div className="absolute top-4 left-4 bg-dark-mid/95 backdrop-blur border border-white/10 rounded-2xl p-4 w-64 shadow-xl animate-fade-in">
              <button
                onClick={() => setSelectedChef(null)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >✕</button>
              <div className="flex items-center gap-3 mb-3">
                <img src={selectedChef.avatar} className="w-11 h-11 rounded-full object-cover border-2 border-brand" />
                <div>
                  <div className="font-bold text-sm">{selectedChef.name}</div>
                  <div className="text-xs text-brand">{selectedChef.specialty}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-400">
                <div>📍 {selectedChef.location}</div>
                <div>🕐 {selectedChef.availableHours.open} – {selectedChef.availableHours.close}</div>
                <div>⭐ {selectedChef.rating} · {selectedChef.totalOrders} orders · {selectedChef.totalReviews} reviews</div>
              </div>
              <div className="mt-3 flex gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  chefStatus(selectedChef) === 'open'
                    ? 'bg-green-500/20 text-green-400'
                    : chefStatus(selectedChef) === 'paused'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {chefStatus(selectedChef) === 'open' ? '🟢 Open' : chefStatus(selectedChef) === 'paused' ? '⏸ Paused' : '🔴 Closed'}
                </span>
                <button
                  onClick={() => navigate(`/chef/${selectedChef.id}`)}
                  className="text-xs px-2.5 py-1 rounded-full bg-brand/20 text-brand hover:bg-brand hover:text-white transition font-semibold"
                >
                  View Profile →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hcm-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .hcm-popup .leaflet-popup-tip { display: none; }
        .hcm-popup .leaflet-popup-content { margin: 0 !important; }
      `}</style>
    </div>
  )
}
