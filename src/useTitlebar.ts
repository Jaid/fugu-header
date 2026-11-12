import type {TitlebarState, TitlebarWindow} from '#src/lib/TitlebarStore.ts'

import {useSyncExternalStore} from 'react'

import {hiddenTitlebar, TitlebarStore} from '#src/lib/TitlebarStore.ts'

let store: TitlebarStore | undefined
// Created on first use in a browser, so importing this module on a server stays free of side effects.
const getStore = () => {
  store ??= new TitlebarStore(globalThis as unknown as TitlebarWindow)
  return store
}
const subscribe = (listener: () => void) => getStore().subscribe(listener)
const getSnapshot = () => getStore().getSnapshot()
const getServerSnapshot = () => hiddenTitlebar

/** Returns the live state of the window’s title bar area, which only installed web apps with Window Controls Overlay can own. */
export const useTitlebar = (): TitlebarState => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
