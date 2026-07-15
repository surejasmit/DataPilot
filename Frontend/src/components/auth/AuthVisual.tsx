import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import {
  FileSpreadsheet,
  Search,
  Filter,
  Lightbulb,
  BarChart3,
  MessageSquare,
  ArrowRight,
} from 'lucide-react'

const stages = [
  { icon: FileSpreadsheet, label: 'Upload', color: 'data-1' },
  { icon: Search, label: 'Profile', color: 'data-2' },
  { icon: Filter, label: 'Clean', color: 'accent' },
  { icon: Lightbulb, label: 'Insights', color: 'data-3' },
  { icon: BarChart3, label: 'Dashboard', color: 'data-4' },
  { icon: MessageSquare, label: 'Ask', color: 'data-5' },
] as const

export function AuthVisual() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const [activeStage, setActiveStage] = useState(0)

  useEffect(() => {
    if (prefersReduced) return
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [prefersReduced])

  const Icon = stages[activeStage].icon

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 bg-gradient-to-br from-bg-0 via-bg-1 to-bg-0"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-accent)_0%,_transparent_70%)] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-data-2)_0%,_transparent_60%)] opacity-5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-data-3)_0%,_transparent_60%)] opacity-5" />

      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative w-56 h-32 bg-bg-0/50 backdrop-blur-sm border border-border-1 rounded-xl p-3 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-data-2/5" />
              <div className="relative flex flex-col items-center gap-3 z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStage}
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                    className={cn('w-12 h-12 rounded-lg flex items-center justify-center', `bg-${stages[activeStage].color}/15`, `text-${stages[activeStage].color}`)}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-center"
                  >
                    <p className="font-medium text-fg-0 text-base">{stages[activeStage].label}</p>
                    <p className="text-sm text-fg-2 mt-1">Processing your data...</p>
                  </motion.div>
                </AnimatePresence>

                <div className="w-full h-1.5 bg-bg-2 rounded-full overflow-hidden mt-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStage}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      exit={{ width: 0 }}
                      transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={cn('h-full rounded-full', `bg-${stages[activeStage].color}`)}
                    />
                  </AnimatePresence>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex justify-between text-xs text-fg-2 font-mono">
                <span>v1.0</span>
                <span>12,480 rows</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center gap-3 px-4 py-2 bg-bg-0/30 backdrop-blur-sm border border-border-1 rounded-lg"
              >
                <div className={cn('w-2 h-2 rounded-full', `bg-${stages[activeStage].color}`)} />
                <span className="text-sm text-fg-1 font-mono">
                  {activeStage + 1}/{stages.length} complete
                </span>
                <ArrowRight className="w-4 h-4 text-fg-3" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-1.5 mt-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.label}
              className={cn(
                'w-12 h-12 rounded-lg flex flex-col items-center justify-center border-2 transition-all',
                index === activeStage
                  ? `border-${stage.color} bg-${stage.color}/10`
                  : 'border-border-1 bg-bg-2/50'
              )}
              animate={{ scale: index === activeStage ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <stage.icon className={cn('w-4 h-4', index === activeStage ? `text-${stage.color}` : 'text-fg-3')} />
              <span className="text-[10px] text-fg-2 mt-0.5 text-center">{stage.label}</span>
            </motion.div>
          ))}
        </div>
      </div>


    </div>
  )
}