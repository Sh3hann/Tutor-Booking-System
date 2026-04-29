import { Check } from 'lucide-react';

interface Step { number: number; label: string; }
interface StepProgressIndicatorProps { currentStep: number; steps: Step[]; }

const PRIMARY = '#6C63FF';

export function StepProgressIndicator({ currentStep, steps }: StepProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent   = currentStep === step.number;
        const isDone      = isCompleted || isCurrent;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
                style={{
                  background: isDone
                    ? 'linear-gradient(135deg,#6C63FF,#4F46E5)'
                    : 'rgba(255,255,255,0.07)',
                  border: isCurrent
                    ? '2px solid #6C63FF'
                    : isDone
                    ? '2px solid #6C63FF'
                    : '2px solid rgba(255,255,255,0.12)',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(108,99,255,0.2)' : 'none',
                  color: isDone ? '#fff' : '#555577',
                }}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              {/* Label */}
              <span
                className="mt-2 text-xs sm:text-sm font-medium transition-colors duration-300"
                style={{ color: isCurrent ? PRIMARY : isCompleted ? '#a89cff' : '#444466' }}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className="w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-5 rounded-full transition-all duration-300"
                style={{
                  background: isCompleted
                    ? 'linear-gradient(90deg,#6C63FF,#4F46E5)'
                    : 'rgba(255,255,255,0.07)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
