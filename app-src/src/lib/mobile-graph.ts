// Mobile Graph View Utilities

/**
 * Pinch-to-zoom gesture handler
 */
export class PinchZoomHandler {
  private initialDistance: number | null = null
  private currentScale = 1

  constructor(
    private onZoom: (scale: number, delta: number) => void,
    private minScale = 0.5,
    private maxScale = 3
  ) {}

  handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      this.initialDistance = this.getDistance(
        e.touches[0],
        e.touches[1]
      )
    }
  }

  handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 2 && this.initialDistance) {
      e.preventDefault()

      const currentDistance = this.getDistance(
        e.touches[0],
        e.touches[1]
      )

      const scale = currentDistance / this.initialDistance
      const newScale = Math.max(
        this.minScale,
        Math.min(this.maxScale, this.currentScale * scale)
      )

      const delta = newScale - this.currentScale
      this.onZoom(newScale, delta)
      this.currentScale = newScale
      this.initialDistance = currentDistance
    }
  }

  handleTouchEnd() {
    this.initialDistance = null
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  reset() {
    this.initialDistance = null
    this.currentScale = 1
  }
}

/**
 * Double-tap detection
 */
export class DoubleTapHandler {
  private lastTap: number = 0
  private readonly threshold = 300 // ms

  constructor(private onDoubleTap: (x: number, y: number) => void) {}

  handleTap(x: number, y: number) {
    const now = Date.now()
    const timeSinceLastTap = now - this.lastTap

    if (timeSinceLastTap < this.threshold && timeSinceLastTap > 0) {
      this.onDoubleTap(x, y)
      this.lastTap = 0 // Reset to prevent triple-tap
    } else {
      this.lastTap = now
    }
  }
}

/**
 * Pan gesture handler
 */
export class PanHandler {
  private startX: number = 0
  private startY: number = 0
  private isPanning: boolean = false

  constructor(private onPan: (dx: number, dy: number) => void) {}

  handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.startX = e.touches[0].clientX
      this.startY = e.touches[0].clientY
      this.isPanning = true
    }
  }

  handleTouchMove(e: TouchEvent) {
    if (this.isPanning && e.touches.length === 1) {
      const dx = e.touches[0].clientX - this.startX
      const dy = e.touches[0].clientY - this.startY

      this.onPan(dx, dy)

      this.startX = e.touches[0].clientX
      this.startY = e.touches[0].clientY
    }
  }

  handleTouchEnd() {
    this.isPanning = false
  }
}

/**
 * Mobile graph configuration
 */
export const MOBILE_GRAPH_CONFIG = {
  // Touch target size
  minNodeRadius: 22, // 44px diameter for WCAG
  
  // Zoom constraints
  minZoom: 0.5,
  maxZoom: 3,
  doubleTapZoomLevel: 1.5,
  
  // Pan sensitivity
  panSensitivity: 1,
  
  // Node selection
  tapThreshold: 10, // px movement allowed for tap
  
  // Bottom sheet
  bottomSheetMinHeight: 200,
  bottomSheetMaxHeight: 600,
}

/**
 * Check if touch is a tap (not a drag)
 */
export function isTap(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold = MOBILE_GRAPH_CONFIG.tapThreshold
): boolean {
  const dx = Math.abs(endX - startX)
  const dy = Math.abs(endY - startY)
  return dx < threshold && dy < threshold
}

/**
 * Get touch point relative to element
 */
export function getTouchPoint(
  touch: Touch,
  element: HTMLElement
): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  }
}
