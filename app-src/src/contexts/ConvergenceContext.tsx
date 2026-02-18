import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getConvergenceConfig, getConvergenceById, getDefaultConfig } from '../lib/convergence'
import type { ConvergenceConfig } from '../lib/convergence'

interface ConvergenceContextType {
  convergence: ConvergenceConfig
  loading: boolean
  switchConvergence: (id: string) => Promise<void>
}

const ConvergenceContext = createContext<ConvergenceContextType>({
  convergence: getDefaultConfig(),
  loading: true,
  switchConvergence: async () => {},
})

export function useConvergence() {
  return useContext(ConvergenceContext)
}

export function ConvergenceProvider({ children }: { children: ReactNode }) {
  const [convergence, setConvergence] = useState<ConvergenceConfig>(getDefaultConfig())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const config = await getConvergenceConfig()
      setConvergence(config)
      setLoading(false)
    }
    load()
  }, [])

  const switchConvergence = useCallback(async (id: string) => {
    setLoading(true)
    const config = await getConvergenceById(id)
    setConvergence(config)
    setLoading(false)
  }, [])

  return (
    <ConvergenceContext.Provider value={{ convergence, loading, switchConvergence }}>
      {children}
    </ConvergenceContext.Provider>
  )
}
