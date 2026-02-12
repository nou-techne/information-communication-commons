// Responsive Dashboard Layout Utilities

import type { Breakpoint } from '../styles/breakpoints'

/**
 * Get dashboard grid columns based on breakpoint
 */
export function getDashboardGridColumns(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'mobile':
      return 'grid-cols-1'
    case 'tablet':
      return 'grid-cols-2'
    case 'desktop':
    case 'wide':
      return 'grid-cols-3'
  }
}

/**
 * Get metric card grid layout
 */
export function getMetricCardGrid(breakpoint: Breakpoint): string {
  const base = 'grid gap-4 mb-8'
  
  switch (breakpoint) {
    case 'mobile':
      return `${base} grid-cols-1`
    case 'tablet':
      return `${base} grid-cols-2`
    case 'desktop':
      return `${base} grid-cols-3`
    case 'wide':
      return `${base} grid-cols-4`
  }
}

/**
 * Get chart container layout
 */
export function getChartContainerGrid(breakpoint: Breakpoint): string {
  const base = 'grid gap-6 mb-8'
  
  if (breakpoint === 'mobile') {
    return `${base} grid-cols-1`
  }
  
  return `${base} grid-cols-1 lg:grid-cols-2`
}

/**
 * Get sidebar width for dashboard
 */
export function getSidebarWidth(breakpoint: Breakpoint): string | null {
  switch (breakpoint) {
    case 'mobile':
    case 'tablet':
      return null // No sidebar on mobile/tablet
    case 'desktop':
      return '280px'
    case 'wide':
      return '320px'
  }
}

/**
 * Check if sidebar should be hidden
 */
export function shouldHideSidebar(breakpoint: Breakpoint): boolean {
  return breakpoint === 'mobile' || breakpoint === 'tablet'
}

/**
 * Get dashboard container padding
 */
export function getDashboardPadding(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'mobile':
      return 'px-4 py-4'
    case 'tablet':
      return 'px-6 py-6'
    case 'desktop':
    case 'wide':
      return 'px-8 py-8'
  }
}

/**
 * Get header spacing
 */
export function getHeaderSpacing(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'mobile':
      return 'mb-4'
    case 'tablet':
      return 'mb-6'
    case 'desktop':
    case 'wide':
      return 'mb-8'
  }
}

/**
 * Get card inner padding
 */
export function getCardPadding(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'mobile':
      return 'p-4'
    case 'tablet':
      return 'p-5'
    case 'desktop':
    case 'wide':
      return 'p-6'
  }
}

/**
 * Responsive font sizes for headers
 */
export function getHeaderTextSize(breakpoint: Breakpoint, level: 'h1' | 'h2' | 'h3'): string {
  const sizes = {
    h1: {
      mobile: 'text-2xl',
      tablet: 'text-3xl',
      desktop: 'text-3xl',
      wide: 'text-4xl',
    },
    h2: {
      mobile: 'text-xl',
      tablet: 'text-2xl',
      desktop: 'text-2xl',
      wide: 'text-2xl',
    },
    h3: {
      mobile: 'text-lg',
      tablet: 'text-xl',
      desktop: 'text-xl',
      wide: 'text-xl',
    },
  }
  
  return sizes[level][breakpoint]
}

/**
 * Get responsive max width for dashboard content
 */
export function getDashboardMaxWidth(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'mobile':
    case 'tablet':
      return 'max-w-full'
    case 'desktop':
      return 'max-w-6xl'
    case 'wide':
      return 'max-w-7xl'
  }
}

/**
 * Activity feed item layout
 */
export function getActivityItemLayout(breakpoint: Breakpoint): string {
  if (breakpoint === 'mobile') {
    return 'flex-col gap-2'
  }
  
  return 'flex-row items-center gap-4'
}
