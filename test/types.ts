import type {FuguHeaderProps, TitlebarRect, TitlebarState} from '#src/main.ts'

import fuguHeader, {useTitlebar} from '#src/main.ts'

const valid: Array<FuguHeaderProps> = [
  {},
  {
    children: 'content',
    className: 'header',
  },
  {
    'aria-label': 'Title bar',
    onClick: () => {},
    style: {color: 'red'},
  },
]
const state: TitlebarState = useTitlebar()
const rect: TitlebarRect = state.rect
const scale: number = state.scale
const visible: boolean = state.visible
valid
rect
scale
visible
fuguHeader
// @ts-expect-error TS2353 Only attributes of a <header> element are accepted.
const invalid: FuguHeaderProps = {href: '/'}
invalid
