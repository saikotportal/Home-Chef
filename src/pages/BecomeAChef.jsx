import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const CUISINE_OPTIONS = [
  { id: 'bengali', label: 'Bengali', emoji: '🐟' },
  { id: 'mughlai', label: 'Mughlai', emoji: '🍖' },
  { id: 'indian', label: 'Indian', emoji: '🫛' },
  { id: 'bbq', label: 'BBQ & Grills', emoji: '🔥' },
  { id: 'street', label: 'Street Food', emoji: '🥘' },
  { id: 'desserts', label: 'Desserts', emoji: '🍮' },
  { id: 'continental', label: 'Continental', emoji: '🍝' },
  { id: 'healthy', label: 'Healthy / Diet', emoji: '🥗' },
]

const AREAS = [
  'Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Uttara',
  'Motijheel', 'Mohammadpur', 'Old Dhaka', 'Bashundhara', 'Wari',
]

const STEPS = [
  { id: 1, label: 'Personal Info', icon: '👤' },
  { id: 2, label: 'Cuisine & Skills', icon: '🍳' },
  { id: 3, label: 'Kitchen & Area', icon: '🏠' },
  { id: 4, label: 'Confirm', icon: '✅' },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${current === step.id ? 'bg-brand text-white shadow-md shadow-orange-200 scale-110' :
                current > step.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}
            >
              {current > step.id ? '✓' : step.icon}
            </div>
            <span className={`text-xs mt-1 font-medium hidden sm:block ${current === step.id ? 'text-brand' : current > step.id ? 'text-green-500' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-10 sm:w-16 h-0.5 mx-1 mb-4 transition-all duration-300 ${current > step.id ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function InputField({ label, type = 'text', value, onChange, placeholder, required, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-dark mb-1.5">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
        required={required}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── Step 1: Personal Info ────────────────────────────────────
function Step1({ data, setData }) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">👨‍🍳</div>
        <h2 className="text-xl font-bold text-dark">Tell us about yourself</h2>
        <p className="text-gray-400 text-sm mt-1">Basic info to get your chef profile started</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Full Name" value={data.name} onChange={(v) => setData({ ...data, name: v })} placeholder="e.g. Rashida Begum" required />
        <InputField label="Phone Number" type="tel" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} placeholder="01XXXXXXXXX" required />
      </div>
      <InputField label="Email Address" type="email" value={data.email} onChange={(v) => setData({ ...data, email: v })} placeholder="you@example.com" required />

      <div>
        <label className="block text-sm font-semibold text-dark mb-1.5">
          Short Bio <span className="text-brand">*</span>
        </label>
        <textarea
          value={data.bio}
          onChange={(e) => setData({ ...data, bio: e.target.value })}
          placeholder="Tell customers about your passion for cooking, how long you've been cooking, what makes your food special..."
          rows={3}
          className="input resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{data.bio.length}/200 characters</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-dark mb-1.5">Profile Photo</label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand transition-colors cursor-pointer bg-gray-50">
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm text-gray-500 font-medium">Click to upload your photo</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Cuisines & Skills ────────────────────────────────
function Step2({ data, setData }) {
  const toggleCuisine = (id) => {
    const updated = data.cuisines.includes(id)
      ? data.cuisines.filter((c) => c !== id)
      : [...data.cuisines, id]
    setData({ ...data, cuisines: updated })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🍳</div>
        <h2 className="text-xl font-bold text-dark">Your Cuisine & Skills</h2>
        <p className="text-gray-400 text-sm mt-1">Select all that apply — you can always update later</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-dark mb-3">
          Cuisine Specialties <span className="text-brand">*</span>
          <span className="text-gray-400 font-normal ml-2">(pick at least 1)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CUISINE_OPTIONS.map((c) => {
            const on = data.cuisines.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => toggleCuisine(c.id)}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 text-center
                  ${on ? 'border-brand bg-orange-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className={`text-xs font-semibold ${on ? 'text-brand' : 'text-gray-500'}`}>{c.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <InputField
        label="Years of Cooking Experience"
        type="number"
        value={data.experience}
        onChange={(v) => setData({ ...data, experience: v })}
        placeholder="e.g. 5"
        hint="Approximate is fine"
      />

      <div>
        <label className="block text-sm font-semibold text-dark mb-1.5">Signature Dish</label>
        <input
          type="text"
          value={data.signature}
          onChange={(e) => setData({ ...data, signature: e.target.value })}
          placeholder="e.g. Shorshe Ilish, Kacchi Biryani..."
          className="input"
        />
        <p className="text-xs text-gray-400 mt-1">This will be highlighted on your chef profile</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-dark mb-3">Availability</label>
        <div className="grid grid-cols-2 gap-2">
          {['Weekdays', 'Weekends', 'Mornings', 'Evenings'].map((opt) => {
            const on = data.availability.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => {
                  const updated = on ? data.availability.filter((a) => a !== opt) : [...data.availability, opt]
                  setData({ ...data, availability: updated })
                }}
                className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                  ${on ? 'border-brand bg-orange-50 text-brand' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Kitchen & Area ───────────────────────────────────
function Step3({ data, setData }) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🏠</div>
        <h2 className="text-xl font-bold text-dark">Your Kitchen & Delivery Area</h2>
        <p className="text-gray-400 text-sm mt-1">Help customers find you by location</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-dark mb-1.5">
          Your Area <span className="text-brand">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AREAS.map((area) => {
            const on = data.area === area
            return (
              <button
                key={area}
                onClick={() => setData({ ...data, area })}
                className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                  ${on ? 'border-brand bg-orange-50 text-brand' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
              >
                📍 {area}
              </button>
            )
          })}
        </div>
      </div>

      <InputField
        label="Full Address"
        value={data.address}
        onChange={(v) => setData({ ...data, address: v })}
        placeholder="House/Flat No., Road, Area, Dhaka"
        hint="Shared with riders only, not shown to customers"
        required
      />

      <div>
        <label className="block text-sm font-semibold text-dark mb-3">Kitchen Setup</label>
        <div className="space-y-2.5">
          {[
            { id: 'hygienic', label: 'Hygienic kitchen with clean preparation area', icon: '🧼' },
            { id: 'halal', label: 'Halal ingredients only', icon: '✅' },
            { id: 'noAllergy', label: 'No cross-contamination (allergen aware)', icon: '⚠️' },
            { id: 'packaging', label: 'I have proper food-safe packaging', icon: '📦' },
          ].map((item) => {
            const on = data.kitchenChecks.includes(item.id)
            return (
              <button
                key={item.id}
                onClick={() => {
                  const updated = on
                    ? data.kitchenChecks.filter((k) => k !== item.id)
                    : [...data.kitchenChecks, item.id]
                  setData({ ...data, kitchenChecks: updated })
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
                  ${on ? 'border-brand bg-orange-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                  ${on ? 'bg-brand border-brand' : 'border-gray-300'}`}
                >
                  {on && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-600">{item.icon} {item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-dark mb-1.5">
          Max Orders Per Day <span className="text-brand">*</span>
        </label>
        <div className="flex gap-2">
          {[5, 10, 15, 20, '20+'].map((n) => (
            <button
              key={n}
              onClick={() => setData({ ...data, maxOrders: String(n) })}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                ${data.maxOrders === String(n) ? 'border-brand bg-orange-50 text-brand' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Review & Submit ──────────────────────────────────
function Step4({ data }) {
  const selectedCuisines = CUISINE_OPTIONS.filter((c) => data.cuisines.includes(c.id))

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-dark">Almost there!</h2>
        <p className="text-gray-400 text-sm mt-1">Review your details before submitting</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Personal</p>
          <p className="font-bold text-dark">{data.name || '—'}</p>
          <p className="text-sm text-gray-500">{data.email || '—'} · {data.phone || '—'}</p>
          {data.bio && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{data.bio}</p>}
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Cuisines</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedCuisines.length > 0
              ? selectedCuisines.map((c) => (
                  <span key={c.id} className="badge bg-orange-100 text-brand text-xs">
                    {c.emoji} {c.label}
                  </span>
                ))
              : <span className="text-gray-400 text-sm">None selected</span>
            }
          </div>
          {data.signature && (
            <p className="text-xs text-gray-500 mt-2">🌟 Signature: <span className="font-semibold">{data.signature}</span></p>
          )}
          {data.experience && (
            <p className="text-xs text-gray-500 mt-1">👨‍🍳 {data.experience} years experience</p>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Kitchen & Area</p>
          {data.area && <p className="text-sm font-semibold text-dark">📍 {data.area}</p>}
          {data.maxOrders && <p className="text-xs text-gray-500 mt-1">Max {data.maxOrders} orders/day</p>}
          {data.availability.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Available: {data.availability.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Terms */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-sm text-gray-600 space-y-1.5">
        <p className="font-semibold text-dark text-sm">Before you submit:</p>
        <p>✅ Our team will review your application within 2–3 business days.</p>
        <p>✅ You'll receive a call to verify your kitchen and setup.</p>
        <p>✅ Once approved, your profile goes live on HomeChef.</p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-0.5 w-4 h-4 accent-brand" />
        <span className="text-sm text-gray-600">
          I agree to HomeChef's <span className="text-brand underline cursor-pointer">Terms of Service</span> and <span className="text-brand underline cursor-pointer">Food Safety Guidelines</span>.
        </span>
      </label>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function BecomeAChef() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const [data, setData] = useState({
    name: '', phone: '', email: '', bio: '',
    cuisines: [], experience: '', signature: '', availability: [],
    area: '', address: '', kitchenChecks: [], maxOrders: '',
  })

  const canNext = () => {
    if (step === 1) return data.name.trim() && data.phone.trim() && data.email.trim() && data.bio.trim()
    if (step === 2) return data.cuisines.length > 0
    if (step === 3) return data.area && data.address.trim() && data.maxOrders
    return true
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
    else setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="page-wrapper flex items-center justify-center py-20 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4 animate-bounce">🎊</div>
          <h2 className="text-2xl font-extrabold text-dark">Application Submitted!</h2>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">
            Thank you, <span className="font-semibold text-dark">{data.name}</span>! We've received your chef application. Our team will review it and get in touch within <strong>2–3 business days</strong>.
          </p>
          <div className="mt-6 bg-orange-50 rounded-2xl p-4 text-left space-y-2 text-sm text-gray-600 border border-orange-100">
            <p>📱 We'll call <span className="font-semibold">{data.phone}</span> to verify</p>
            <p>📧 Confirmation sent to <span className="font-semibold">{data.email}</span></p>
            <p>⏳ Review time: 2–3 business days</p>
          </div>
          <Link to="/" className="btn-primary mt-8 inline-block w-full py-3">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand mb-4 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-extrabold text-dark">Become a HomeChef</h1>
          <p className="text-gray-400 mt-2 text-sm">Share your food with your neighbourhood. Earn from your kitchen.</p>
        </div>

        {/* Why Join — only on step 1 */}
        {step === 1 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: '💰', title: 'Earn Extra', desc: 'Set your own prices' },
              { icon: '🕐', title: 'Flexible Hours', desc: 'Cook on your schedule' },
              { icon: '🌍', title: 'Feed Community', desc: 'Serve your neighbours' },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-2xl mb-1">{card.icon}</div>
                <p className="text-xs font-bold text-dark">{card.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <StepIndicator current={step} />

          {step === 1 && <Step1 data={data} setData={setData} />}
          {step === 2 && <Step2 data={data} setData={setData} />}
          {step === 3 && <Step3 data={data} setData={setData} />}
          {step === 4 && <Step4 data={data} />}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-outline flex-1 py-3"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className={`btn-primary flex-1 py-3 text-base ${!canNext() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {step === 4 ? '🚀 Submit Application' : 'Continue →'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Step {step} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  )
}
