const STEPS = [
  { key: 'confirmed',   label: 'Confirmed',   icon: '✅', desc: 'Your order has been confirmed' },
  { key: 'preparing',  label: 'Preparing',   icon: '👨‍🍳', desc: 'Chef is cooking your meal' },
  { key: 'picked_up',  label: 'Picked Up',   icon: '🛵', desc: 'Rider picked up your order' },
  { key: 'on_the_way', label: 'On the Way',  icon: '🚀', desc: 'Rider is heading to you' },
  { key: 'delivered',  label: 'Delivered',   icon: '🎉', desc: 'Enjoy your meal!' },
]

export default function StatusStepper({ status }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status)

  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center w-full">
        {STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          const future = i > currentIndex

          return (
            <div key={step.key} className="flex-1 flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500
                    ${done ? 'bg-green-500 text-white shadow-md' : ''}
                    ${active ? 'bg-brand text-white shadow-lg scale-110 ring-4 ring-brand/20' : ''}
                    ${future ? 'bg-gray-100 text-gray-300' : ''}
                  `}
                >
                  {step.icon}
                </div>
                <span className={`text-xs mt-1.5 font-medium text-center ${active ? 'text-brand' : done ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      i < currentIndex ? 'bg-green-400 w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile stepper — vertical */}
      <div className="sm:hidden space-y-3">
        {STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          const future = i > currentIndex

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0
                    ${done ? 'bg-green-500 text-white' : ''}
                    ${active ? 'bg-brand text-white ring-4 ring-brand/20' : ''}
                    ${future ? 'bg-gray-100 text-gray-300' : ''}
                  `}
                >
                  {step.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 mt-1 rounded-full ${i < currentIndex ? 'bg-green-400' : 'bg-gray-100'}`} />
                )}
              </div>
              <div className="pt-1.5">
                <p className={`text-sm font-semibold ${active ? 'text-brand' : done ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {(active || done) && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Active step description — desktop */}
      {STEPS[currentIndex] && (
        <p className="hidden sm:block text-center text-sm text-gray-500 mt-4">
          {STEPS[currentIndex].desc}
        </p>
      )}
    </div>
  )
}

export { STEPS }
