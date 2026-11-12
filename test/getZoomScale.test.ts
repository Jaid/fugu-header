import type {WindowMetrics} from '#src/lib/getZoomScale.ts'

import {describe, expect, test} from 'bun:test'

import {getZoomScale} from '#src/lib/getZoomScale.ts'

type WindowSetup = {
  /** size of the window’s client area in device-independent pixels */
  client?: [width: number, height: number]
  displayScale?: number
  /** window borders in device-independent pixels */
  frame?: [width: number, height: number]
  /** how many CSS pixels Brave’s fingerprinting protection adds to the inner size to fake the outer one */
  mask?: [width: number, height: number]
  zoom: number
}

const zooms = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.5, 1.75, 2, 2.5, 3, 4, 5]
// a window as Chromium reports it: the outer size ignores page zoom, the inner size is in whole CSS pixels
const makeMetrics = ({client = [500, 520], displayScale = 1, frame = [16, 9], mask, zoom}: WindowSetup): WindowMetrics => {
  const innerWidth = Math.round(client[0] / zoom)
  const innerHeight = Math.round(client[1] / zoom)
  return {
    devicePixelRatio: displayScale * zoom,
    innerHeight,
    innerWidth,
    outerHeight: mask ? innerHeight + mask[1] : client[1] + frame[1],
    outerWidth: mask ? innerWidth + mask[0] : client[0] + frame[0],
  }
}
// Chromium reports the title bar area in whole CSS pixels, rounded up
const makeTitlebarHeight = (zoom: number, height = 33) => Math.ceil(height / zoom - 1e-9)
const expectScale = (metrics: WindowMetrics, titlebarHeight: number, zoom: number) => {
  expect(getZoomScale(metrics, titlebarHeight, 'Windows')).toBeCloseTo(1 / zoom, 12)
}
describe('Windows', () => {
  test('matches a real window at 100% and 140%', () => {
    expect(getZoomScale({
      devicePixelRatio: 1,
      innerHeight: 520,
      innerWidth: 500,
      outerHeight: 529,
      outerWidth: 516,
    }, 33, 'Windows')).toBe(1)
    expect(getZoomScale({
      devicePixelRatio: 1.399999976158142,
      innerHeight: 371,
      innerWidth: 357,
      outerHeight: 529,
      outerWidth: 516,
    }, 24, 'Windows')).toBe(1 / 1.399999976158142)
  })
  test('is exact at every zoom level, display scale and window size', () => {
    for (const displayScale of [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5]) {
      for (const client of [[500, 300], [500, 520], [800, 600], [1920, 1040], [3840, 2100]] as const) {
        for (const zoom of zooms) {
          const metrics = makeMetrics({
            client: [...client],
            displayScale,
            zoom,
          })
          expect(getZoomScale(metrics, makeTitlebarHeight(zoom), 'Windows')).toBeCloseTo(1 / zoom, 12)
        }
      }
    }
  })
  test('matches a real maximized window, which has no borders and a lower title bar', () => {
    expect(getZoomScale({
      devicePixelRatio: 1,
      innerHeight: 1044,
      innerWidth: 1920,
      outerHeight: 1044,
      outerWidth: 1920,
    }, 26, 'Windows')).toBe(1)
    expect(getZoomScale({
      devicePixelRatio: 1.25,
      innerHeight: 835,
      innerWidth: 1536,
      outerHeight: 1044,
      outerWidth: 1920,
    }, 21, 'Windows')).toBe(0.8)
    expect(getZoomScale({
      devicePixelRatio: 2,
      innerHeight: 522,
      innerWidth: 960,
      outerHeight: 1044,
      outerWidth: 1920,
    }, 13, 'Windows')).toBe(0.5)
  })
  test('is exact for maximized windows at every zoom level and display scale', () => {
    for (const displayScale of [1, 1.25, 1.5, 2, 3]) {
      for (const zoom of zooms) {
        const metrics = makeMetrics({
          client: [1920, 1044],
          displayScale,
          frame: [0, 0],
          zoom,
        })
        expect(getZoomScale(metrics, makeTitlebarHeight(zoom, 26), 'Windows')).toBeCloseTo(1 / zoom, 12)
      }
    }
  })
  test('ignores the axis that docked DevTools shrink', () => {
    const metrics = makeMetrics({
      client: [1000, 800],
      zoom: 1.25,
    })
    expect(getZoomScale({
      ...metrics,
      innerWidth: Math.round(metrics.innerWidth * 0.6),
    }, 27, 'Windows')).toBeCloseTo(0.8, 12)
    expect(getZoomScale({
      ...metrics,
      innerHeight: Math.round(metrics.innerHeight * 0.6),
    }, 27, 'Windows')).toBeCloseTo(0.8, 12)
  })
  test('matches a real window whose outer size Brave masks', () => {
    expectScale({
      devicePixelRatio: 1,
      innerHeight: 1015,
      innerWidth: 929,
      outerHeight: 1023,
      outerWidth: 931,
    }, 33, 1)
    expectScale({
      devicePixelRatio: 1.25,
      innerHeight: 812,
      innerWidth: 743,
      outerHeight: 820,
      outerWidth: 745,
    }, 27, 1.25)
    expectScale({
      devicePixelRatio: 3,
      innerHeight: 338,
      innerWidth: 309,
      outerHeight: 346,
      outerWidth: 311,
    }, 11, 3)
    expectScale({
      devicePixelRatio: 0.5,
      innerHeight: 2030,
      innerWidth: 1858,
      outerHeight: 2038,
      outerWidth: 1860,
    }, 66, 0.5)
  })
  test('falls back to the title bar height while the outer size is masked', () => {
    for (const displayScale of [1, 1.25, 1.5]) {
      for (const mask of [[0, 1], [2, 8], [5, 0], [8, 8]] as const) {
        for (const zoom of zooms) {
          const metrics = makeMetrics({
            displayScale,
            mask: [...mask],
            zoom,
          })
          expect(getZoomScale(metrics, makeTitlebarHeight(zoom), 'Windows')).toBeCloseTo(1 / zoom, 12)
        }
      }
    }
  })
  test('still gets maximized windows right on unscaled displays while the outer size is masked', () => {
    for (const zoom of zooms) {
      const metrics = makeMetrics({
        client: [1920, 1044],
        mask: [2, 8],
        zoom,
      })
      expect(getZoomScale(metrics, makeTitlebarHeight(zoom, 26), 'Windows')).toBeCloseTo(1 / zoom, 12)
    }
  })
})
describe('other platforms', () => {
  test('snaps to whole display scales on macOS', () => {
    for (const displayScale of [1, 2]) {
      for (const zoom of zooms) {
        const metrics = makeMetrics({
          displayScale,
          frame: [0, 0],
          zoom,
        })
        expect(getZoomScale(metrics, makeTitlebarHeight(zoom, 28), 'macOS')).toBeCloseTo(1 / zoom, 12)
      }
    }
  })
  test('estimates from the window size where display scales are arbitrary', () => {
    const metrics = makeMetrics({
      client: [1000, 800],
      displayScale: 1.6,
      frame: [0, 0],
      zoom: 1.25,
    })
    expect(getZoomScale(metrics, 27, 'Linux')).toBe(0.8)
    expect(getZoomScale(metrics, 27)).toBe(0.8)
  })
  test('leaves the zoom alone without a usable estimate', () => {
    const metrics = makeMetrics({
      mask: [4, 4],
      zoom: 1.5,
    })
    expect(getZoomScale(metrics, 22, 'Linux')).toBe(1)
    expect(getZoomScale(metrics, 22, 'macOS')).toBe(1)
  })
})
test('falls back to no scaling for a window without size', () => {
  const metrics: WindowMetrics = {
    devicePixelRatio: 1,
    innerHeight: 0,
    innerWidth: 0,
    outerHeight: 0,
    outerWidth: 0,
  }
  expect(getZoomScale(metrics, 0, 'Windows')).toBe(1)
  expect(getZoomScale(metrics, 0)).toBe(1)
})
