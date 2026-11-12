import type {TitlebarState} from '#src/main.ts'
import type {Root} from 'react-dom/client'

import {afterAll, afterEach, beforeEach, expect, test} from 'bun:test'

import {GlobalRegistrator} from '@happy-dom/global-registrator'
import {act, createElement} from 'react'

// React DOM decides at import time whether it runs in a browser, so the DOM has to exist first.
GlobalRegistrator.register()
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true})
const {createRoot} = await import('react-dom/client')
const {default: fuguHeader, useTitlebar} = await import('#src/main.ts')
class FakeOverlay extends EventTarget {
  rect = {
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
const overlay = new FakeOverlay
const setGlobal = (name: string, value: unknown) => {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: true,
  })
}
// a 500 × 520 px Windows app window
const zoomTo = (zoom: number) => {
  setGlobal('devicePixelRatio', zoom)
  setGlobal('innerWidth', Math.round(500 / zoom))
  setGlobal('innerHeight', Math.round(520 / zoom))
  setGlobal('outerWidth', 516)
  setGlobal('outerHeight', 529)
  overlay.rect = {
    height: Math.ceil(33 / zoom),
    width: Math.round(307 / zoom),
    x: 0,
    y: 0,
  }
}
const getStyle = () => document.querySelector('header')!.style
let root: Root
Object.defineProperty(navigator, 'userAgentData', {value: {platform: 'Windows'}})
Object.defineProperty(navigator, 'windowControlsOverlay', {value: overlay})
beforeEach(() => {
  overlay.visible = true
  zoomTo(1)
  root = createRoot(document.body.appendChild(document.createElement('div')))
})
afterEach(async () => {
  await act(() => {
    root.unmount()
  })
  document.body.replaceChildren()
})
afterAll(async () => {
  await GlobalRegistrator.unregister()
})
test('fills the title bar area and undoes the current page zoom', async () => {
  zoomTo(1.25)
  await act(() => {
    root.render(createElement(fuguHeader, {className: 'own'}, 'content'))
  })
  const header = document.querySelector('header')!
  expect(header.className).toBe('fugu-header own')
  expect(header.textContent).toBe('content')
  expect(header.style.zoom).toBe('0.8')
  expect(header.style.position).toBe('fixed')
  expect(header.style.top).toBe('calc(env(titlebar-area-y, 0px) / 0.8)')
  expect(header.style.left).toBe('calc(env(titlebar-area-x, 0px) / 0.8)')
  expect(header.style.width).toBe('calc(env(titlebar-area-width, 100%) / 0.8)')
  expect(header.style.height).toBe('calc(env(titlebar-area-height, 100%) / 0.8)')
  expect(header.style.boxSizing).toBe('border-box')
  expect(header.style.getPropertyValue('app-region')).toBe('drag')
})
test('lets the style prop override its layout', async () => {
  await act(() => {
    root.render(createElement(fuguHeader, {
      style: {
        color: 'red',
        position: 'sticky',
      },
    }))
  })
  expect(getStyle().color).toBe('red')
  expect(getStyle().position).toBe('sticky')
  expect(getStyle().zoom).toBe('1')
})
test('follows zoom changes', async () => {
  await act(() => {
    root.render(createElement(fuguHeader))
  })
  expect(getStyle().zoom).toBe('1')
  await act(() => {
    zoomTo(2)
    globalThis.dispatchEvent(new Event('resize'))
  })
  expect(getStyle().zoom).toBe('0.5')
  expect(getStyle().width).toBe('calc(env(titlebar-area-width, 100%) / 0.5)')
})
test('is an ordinary header while the overlay is hidden', async () => {
  await act(() => {
    root.render(createElement(fuguHeader, {style: {color: 'red'}}))
  })
  expect(getStyle().position).toBe('fixed')
  await act(() => {
    overlay.visible = false
    overlay.dispatchEvent(new Event('geometrychange'))
  })
  expect(document.querySelector('header')!.getAttribute('style')).toBe('color: red;')
})
test('adds a single style sheet for any number of headers', async () => {
  await act(() => {
    root.render([createElement(fuguHeader, {key: 'first'}), createElement(fuguHeader, {key: 'second'})])
  })
  expect(document.querySelectorAll('header')).toHaveLength(2)
  const styles = document.head.querySelectorAll('style[data-href="fugu-header"]')
  expect(styles).toHaveLength(1)
  expect(styles[0].textContent).toContain('@media (display-mode: window-controls-overlay)')
})
test('exposes the title bar state through the hook', async () => {
  const states: Array<TitlebarState> = []
  const Probe = () => {
    states.push(useTitlebar())
    return null
  }
  zoomTo(1.25)
  await act(() => {
    root.render(createElement(Probe))
  })
  expect(states.at(-1)).toEqual({
    rect: {
      height: 27,
      width: 246,
      x: 0,
      y: 0,
    },
    scale: 0.8,
    visible: true,
  })
})
