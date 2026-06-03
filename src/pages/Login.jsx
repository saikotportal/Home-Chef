import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loginAsDemo, currentUser } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [credTab, setCredTab] = useState('customer')

  // Already logged in
  if (currentUser) {
    if (currentUser.role === 'chef') return <Navigate to="/chef-dashboard" replace />
    if (currentUser.role === 'rider') return <Navigate to="/rider-dashboard" replace />
    return <Navigate to="/" replace />
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = login(email.trim(), password)
    setLoading(false)
    if (result.success) {
      if (result.user.role === 'chef') navigate('/chef-dashboard')
      else if (result.user.role === 'rider') navigate('/rider-dashboard')
      else navigate('/')
    } else {
      setError(result.message)
    }
  }

  const handleDemo = (role) => {
    const result = loginAsDemo(role)
    if (result?.success) {
      if (result.user.role === 'chef') navigate('/chef-dashboard')
      else if (result.user.role === 'rider') navigate('/rider-dashboard')
      else navigate('/')
    }
  }

  const quickFill = (em, pw) => {
    setEmail(em)
    setPassword(pw)
  }

  const demoRoles = [
    { role: 'customer', label: '🛍️ Customer', color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700', desc: 'Browse & order meals' },
    { role: 'chef', label: '👨‍🍳 Chef', color: 'border-green-200 hover:border-green-400 hover:bg-green-50 text-green-700', desc: 'Manage your kitchen' },
    { role: 'rider', label: '🛵 Rider', color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700', desc: 'Handle deliveries' },
  ]

  const credentials = {
    customer: [
      { name: 'Rifat Rahman', email: 'rifat@customer.com', password: 'customer123' },
      { name: 'Nadia Islam', email: 'nadia@customer.com', password: 'customer123' },
      { name: 'Badhon', email: 'badhon@customer.com', password: 'customer123' },
    ],
    chef: [
      { name: 'Rashida Begum', email: 'rashida@chef.com', password: 'chef123' },
      { name: 'Karim Mia', email: 'karim@chef.com', password: 'chef123' },
      { name: 'Priya Das', email: 'priya@chef.com', password: 'chef123' },
      { name: 'Fatema Khatun', email: 'fatema@chef.com', password: 'chef123' },
      { name: 'Lin Wei', email: 'lin@chef.com', password: 'chef123' },
      { name: 'Marco Rossi', email: 'marco@chef.com', password: 'chef123' },
      { name: 'Arjun Sharma', email: 'arjun@chef.com', password: 'chef123' },
      { name: 'Yuki Tanaka', email: 'yuki@chef.com', password: 'chef123' },
      { name: 'Amira Hassan', email: 'amira@chef.com', password: 'chef123' },
      { name: 'Sofia Mendez', email: 'sofia@chef.com', password: 'chef123' },
    ],
    rider: [
      { name: 'Rakib Hossain', email: 'rakib@rider.com', password: 'rider123', rating: 4.8, deliveries: 312, area: 'Dhanmondi', zone: 1 },
      { name: 'Sumon Ali', email: 'sumon@rider.com', password: 'rider123', rating: 4.6, deliveries: 187, area: 'Gulshan', zone: 2 },
      { name: 'Jahangir Alam', email: 'jahangir@rider.com', password: 'rider123', rating: 4.9, deliveries: 428, area: 'Mirpur', zone: 3 },
      { name: 'Milon Sarker', email: 'milon@rider.com', password: 'rider123', rating: 4.5, deliveries: 95, area: 'Uttara', zone: 5 },
      { name: 'Touhid Islam', email: 'touhid@rider.com', password: 'rider123', rating: 4.7, deliveries: 256, area: 'Banani', zone: 2 },
      { name: 'Bellal Hossain', email: 'bellal@rider.com', password: 'rider123', rating: 4.4, deliveries: 143, area: 'Motijheel', zone: 4 },
      { name: 'Rana Mia', email: 'rana@rider.com', password: 'rider123', rating: 4.6, deliveries: 201, area: 'Mohammadpur', zone: 6 },
    ],
  }

  const tabConfig = {
    customer: { label: '🛍️ Customer', accent: 'text-blue-600 border-blue-500 bg-blue-50', badge: 'bg-blue-100 text-blue-600' },
    chef:     { label: '👨‍🍳 Chef',     accent: 'text-green-600 border-green-500 bg-green-50', badge: 'bg-green-100 text-green-600' },
    rider:    { label: '🛵 Rider',    accent: 'text-purple-600 border-purple-500 bg-purple-50', badge: 'bg-purple-100 text-purple-600' },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-2xl">
            <span className="text-3xl">🍳</span>
            <span>Home<span className="text-orange-200">Chef</span></span>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Real food.<br />Real homes.<br />Real flavour.
          </h1>
          <p className="mt-4 text-orange-100 text-lg leading-relaxed">
            Connect with talented home chefs in your community. Order authentic homemade meals delivered fresh to your door.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { num: '50+', label: 'Home Chefs' },
              { num: '200+', label: 'Meals' },
              { num: '4.8★', label: 'Avg Rating' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white">{s.num}</div>
                <div className="text-orange-200 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-orange-200 text-sm">© 2026 HomeChef Marketplace · saikot.dev</p>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-dark mb-8">
            <span className="text-3xl">🍳</span>
            <span>Home<span className="text-brand">Chef</span></span>
          </div>

          <h2 className="text-2xl font-bold text-dark">Welcome back</h2>
          <p className="text-gray-400 mt-1 text-sm">Sign in to continue to HomeChef</p>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or try a demo account</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Demo Role Buttons */}
          <div className="space-y-3">
            {demoRoles.map(({ role, label, color, desc }) => (
              <button
                key={role}
                onClick={() => handleDemo(role)}
                className={`w-full border-2 rounded-xl px-4 py-3 text-left transition-all duration-150 ${color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs opacity-70">Quick access →</span>
                </div>
                <p className="text-xs opacity-60 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {/* Credentials Panel */}
          <div className="mt-6 bg-gray-100 rounded-2xl overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200">
              {Object.entries(tabConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setCredTab(key)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                    credTab === key
                      ? `${cfg.accent} border-b-2`
                      : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            {/* Credentials List */}
            <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
              {credentials[credTab].map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => quickFill(cred.email, cred.password)}
                  className="w-full text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{cred.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{cred.email}</p>
                    </div>
                    <div className="text-right">
                      {cred.area && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tabConfig[credTab].badge}`}>
                          📍 {cred.area} · Z{cred.zone}
                        </span>
                      )}
                      {cred.rating !== undefined && (
                        <p className="text-xs text-gray-400 mt-0.5">⭐ {cred.rating} · {cred.deliveries} trips</p>
                      )}
                      <p className="text-xs text-gray-300 group-hover:text-brand mt-1 text-right transition-colors">
                        tap to fill →
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 pb-3">Password: <span className="font-mono">{credentials[credTab][0]?.password}</span> (same for all)</p>
          </div>

        </div>
      </div>
    </div>
  )
}
