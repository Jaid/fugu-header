import {expect, test} from 'bun:test'

const {default: fuguHeader} = await import('#src/main.ts')
test('should run', () => {
  const result = fuguHeader()
  expect(result).toBe('fugu-header') // TODO Test actual functionality
})
