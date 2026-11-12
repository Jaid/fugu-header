import type {TitlebarRect, TitlebarWindow} from '#src/lib/TitlebarStore.ts'

import {describe, expect, mock, test} from 'bun:test'

import {hiddenTitlebar, TitlebarStore} from '#src/lib/TitlebarStore.ts'

class FakeOverlay extends EventTarget {
  rect: TitlebarRect = {
    height: 33,
    width: 307,
    x: 0,
    y: 0,
  }
  visible = true
  getTitlebarAreaRect() {
    return this.rect
  }
}
// a 500 × 520 px Windows app window at 100% page zoom
class FakeWindow extends EventTarget {
  devicePixelRatio = 1
  innerHeight = 520
  innerWidth = 500
  navigator: Pick<TitlebarWindow['navigator'], 'userAgentData'> & {windowControlsOverlay?: FakeOverlay} = {
    userAgentData: {platform: 'Windows'},
    windowControlsOverlay: new FakeOverlay,
  }
  outerHeight = 529
  outerWidth = 516
  zoomTo(zoom: number) {
    this.devicePixelRatio = zoom
    this.innerWidth = Math.round(500 / zoom)
    this.innerHeight = Math.round(520 / zoom)
    this.navigator.windowControlsOverlay!.rect = {
      height: Math.ceil(33 / zoom),
      width: Math.round(307 / zoom),
      x: 0,
      y: 0,
    }
    this.dispatchEvent(new Event('resize'))
  }
}
describe('snapshot', () => {
  test('is hidden without the Window Controls Overlay API', () => {
    const fakeWindow = new FakeWindow
    fakeWindow.navigator = {}
    const store = new TitlebarStore(fakeWindow)
    expect(store.getSnapshot()).toBe(hiddenTitlebar)
  })
  test('is hidden while the overlay is', () => {
    const fakeWindow = new FakeWindow
    fakeWindow.navigator.windowControlsOverlay!.visible = false
    const store = new TitlebarStore(fakeWindow)
    expect(store.getSnapshot()).toBe(hiddenTitlebar)
  })
  test('describes a visible overlay', () => {
    const store = new TitlebarStore(new FakeWindow)
    expect(store.getSnapshot()).toEqual({
      rect: {
        height: 33,
        width: 307,
        x: 0,
        y: 0,
      },
      scale: 1,
      visible: true,
    })
  })
  test('keeps its identity until something changes', () => {
    const fakeWindow = new FakeWindow
    const store = new TitlebarStore(fakeWindow)
    const first = store.getSnapshot()
    expect(store.getSnapshot()).toBe(first)
    fakeWindow.zoomTo(1.4)
    const zoomed = store.getSnapshot()
    expect(zoomed).not.toBe(first)
    expect(zoomed.scale).toBeCloseTo(1 / 1.4, 12)
    expect(zoomed.rect.height).toBe(24)
    expect(store.getSnapshot()).toBe(zoomed)
  })
})
describe('subscription', () => {
  test('notifies on zoom and overlay changes', () => {
    const fakeWindow = new FakeWindow
    const store = new TitlebarStore(fakeWindow)
    const listener = mock()
    store.subscribe(listener)
    fakeWindow.zoomTo(2)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().scale).toBe(0.5)
    fakeWindow.navigator.windowControlsOverlay!.visible = false
    fakeWindow.navigator.windowControlsOverlay!.dispatchEvent(new Event('geometrychange'))
    expect(listener).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot()).toBe(hiddenTitlebar)
  })
  test('stays quiet when an event changes nothing', () => {
    const fakeWindow = new FakeWindow
    const store = new TitlebarStore(fakeWindow)
    const listener = mock()
    store.subscribe(listener)
    fakeWindow.dispatchEvent(new Event('resize'))
    fakeWindow.navigator.windowControlsOverlay!.dispatchEvent(new Event('geometrychange'))
    expect(listener).not.toHaveBeenCalled()
  })
  test('picks up changes that happened before subscribing', () => {
    const fakeWindow = new FakeWindow
    const store = new TitlebarStore(fakeWindow)
    const initial = store.getSnapshot()
    fakeWindow.navigator.windowControlsOverlay!.visible = false
    store.subscribe(mock())
    expect(store.getSnapshot()).not.toBe(initial)
    expect(store.getSnapshot()).toBe(hiddenTitlebar)
  })
  test('serves every subscriber and stops after unsubscribing', () => {
    const fakeWindow = new FakeWindow
    const store = new TitlebarStore(fakeWindow)
    const first = mock()
    const second = mock()
    const unsubscribeFirst = store.subscribe(first)
    const unsubscribeSecond = store.subscribe(second)
    fakeWindow.zoomTo(2)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    unsubscribeFirst()
    fakeWindow.zoomTo(1)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(2)
    unsubscribeSecond()
    fakeWindow.zoomTo(3)
    expect(second).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot().scale).toBeCloseTo(1 / 3, 12)
  })
})
