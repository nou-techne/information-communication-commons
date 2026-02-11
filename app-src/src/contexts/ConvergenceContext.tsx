import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getConvergenceConfig, getDefaultConfig } from '../lib/convergence'
import type { ConvergenceConfig } from '../lib/convergence'

interface ConvergenceContextType {
  convergence: ConvergenceConfig
  loading: boolean
}

const ConvergenceContext = createContext<ConvergenceContextType>({
  convergence: getDefaultConfig(),
  loading: true,
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

  return (
    <ConvergenceContext.Provider value={{ convergence, loading }}>
      {children}
    </ConvergenceContext.Provider>
  )
}
