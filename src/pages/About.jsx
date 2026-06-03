import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ── tiny hook: fires callback once element enters viewport ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ── animated counter ── */
function Counter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useInView()
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start = Math.min(start + step, target)
      setCount(start)
      if (start >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [visible, target, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

/* ── section wrapper with slide-up ── */
function Section({ children, className = '', delay = 0 }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const STATS = [
  { value: 120, suffix: '+', label: 'Home Chefs' },
  { value: 3400, suffix: '+', label: 'Meals Delivered' },
  { value: 18, suffix: '', label: 'Dhaka Areas' },
  { value: 98, suffix: '%', label: 'Happy Customers' },
]

const VALUES = [
  { emoji: '🏠', title: 'Community First', desc: "Every meal connects a home cook with a neighbour. We're not a restaurant chain - we're a community marketplace built on trust." },
  { emoji: '🥘', title: 'Real Home Food', desc: "No commercial kitchens. No preservatives. Just the kind of food your nanu would make - cooked with care, served with love." },
  { emoji: '⚡', title: 'Fast & Reliable', desc: 'Our rider network covers 18 areas across Dhaka with live GPS tracking, so you always know where your biryani is.' },
  { emoji: '💚', title: 'Chef Empowerment', desc: 'We give home cooks the tools to run a real business - dashboards, earnings analytics, customer reviews and direct payouts.' },
]

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Browse & Discover', desc: 'Explore hundreds of home-cooked meals from verified chefs near you. Filter by cuisine, area, dietary need, or chef rating.' },
  { step: '02', icon: '🛒', title: 'Order & Customise', desc: 'Add meals to your cart, pick your portion size, leave a note for the chef. Pay online or cash on delivery.' },
  { step: '03', icon: '🍳', title: 'Chef Prepares', desc: "Your order lands on the chef's dashboard instantly. They cook it fresh and mark it ready - you see status in real time." },
  { step: '04', icon: '🛵', title: 'Rider Delivers', desc: 'A nearby rider picks it up and heads your way. Track them live on the map until the food reaches your door.' },
]

const TECH_STACK = [
  { name: 'React 18', color: '#61DAFB', icon: '⚛️' },
  { name: 'Vite', color: '#646CFF', icon: '⚡' },
  { name: 'Tailwind CSS', color: '#38BDF8', icon: '🎨' },
  { name: 'React Router', color: '#CA4245', icon: '🔀' },
  { name: 'Leaflet', color: '#3D9970', icon: '🗺️' },
  { name: 'Context API', color: '#FF6B35', icon: '🔗' },
]

/* ────────────────────────────────────────────
   DEVELOPER CARD  — fully animated
──────────────────────────────────────────── */
function DeveloperCard() {
  const [hovered, setHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const cardRef = useRef(null)
  const [ref, visible] = useInView(0.1)

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }

  const rotateX = hovered ? (mousePos.y - 0.5) * -16 : 0
  const rotateY = hovered ? (mousePos.x - 0.5) * 16 : 0
  const glowX = mousePos.x * 100
  const glowY = mousePos.y * 100

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(48px) scale(0.95)',
        transition: 'opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s',
      }}
      className="flex justify-center"
    >
      <div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMousePos({ x: 0.5, y: 0.5 }) }}
        onMouseMove={handleMouseMove}
        style={{
          transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${hovered ? 1.03 : 1})`,
          transition: hovered ? 'transform 0.1s ease' : 'transform 0.5s ease',
        }}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden cursor-pointer select-none"
      >
        {/* Card background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460]" />

        {/* Animated glow following mouse */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: hovered ? 0.35 : 0,
            background: `radial-gradient(circle 200px at ${glowX}% ${glowY}%, #FF6B35, transparent)`,
          }}
        />

        {/* Sparkle dots */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-brand"
            style={{
              top: `${10 + i * 15}%`,
              left: `${5 + i * 16}%`,
              opacity: hovered ? 0.6 : 0.15,
              transform: hovered ? `scale(${1 + (i % 3) * 0.5}) translate(${(i % 2 === 0 ? 1 : -1) * 4}px, ${(i % 3) * -3}px)` : 'scale(1)',
              transition: `all ${0.3 + i * 0.08}s ease`,
            }}
          />
        ))}

        {/* Border shimmer */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: hovered
              ? `linear-gradient(135deg, rgba(255,107,53,0.5) 0%, transparent 50%, rgba(255,107,53,0.2) 100%)`
              : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
            transition: 'background 0.4s ease',
            padding: '1px',
          }}
        />
        <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460]" />

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Spinning ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(#FF6B35, #FF8C5A, #1A1A2E, #FF6B35)',
                animation: 'spin 3s linear infinite',
                padding: '3px',
              }}
            />
            <div className="absolute inset-[3px] rounded-full bg-[#16213E] flex items-center justify-center">
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-5xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #FF6B35, #E5501A)',
                  transform: hovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
              >
                S
              </div>
            </div>
            {/* Online dot */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#16213E] animate-pulse" />
          </div>

          {/* Name & role */}
          <div className="text-center mb-6">
            <h3
              className="text-2xl font-black text-white tracking-tight mb-1"
              style={{
                textShadow: hovered ? '0 0 20px rgba(255,107,53,0.6)' : 'none',
                transition: 'text-shadow 0.3s ease',
              }}
            >
              Saikot Islam Abir
            </h3>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/30">
                Designer & Developer
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Crafting interfaces that feel alive. Full-stack mindset, frontend obsession.
            </p>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {['React', 'UI/UX', 'Tailwind', 'Node', 'Figma', 'Motion'].map((s, i) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all duration-300"
                style={{
                  background: hovered ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.06)',
                  color: hovered ? '#FF8C5A' : '#9ca3af',
                  border: hovered ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  transitionDelay: `${i * 30}ms`,
                  transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { val: '58', label: 'Projects' },
              { val: '5+ yr', label: 'Experience' },
              { val: '∞', label: 'Coffee' },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="text-center p-2 rounded-xl transition-all duration-300"
                style={{
                  background: hovered ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.04)',
                  border: hovered ? '1px solid rgba(255,107,53,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-white font-black text-lg leading-none">{val}</p>
                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Link button */}
          <a
            href="https://saikot.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 group/btn"
            style={{
              background: hovered
                ? 'linear-gradient(135deg, #FF6B35, #E5501A)'
                : 'rgba(255,107,53,0.12)',
              color: hovered ? '#fff' : '#FF6B35',
              border: '1px solid rgba(255,107,53,0.4)',
              boxShadow: hovered ? '0 8px 24px rgba(255,107,53,0.35)' : 'none',
              transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <span>saikot.dev</span>
            <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Bottom shimmer bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: 'linear-gradient(90deg, transparent, #FF6B35, transparent)',
          }}
        />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────── */
export default function About() {
  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <section className="relative bg-dark text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-brand/5 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div
            className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
            style={{ animation: 'fadeIn 0.6s ease' }}
          >
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            About HomeChef
          </div>
          <h1
            className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight"
            style={{ animation: 'slideUp 0.7s ease 0.1s both' }}
          >
            Real food from{' '}
            <span className="text-brand">real kitchens</span>
            <br />in your city
          </h1>
          <p
            className="text-gray-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ animation: 'slideUp 0.7s ease 0.2s both' }}
          >
            HomeChef is a community marketplace connecting passionate home cooks with food lovers across Dhaka.
            No restaurant overhead. No preservatives. Just honest, delicious home cooking - delivered.
          </p>
          <div
            className="flex flex-wrap gap-4 justify-center"
            style={{ animation: 'slideUp 0.7s ease 0.3s both' }}
          >
            <Link to="/listings" className="btn-primary">
              Browse Meals →
            </Link>
            <Link to="/become-a-chef" className="btn-outline">
              Become a Chef
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <Section key={s.label} delay={i * 80} className="text-center">
                <p className="text-4xl font-black text-brand mb-1">
                  <Counter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <Section className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-brand">Our Mission</span>
          <h2 className="text-3xl sm:text-4xl font-black text-dark mt-3 mb-4">Why HomeChef exists</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Thousands of talented home cooks in Dhaka had no way to reach customers beyond their neighbours.
            Restaurants were too expensive to open. We built HomeChef to change that - a platform where
            anyone with a great recipe can build a real business from their kitchen.
          </p>
        </Section>

        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map((v, i) => (
            <Section key={v.title} delay={i * 100} className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-brand/20 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                  {v.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-dark mb-1">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Section className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">The Process</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-4">How it works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">From craving to doorstep in four simple steps.</p>
          </Section>

          <div className="grid sm:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((h, i) => (
              <Section key={h.step} delay={i * 120} className="relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-brand/40 rounded-2xl p-6 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div>
                    <span className="block text-xs font-black text-brand/60 tracking-widest mb-1">{h.step}</span>
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 group-hover:bg-brand/20 flex items-center justify-center text-2xl transition-colors">
                      {h.icon}
                    </div>
                  </div>
                  <div className="pt-5">
                    <h3 className="font-bold text-white mb-1">{h.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <Section className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand">Under the Hood</span>
          <h2 className="text-3xl sm:text-4xl font-black text-dark mt-3 mb-4">Built with modern tech</h2>
          <p className="text-gray-500 max-w-xl mx-auto">A fully client-side React app — a functional prototype with given credentials, simulating a real marketplace with local state, mock data, and live map tracking.</p>
        </Section>
        <div className="flex flex-wrap gap-3 justify-center">
          {TECH_STACK.map((t, i) => (
            <Section key={t.name} delay={i * 60} className="flex items-center gap-2 bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm rounded-xl px-4 py-2.5 transition-all duration-200">
              <span>{t.icon}</span>
              <span className="text-sm font-semibold text-dark">{t.name}</span>
            </Section>
          ))}
        </div>
      </section>

      {/* ── DEVELOPER CARD ── */}
      <section className="bg-gradient-to-b from-gray-50 to-dark py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Section className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">The Builder</span>
            <h2 className="text-3xl sm:text-4xl font-black text-dark mt-3 mb-2">
              Designed &amp; developed by
            </h2>
            <p className="text-gray-500">Hover the card ✦</p>
          </Section>

          <DeveloperCard />

          <Section delay={200} className="text-center mt-10">
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              HomeChef is a portfolio prototype demonstrating a full-stack-style marketplace with
              role-based dashboards, live tracking, and mobile-first design - all on the frontend.
            </p>
          </Section>
        </div>
      </section>

      {/* spinning keyframe injected inline for the avatar ring */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
