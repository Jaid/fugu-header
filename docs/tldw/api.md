# `useTitlebar()`

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

# types

`FuguHeaderProps`, `TitlebarState` and `TitlebarRect` are exported as types.
