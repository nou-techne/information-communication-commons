import { useCallback, useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import type { AnalyticsEvent, AnalyticsSession } from '../types/analytics'

const STORAGE_KEY = 'commons_analytics_events'
const SESSION_KEY = 'commons_analytics_session'
const MAX_EVENTS = 1000 // Keep last 1000 events

/**
 * Analytics hook for tracking user events
 */
export function useAnalytics() {
  const [session, setSession] = useState<AnalyticsSession | null>(null)

  // Initialize or retrieve session
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        const existing = JSON.parse(stored) as AnalyticsSession
        existing.lastActivity = new Date().toISOString()
        setSession(existing)
        localStorage.setItem(SESSION_KEY, JSON.stringify(existing))
      } catch {
        createNewSession()
      }
    } else {
      createNewSession()
    }

    function createNewSession() {
      const newSession: AnalyticsSession = {
        sessionId: generateSessionId(),
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        eventCount: 0,
      }
      setSession(newSession)
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
    }
  }, [])

  /**
   * Track an analytics event
   */
  const track = useCallback((event: AnalyticsEvent) => {
    try {
      // Get existing events
      const stored = localStorage.getItem(STORAGE_KEY)
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : []

      // Add new event
      events.push(event)

      // Trim to max size (keep most recent)
      if (events.length > MAX_EVENTS) {
        events.splice(0, events.length - MAX_EVENTS)
      }

      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events))

      // Update session
      const sessionStored = localStorage.getItem(SESSION_KEY)
      if (sessionStored) {
        const currentSession = JSON.parse(sessionStored) as AnalyticsSession
        currentSession.lastActivity = new Date().toISOString()
        currentSession.eventCount++
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession))
        setSession(currentSession)
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }, [])

  /**
   * Get all tracked events
   */
  const getEvents = useCallback((): AnalyticsEvent[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  /**
   * Get events by type
   */
  const getEventsByType = useCallback((type: AnalyticsEvent['type']): AnalyticsEvent[] => {
    return getEvents().filter(event => event.type === type)
  }, [getEvents])

  /**
   * Get events in time range
   */
  const getEventsInRange = useCallback((startTime: string, endTime: string): AnalyticsEvent[] => {
    return getEvents().filter(event => {
      const eventTime = new Date(event.timestamp).getTime()
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()
      return eventTime >= start && eventTime <= end
    })
  }, [getEvents])

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  /**
   * Get event count
   */
  const getEventCount = useCallback((): number => {
    return getEvents().length
  }, [getEvents])

  /**
   * Export events as JSON
   */
  const exportEvents = useCallback((): string => {
    return JSON.stringify(getEvents(), null, 2)
  }, [getEvents])

  return {
    track,
    getEvents,
    getEventsByType,
    getEventsInRange,
    clearEvents,
    getEventCount,
    exportEvents,
    session,
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Context provider for analytics (optional)
 */
interface AnalyticsContextValue {
  track: (event: AnalyticsEvent) => void
  getEvents: () => AnalyticsEvent[]
  session: AnalyticsSession | null
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const analytics = useAnalytics()

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider')
  }
  return context
}
