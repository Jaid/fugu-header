# styling

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

# dragging

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
