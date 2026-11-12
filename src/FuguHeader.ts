import type {ComponentProps, CSSProperties, ReactNode} from 'react'

import {createElement, Fragment} from 'react'

import {useTitlebar} from '#src/useTitlebar.ts'

import style from '#src/style.css' with {type: 'text'}

export type FuguHeaderProps = ComponentProps<'header'>

const baseClassName = 'fugu-header'
/**
 * Places the header over the title bar area. Zooming it by the inverse page zoom keeps its content at a constant physical size, and its own lengths are divided by the same factor to still match the area.
 *
 * These are inline styles because the layout must not depend on how the app’s style sheets are ordered. Defaults that apps are meant to restyle live in the style sheet instead.
 */
const getTitlebarStyle = (scale: number) => ({
  appRegion: 'drag',
  boxSizing: 'border-box',
  height: `calc(env(titlebar-area-height, 100%) / ${scale})`,
  left: `calc(env(titlebar-area-x, 0px) / ${scale})`,
  position: 'fixed',
  top: `calc(env(titlebar-area-y, 0px) / ${scale})`,
  width: `calc(env(titlebar-area-width, 100%) / ${scale})`,
  zoom: scale,
} as CSSProperties)
/**
 * A `<header>` that becomes the window’s title bar in installed web apps with Window Controls Overlay.
 *
 * There it fills the area next to the window controls, drags the window by its empty space and keeps its physical size at any page zoom. Anywhere else it is an ordinary header.
 */
const FuguHeader = ({children, className, style: ownStyle, ...properties}: FuguHeaderProps): ReactNode => {
  const {scale, visible} = useTitlebar()
  const header = createElement('header', {
    ...properties,
    className: className ? `${baseClassName} ${className}` : baseClassName,
    style: visible ? {
      ...getTitlebarStyle(scale),
      ...ownStyle,
    } : ownStyle,
  }, children)
  // React hoists the style sheet into <head> and keeps a single copy for any number of headers.
  return createElement(Fragment, null, createElement('style', {
    href: baseClassName,
    precedence: 'low',
  }, style), header)
}

export default FuguHeader
