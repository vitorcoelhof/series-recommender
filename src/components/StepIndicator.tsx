interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const steps = ['Lista', 'Analisando', 'Resultado']

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <div key={step} className="flex items-center">
            <div className={`flex items-center gap-1.5 text-sm font-medium
              ${isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-zinc-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border
                ${isActive ? 'bg-white text-black border-white' : isDone ? 'border-green-400 text-green-400' : 'border-zinc-600 text-zinc-600'}`}>
                {isDone ? '✓' : step}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-zinc-700 mx-2" />}
          </div>
        )
      })}
    </div>
  )
}
