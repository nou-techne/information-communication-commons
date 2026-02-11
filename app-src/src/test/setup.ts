// Sprint 34: Test setup
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Extend Vitest matchers if needed
expect.extend({})
