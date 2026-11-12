export type WindowMetrics = {
  devicePixelRatio: number
  innerHeight: number
  innerWidth: number
  outerHeight: number
  outerWidth: number
}

type Platform = {
  /** window borders above and below the viewport of a restored window, in device-independent pixels */
  frameHeight: number
  /** window borders left and right of the viewport of a restored window, in device-independent pixels */
  frameWidth: number
  /** granularity of the display scales the system offers, which start at 100% */
  step?: number
  /** height of a restored window’s title bar in device-independent pixels */
  titlebarHeight?: number
}

// keyed by `navigator.userAgentData.platform`
const platforms: Record<string, Platform | undefined> = {
  // 100%, 125%, 150%, … with invisible resize borders left, right and below, and a visible line on top
  Windows: {
    frameHeight: 9,
    frameWidth: 16,
    step: 0.25,
    titlebarHeight: 33,
  },
  // 1× or 2× with borderless windows
  macOS: {
    frameHeight: 0,
    frameWidth: 0,
    step: 1,
  },
}
const unknownPlatform: Platform = {
  frameHeight: 0,
  frameWidth: 0,
}
// Brave’s fingerprinting protection reports the inner size plus a random 0–8 px per axis as the outer size.
const maximumMaskedBorder = 8
/**
 * Tells whether the outer size is Brave’s stand-in rather than the real one. A window whose sizes match exactly counts as real, since maximized and borderless windows look like that at 100% zoom. That misjudges the 1 in 81 masked windows whose random offsets are both zero.
 */
const hasMaskedOuterSize = (metrics: WindowMetrics) => {
  const borderWidth = metrics.outerWidth - metrics.innerWidth
  const borderHeight = metrics.outerHeight - metrics.innerHeight
  if (!borderWidth && !borderHeight) {
    return false
  }
  return borderWidth >= 0 && borderWidth <= maximumMaskedBorder && borderHeight >= 0 && borderHeight <= maximumMaskedBorder
}
/**
 * Estimates the factor that undoes page zoom, preferably from the window size: the outer size ignores page zoom while the inner one follows it. Docked DevTools shrink the viewport along one axis, so the less obstructed axis counts.
 *
 * Where the outer size is masked, the height of the title bar area has to do. Chromium rounds it up to whole CSS pixels, so the true height lies up to a pixel below. Maximized windows have a lower title bar, which makes this estimate too small for them.
 */
const estimateZoomScale = (metrics: WindowMetrics, titlebarHeight: number, platform: Platform) => {
  if (!hasMaskedOuterSize(metrics)) {
    return Math.max(metrics.innerWidth / (metrics.outerWidth - platform.frameWidth), metrics.innerHeight / (metrics.outerHeight - platform.frameHeight))
  }
  if (platform.titlebarHeight) {
    return (titlebarHeight - 0.5) / platform.titlebarHeight
  }
}

/**
 * Returns the factor that undoes page zoom, like `0.5` at 200%, for a window whose viewport spans the whole window.
 *
 * Page zoom itself is not exposed to pages, only estimates of it. `devicePixelRatio` is display scale × page zoom, which turns such an estimate into one of the display scale. Snapping that to the steps the system offers gives the exact display scale, and with it the exact zoom.
 * @param titlebarHeight height of the title bar area in CSS pixels
 * @param platformName like `navigator.userAgentData.platform`
 */
export const getZoomScale = (metrics: WindowMetrics, titlebarHeight: number, platformName = '') => {
  const platform = platforms[platformName] ?? unknownPlatform
  const estimate = estimateZoomScale(metrics, titlebarHeight, platform)
  if (!estimate || !Number.isFinite(estimate) || estimate < 0) {
    return 1
  }
  if (!platform.step) {
    return estimate
  }
  const displayScale = Math.max(1, Math.round(estimate * metrics.devicePixelRatio / platform.step) * platform.step)
  return displayScale / metrics.devicePixelRatio
}
