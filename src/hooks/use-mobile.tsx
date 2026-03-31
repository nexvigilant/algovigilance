'use client';

import * as React from "react"

// Breakpoints for device detection (matches Tailwind + custom tablet breakpoint)
const PHONE_BREAKPOINT = 768    // < 768px = phone (Tailwind md breakpoint)
const TABLET_BREAKPOINT = 1024  // 768px - 1023px = tablet (Tailwind lg breakpoint)
// >= 1024px = desktop

export type DeviceType = 'phone' | 'tablet' | 'desktop'

/**
 * Returns the current device type based on window width
 * Phone: < 768px
 * Tablet: 768px - 1023px (iPad and similar sized devices)
 * Desktop: >= 1024px
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)

    const getDeviceType = (): DeviceType => {
      const width = window.innerWidth
      if (width < PHONE_BREAKPOINT) return 'phone'
      if (width < TABLET_BREAKPOINT) return 'tablet'
      return 'desktop'
    }

    const handleResize = () => {
      setDeviceType(getDeviceType())
    }

    // Set initial value
    setDeviceType(getDeviceType())

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return mounted ? deviceType : 'desktop'
}

/**
 * Returns true if the device is a phone (< 768px)
 * @deprecated Use useDeviceType() instead for more granular control
 */
export function useIsMobile(): boolean {
  const deviceType = useDeviceType()
  return deviceType === 'phone'
}

/**
 * Returns true if the device is a tablet (768px - 1023px)
 * Useful for handling iPad and iPad-sized devices with special layouts
 */
export function useIsTablet(): boolean {
  const deviceType = useDeviceType()
  return deviceType === 'tablet'
}

/**
 * Returns true if the device is a desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  const deviceType = useDeviceType()
  return deviceType === 'desktop'
}
