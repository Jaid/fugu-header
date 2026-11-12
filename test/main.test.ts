import {expect, test} from 'bun:test'

import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

import fuguHeader from '#src/main.ts'

test('renders an ordinary header on a server', () => {
  const markup = renderToStaticMarkup(createElement(fuguHeader, {
    className: 'own',
    id: 'top',
  }, 'content'))
  expect(markup).toContain('<header id="top" class="fugu-header own">content</header>')
})
test('ships its style sheet with the markup', () => {
  const markup = renderToStaticMarkup(createElement(fuguHeader))
  expect(markup).toContain('<style data-precedence="low" data-href="fugu-header">')
  expect(markup).toContain('@media (display-mode: window-controls-overlay)')
  expect(markup).toContain('<header class="fugu-header"></header>')
})
test('only exposes the component and the hook at runtime', async () => {
  const module = await import('#src/main.ts')
  expect(Object.keys(module).toSorted()).toEqual(['default', 'useTitlebar'])
})
