# accuracy of the zoom factor

Browsers do not tell pages their zoom level, so `scale` is derived from the window size and the display scale.

- On Windows it is exact for display scales in steps of 25%, which covers everything the Settings app offers. A custom scale like 110% is taken for the nearest step.
- Brave’s fingerprinting protection hides the real window size from pages. The factor then comes from the height of the title bar area, which is still exact except for maximized windows on displays scaled above 100%.
- On macOS and Linux it is derived from the window size as well, but untested.

The height of the title bar area is only reported in whole CSS pixels, rounded up. The header can therefore be up to one CSS pixel higher than the window controls, which is 2 device pixels at 200% zoom.

# Content Security Policy

The component adds a small `<style>` element to the page. A policy has to allow it, for example with `'unsafe-inline'` in `style-src`.
