import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from './Button'

const STORAGE_KEY = 'commons_onboarding_completed'

interface TourStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Welcome to Commons',
    description: 'This is your dashboard. Here you can see an overview of contributions, participants, and activity across your convergence.',
    targetSelector: '[data-tour="dashboard"]',
    position: 'bottom',
  },
  {
    id: 'contribute',
    title: 'Make Contributions',
    description: 'Share your insights across the five H-LAM/T dimensions: Human, Language, Artifact, Methodology, and Training.',
    targetSelector: '[data-tour="contribute"]',
    position: 'bottom',
  },
  {
    id: 'threads',
    title: 'Join Conversations',
    description: 'Participate in threaded discussions. Tag, resolve, and consolidate threads to maintain clarity.',
    targetSelector: '[data-tour="threads"]',
    position: 'right',
  },
  {
    id: 'graph',
    title: 'Explore the Knowledge Graph',
    description: 'Visualize connections between people, concepts, tools, and ideas. Navigate relationships and discover patterns.',
    targetSelector: '[data-tour="graph"]',
    position: 'right',
  },
  {
    id: 'search',
    title: 'Search & Filter',
    description: 'Find contributions by dimension, date, author, or content. Use filters to narrow your search.',
    targetSelector: '[data-tour="search"]',
    position: 'left',
  },
]

interface OnboardingTourProps {
  autoStart?: boolean
}

export function OnboardingTour({ autoStart = false }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Check if tour has been completed
    const completed = localStorage.getItem(STORAGE_KEY)
    
    if (!completed && autoStart) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsActive(true), 1000)
    }
  }, [autoStart])

  useEffect(() => {
    if (!isActive) return

    const step = TOUR_STEPS[currentStep]
    const element = document.querySelector(step.targetSelector) as HTMLElement
    
    if (element) {
      setTargetElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setTargetElement(null)
    }
  }, [isActive, currentStep])

  function handleNext() {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  function handleSkip() {
    handleComplete()
  }

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsActive(false)
    setCurrentStep(0)
    setTargetElement(null)
  }

  function resetTour() {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentStep(0)
    setIsActive(true)
  }

  if (!isActive) return null

  const step = TOUR_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  // Calculate tooltip position relative to target
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetElement) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const rect = targetElement.getBoundingClientRect()
    const position = step.position || 'bottom'
    const offset = 16

    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
    }

    switch (position) {
      case 'top':
        styles.bottom = `${window.innerHeight - rect.top + offset}px`
        styles.left = `${rect.left + rect.width / 2}px`
        styles.transform = 'translateX(-50%)'
        break
      case 'bottom':
        styles.top = `${rect.bottom + offset}px`
        styles.left = `${rect.left + rect.width / 2}px`
        styles.transform = 'translateX(-50%)'
        break
      case 'left':
        styles.top = `${rect.top + rect.height / 2}px`
        styles.right = `${window.innerWidth - rect.left + offset}px`
        styles.transform = 'translateY(-50%)'
        break
      case 'right':
        styles.top = `${rect.top + rect.height / 2}px`
        styles.left = `${rect.right + offset}px`
        styles.transform = 'translateY(-50%)'
        break
    }

    return styles
  }

  // Highlight overlay for target element
  const getHighlightStyle = (): React.CSSProperties | null => {
    if (!targetElement) return null

    const rect = targetElement.getBoundingClientRect()
    const padding = 8

    return {
      position: 'fixed',
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
      border: '2px solid #c3fd50',
      borderRadius: '8px',
      pointerEvents: 'none',
      zIndex: 9998,
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
    }
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9997]"
        onClick={handleSkip}
      />

      {/* Highlight box */}
      {targetElement && (
        <div style={getHighlightStyle()!} />
      )}

      {/* Tooltip */}
      <div
        className="bg-[#1a1a1a] border border-[#c3fd50] rounded-lg shadow-2xl max-w-md"
        style={getTooltipStyle()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>
              <h3 className="text-lg font-bold">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 hover:bg-[#262626] rounded transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-300 mb-6">{step.description}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-6">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-[#c3fd50]'
                    : index < currentStep
                    ? 'w-1.5 bg-[#c3fd50]/50'
                    : 'w-1.5 bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={isFirstStep}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <Button onClick={handleNext}>
              {isLastStep ? 'Done' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Skip link */}
          {!isLastStep && (
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Skip tour
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Check if onboarding has been completed
 */
export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

/**
 * Reset onboarding (for testing or re-showing)
 */
export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Start onboarding tour programmatically
 */
export function startOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('start-onboarding'))
}
