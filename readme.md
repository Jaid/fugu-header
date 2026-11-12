<center><a href="https://npmjs.com/package/fugu-header"><img src="https://shieldcn.dev/npm/v/fugu-header.svg?variant=secondary&logo=npm&label=latest+version" alt="Latest version on npm"/></a> <a href="https://github.com/Jaid/fugu-header/raw/HEAD/license.txt"><img src="https://shieldcn.dev/github/license/Jaid/fugu-header.svg?variant=secondary" alt="License"/></a></center>

# fugu-header

a React header that takes over the title bar of installed web apps and keeps its size at any page zoom

Installed web apps can ask the browser for their window’s title bar with [Window Controls Overlay](https://developer.mozilla.org/docs/Web/API/Window_Controls_Overlay_API). `FuguHeader` moves your header there. Anywhere else – in a browser tab, in an app window with a regular title bar or on a server – it is an ordinary `<header>`.

## minimal example

```tsx
import FuguHeader from 'fugu-header'

export const App = () => <>
  <FuguHeader className='header'>
    <a href='/'>My app</a>
    <nav>…</nav>
  </FuguHeader>
  <main>…</main>
</>
```

## features

- fills the area next to the window controls and follows it when the window is resized or maximized
- drags the window by its empty space, while links, buttons and form controls stay clickable
- stays at its 100% size when the page is zoomed, like a native title bar
- `useTitlebar` hook for custom title bars
- asks for no permission and has no dependencies besides React

## installation

<a href="https://bun.sh"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Bun-fbf0df.svg?variant=outline&logo=bun&logoColor=fbf0df&mode=dark"><img src="https://shieldcn.dev/badge/Bun-fbf0df.svg?variant=outline&logo=bun&logoColor=fbf0df&mode=light" alt="Bun"/></picture></a>

```sh
bun add fugu-header
```

<a href="https://npmjs.com/package/fugu-header"><img src="https://shieldcn.dev/badge/npm-fugu--header-C23039.svg?variant=secondary&logo=npm" alt="fugu-header on npm"/></a>

```sh
npm install --save fugu-header
```

## requirements

- React 19.3 or later
- a Chromium-based desktop browser such as Chrome, Edge or Brave for the title bar itself, since no other engine implements Window Controls Overlay yet

## setup

The web app manifest has to request the overlay. Browsers only grant it to installed apps.

```json
{
  "display": "standalone",
  "display_override": ["window-controls-overlay"]
}
```

## usage

### styling

Style the header like any other element. Two things differ while it is the title bar:

- Its place is set with inline styles: `position`, `top`, `left`, `width`, `height`, `box-sizing`, `zoom` and `app-region`. Rules for these in your style sheets have no effect then. The `style` prop still overrides them.
- Lengths inside the header are measured at 100% zoom, so `font-size: 13px` is always 13 pixels of an unzoomed page.

Two defaults apply to the title bar and are meant to be replaced by your own class:

| property | default | note |
| --- | --- | --- |
| `background` | `Canvas` | should stay opaque, since page content scrolls beneath the bar |
| `z-index` | `10` | |

The header leaves the page flow while it is the title bar. Reserve its space with the height the browser reports, which is `0px` everywhere else:

```css
main {
  padding-top: env(titlebar-area-height, 0px);
}
```

Rules that should only apply to the title bar go into `@media (display-mode: window-controls-overlay)`.

### dragging

Any point of the header that is not covered by one of these elements drags the window, and a double click maximizes it:

```css
a, button, input, select, textarea, summary, label, [tabindex], [contenteditable]
```

Change that for single elements with `app-region` in your own styles:

```css
.logo {
  app-region: drag;
}

.search {
  app-region: no-drag;
}
```

On Windows, draggable points in the top left 16 × 16 px of the window act as the window icon: a click opens the system menu and a double click closes the window.

## API

### `useTitlebar()`

The hook behind the component, for custom title bars or anything else that depends on the title bar area.

```tsx
import {useTitlebar} from 'fugu-header'

const {rect, scale, visible} = useTitlebar()
```

| field | type | meaning |
| --- | --- | --- |
| `visible` | `boolean` | whether the window’s title bar currently belongs to the page |
| `rect` | `{x, y, width, height}` | title bar area next to the window controls in CSS pixels, empty unless `visible` |
| `scale` | `number` | factor that undoes page zoom, like `0.5` at 200%, and `1` unless `visible` |

The state updates on zoom, on window resizes and when the user turns the overlay on or off.

Setting an element’s `zoom` to `scale` keeps it at its physical size. Its own position and size are zoomed along, so `FuguHeader` divides the lengths of `rect` by `scale` to still fill the area.

### types

`FuguHeaderProps`, `TitlebarState` and `TitlebarRect` are exported as types.

## props

`FuguHeader` accepts every prop of a `<header>` element and passes it on. Two of them are combined with its own values:

- `className: string` – added after the `fugu-header` class
- `style: CSSProperties` – merged over the inline styles that place the title bar, so it can override them

## notes

### accuracy of the zoom factor

Browsers do not tell pages their zoom level, so `scale` is derived from the window size and the display scale.

- On Windows it is exact for display scales in steps of 25%, which covers everything the Settings app offers. A custom scale like 110% is taken for the nearest step.
- Brave’s fingerprinting protection hides the real window size from pages. The factor then comes from the height of the title bar area, which is still exact except for maximized windows on displays scaled above 100%.
- On macOS and Linux it is derived from the window size as well, but untested.

The height of the title bar area is only reported in whole CSS pixels, rounded up. The header can therefore be up to one CSS pixel higher than the window controls, which is 2 device pixels at 200% zoom.

### Content Security Policy

The component adds a small `<style>` element to the page. A policy has to allow it, for example with `'unsafe-inline'` in `style-src`.

## development

Maintain README content in `docs/tldw`. Do not edit `readme.md` directly.

`bun run readme` regenerates it. `bun run build` regenerates the README before creating the production package.

### setting up

```sh
git clone git@github.com:Jaid/fugu-header.git
cd fugu-header
bun install
```

### linting

```sh
bun run lint
```

### type checking

```sh
bun run typecheck
```

### testing

```sh
bun run test
```

## license

[MIT License](https://github.com/Jaid/fugu-header/raw/HEAD/license.txt)<br>
Copyright © 2026, Jaid \<jaid.jsx@gmail.com> (https://github.com/jaid)

<!--
readme generated with tldw v9.9.0 from ./docs/tldw
github.com/Jaid/tldw
-->
