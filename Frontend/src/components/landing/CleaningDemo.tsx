import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import { Badge, Button, RadioGroup, RadioGroupItem } from '@/components/ui'
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'

const cleaningOptions = [
  { id: 'remove', label: 'Remove affected rows', desc: 'Deletes 124 rows with missing Age values', risk: 'Loses 1.0% of data' },
  { id: 'mean', label: 'Fill with Mean', desc: 'Mean = 42.3 years. Sensitive to outliers.', risk: 'Biased by extreme values' },
  { id: 'median', label: 'Fill with Median', desc: 'Median = 38 years. Robust to outliers.', risk: 'Recommended for skewed data', recommended: true },
  { id: 'mode', label: 'Fill with Mode', desc: 'Mode = 32 years. Most frequent value.', risk: 'May create artificial peaks' },
  { id: 'custom', label: 'Custom value', desc: 'Enter a specific age to fill all missing', risk: 'Requires domain knowledge' },
  { id: 'keep', label: 'Keep unchanged', desc: 'Leave missing values as-is', risk: 'Downstream analyses may fail' },
]

export function CleaningDemo() {
  const sectionRef = useRef<HTMLSectionElement>(null)
  const isVisible = useIntersectionObserver(sectionRef)
  const prefersReduced = useReducedMotion()
  const [selectedOption, setSelectedOption] = useState('median')
  const [applied, setApplied] = useState(false)

  const handleApply = () => setApplied(true)

  return (
    <section
      id="cleaning"
      ref={sectionRef}
      className="py-24 lg:py-32 px-6"
      aria-labelledby="cleaning-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="accent" className="mb-4 inline-block">
            Interactive Cleaning
          </Badge>
          <h2 id="cleaning-heading" className="text-3xl md:text-4xl lg:text-5xl font-light text-fg-0 tracking-tight">
            AI recommends. <span className="font-medium">You decide.</span>
          </h2>
          <p className="mt-4 text-lg text-fg-1 max-w-2xl mx-auto">
            Every detected issue presents options with explanations. Preview the exact row changes
            before committing. Each action creates a new dataset version — never overwrites original.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className={cn('space-y-6', isVisible && !prefersReduced ? 'animate-fade-in-left' : '')}>
            <div className="bg-bg-1 border border-border-1 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/15 text-warning flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-fg-0">Missing Values Detected</h3>
                  <p className="text-sm text-fg-1 mt-0.5">Column: <code className="font-mono text-fg-0">Age</code> · 124 missing (1.0% of 12,480 rows)</p>
                </div>
              </div>

              <div className="bg-bg-2 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-bg-1 rounded">
                    <div className="text-2xl font-bold font-mono text-fg-0">124</div>
                    <div className="text-xs text-fg-2">Missing</div>
                  </div>
                  <div className="p-3 bg-bg-1 rounded">
                    <div className="text-2xl font-bold font-mono text-fg-0">38</div>
                    <div className="text-xs text-fg-2">Median</div>
                  </div>
                  <div className="p-3 bg-bg-1 rounded">
                    <div className="text-2xl font-bold font-mono text-fg-0">42.3</div>
                    <div className="text-xs text-fg-2">Mean</div>
                  </div>
                </div>
              </div>

              <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2" role="radiogroup" aria-label="Cleaning options for missing Age values">
                {cleaningOptions.map((option) => (
                  <motion.label
                    key={option.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                      selectedOption === option.id
                        ? 'border-accent/50 bg-accent-bg/30'
                        : 'border-border-1 bg-bg-2 hover:border-border-2'
                    )}
                    initial={prefersReduced ? {} : { opacity: 0, x: -20 }}
                    animate={isVisible && !prefersReduced ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * cleaningOptions.indexOf(option) }}
                  >
                    <RadioGroupItem value={option.id} className="mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-fg-0">{option.label}</span>
                        {option.recommended && (
                          <Badge variant="accent" size="sm">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-fg-1 mt-0.5">{option.desc}</p>
                      <p className="text-xs text-fg-2 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                        <span>{option.risk}</span>
                      </p>
                    </div>
                  </motion.label>
                ))}
              </RadioGroup>

              <div className="flex gap-3 pt-4 border-t border-border-1">
                <Button variant="outline" className="flex-1">
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border border-fg-3 rounded flex items-center justify-center">
                      <CheckCircle className="w-2.5 h-2.5 text-fg-3" />
                    </span>
                    Preview Changes
                  </span>
                </Button>
                <Button onClick={handleApply} disabled={applied} className="flex-1">
                  {applied ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Applied — v2 Created
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Apply Cleaning
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {applied && (
              <motion.div
                className="bg-success-bg border border-success/30 rounded-xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-fg-0">Cleaning applied successfully</p>
                    <p className="text-sm text-fg-1">Dataset version 2 created · 124 rows imputed with median (38) · <a href="#" className="text-accent hover:underline">View diff</a></p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className={cn('relative', isVisible && !prefersReduced ? 'animate-fade-in-right' : '')}>
            <div className="bg-bg-0/50 backdrop-blur-sm border border-border-1 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-1 bg-bg-1">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-error/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="ml-4 text-xs text-fg-2 font-mono text-center flex-1">sales_2026.csv — Age column preview</div>
              </div>

              <div className="p-4 md:p-6 max-h-[500px] overflow-auto custom-scrollbar">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono" role="table">
                    <thead>
                      <tr className="border-b border-border-1 sticky top-0 bg-bg-0">
                        <th className="px-3 py-2 text-left text-fg-2 font-medium">Row</th>
                        <th className="px-3 py-2 text-left text-fg-2 font-medium">Region</th>
                        <th className="px-3 py-2 text-left text-fg-2 font-medium">Product</th>
                        <th className="px-3 py-2 text-left text-fg-2 font-medium">Age</th>
                        <th className="px-3 py-2 text-left text-fg-2 font-medium">Revenue</th>
                        <th className="px-3 py-2 text-left text-fg-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { row: 1, region: 'West', product: 'Widget A', age: 34, revenue: 124500, status: 'ok' },
                        { row: 2, region: 'East', product: 'Widget B', age: null, revenue: 89200, status: 'missing' },
                        { row: 3, region: 'North', product: 'Widget A', age: 42, revenue: 67800, status: 'ok' },
                        { row: 4, region: 'South', product: 'Widget C', age: null, revenue: 156700, status: 'missing' },
                        { row: 5, region: 'West', product: 'Widget B', age: 29, revenue: 78900, status: 'ok' },
                        { row: 6, region: 'East', product: 'Widget A', age: 45, revenue: 92100, status: 'ok' },
                        { row: 7, region: 'North', product: 'Widget C', age: null, revenue: 134200, status: 'missing' },
                        { row: 8, region: 'South', product: 'Widget A', age: 38, revenue: 112300, status: 'ok' },
                        { row: 9, region: 'West', product: 'Widget C', age: null, revenue: 87600, status: 'missing' },
                        { row: 10, region: 'East', product: 'Widget B', age: 41, revenue: 95400, status: 'ok' },
                      ].map((item) => (
                        <tr key={item.row} className="border-b border-border-1/50 hover:bg-bg-1 transition-colors">
                          <td className="px-3 py-2 text-fg-2">{item.row}</td>
                          <td className="px-3 py-2 text-fg-1">{item.region}</td>
                          <td className="px-3 py-2 text-fg-1">{item.product}</td>
                          <td className={cn('px-3 py-2', item.status === 'missing' ? 'text-accent' : 'text-fg-0')}>
                            {item.status === 'missing' ? (
                              <>
                                <span className="text-fg-3">∅</span>{' '}
                                <span className="text-accent">→ 38</span>
                                <Badge variant="accent" size="sm" className="ml-1">imputed</Badge>
                              </>
                            ) : (
                              item.age
                            )}
                          </td>
                          <td className="px-3 py-2 text-fg-1">{item.revenue.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {item.status === 'missing' ? (
                              <span className="flex items-center gap-1 text-accent text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                Will fill
                              </span>
                            ) : (
                              <span className="text-success text-xs">✓ Clean</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-border-1 bg-bg-1 flex items-center justify-between text-sm text-fg-2">
                <span>Showing 10 of 124 affected rows</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-accent">Imputed with median</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'