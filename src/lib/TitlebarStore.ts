import type {WindowMetrics} from '#src/lib/getZoomScale.ts'

import {getZoomScale} from '#src/lib/getZoomScale.ts'

export type TitlebarRect = {
  height: number
  width: number
  x: number
  y: number
}

export type TitlebarState = {
  /** title bar area next to the window controls in CSS pixels, empty unless `visible` */
  rect: TitlebarRect
  /** factor that undoes page zoom, like `0.5` at 200%, and `1` unless `visible` */
  scale: number
  /** whether the window’s title bar currently belongs to the page */
  visible: boolean
}

/** the parts of `window` the store reads, including `navigator` members that TypeScript’s DOM types lack */
export type TitlebarWindow = Listenable & WindowMetrics & {
  navigator: {
    userAgentData?: {platform: string}
    windowControlsOverlay?: Listenable & {
      getTitlebarAreaRect: () => TitlebarRect
      visible: boolean
    }
  }
}

type Listenable = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>

export const hiddenTitlebar: TitlebarState = {
  rect: {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  },
  scale: 1,
  visible: false,
}

/** Tracks a window’s title bar area as an external store for React’s `useSyncExternalStore`. */
export class TitlebarStore implements EventListenerObject {
  readonly #listeners = new Set<() => void>
  #state = hiddenTitlebar
  readonly #window: TitlebarWindow
  constructor(targetWindow: TitlebarWindow) {
    this.#window = targetWindow
  }
  getSnapshot() {
    // Without subscribers nothing reports changes, so the state is read on demand.
    if (!this.#listeners.size) {
      this.#refresh()
    }
    return this.#state
  }
  handleEvent() {
    if (!this.#refresh()) {
      return
    }
    for (const listener of this.#listeners) {
      listener()
    }
  }
  subscribe(listener: () => void) {
    if (!this.#listeners.size) {
      // Page zoom resizes the viewport, toggling the overlay changes its geometry.
      this.#window.addEventListener('resize', this)
      this.#window.navigator.windowControlsOverlay?.addEventListener('geometrychange', this)
      this.#refresh()
    }
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
      if (!this.#listeners.size) {
        this.#window.removeEventListener('resize', this)
        this.#window.navigator.windowControlsOverlay?.removeEventListener('geometrychange', this)
      }
    }
  }
  #read(): TitlebarState {
    const overlay = this.#window.navigator.windowControlsOverlay
    if (!overlay?.visible) {
      return hiddenTitlebar
    }
    const {height, width, x, y} = overlay.getTitlebarAreaRect()
    return {
      rect: {
        height,
        width,
        x,
        y,
      },
      scale: getZoomScale(this.#window, height, this.#window.navigator.userAgentData?.platform),
      visible: true,
    }
  }
  /** Returns whether the state changed. Unchanged states keep their identity, as React expects from snapshots. */
  #refresh() {
    const next = this.#read()
    const previous = this.#state
    if (next.visible === previous.visible && next.scale === previous.scale && next.rect.x === previous.rect.x && next.rect.y === previous.rect.y && next.rect.width === previous.rect.width && next.rect.height === previous.rect.height) {
      return false
    }
    this.#state = next
    return true
  }
}
