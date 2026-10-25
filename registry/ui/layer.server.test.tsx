// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LayerProvider } from './layer'

/*
 * A layer on a server.
 *
 * A product that renders its first page on a server renders its overlays
 * there too, closed or open - and a server has no `document` to make a host
 * in. The layer makes its nodes only where there is one, and draws its
 * children either way.
 */
describe('LayerProvider on a server', () => {
  it('renders its children without a document', () => {
    expect(typeof document).toBe('undefined')
    expect(renderToString(<LayerProvider above="modal">a dialog's body</LayerProvider>)).toContain('a dialog')
  })
})
