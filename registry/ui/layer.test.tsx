// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Dialog, DialogBody, DialogHeader, DialogPopup, DialogTitle } from './dialog'
import { Drawer, DrawerBody, DrawerPopup, DrawerTitle } from './drawer'
import { LayerProvider, layerFloor, usePopupContainer } from './layer'
import { Menu, MenuItem, MenuPopup, MenuTrigger } from './menu'
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from './popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from './select'

/*
 * Layer.
 *
 * The claim is about stacking, and jsdom resolves no custom property and
 * computes no z-index - so what is tested here is the structure the claim
 * rests on: where each popup portals to, which node declares what, and that a
 * layer inside a layer nests rather than starting again from the body. That
 * the browser then resolves the floors to 41, 61 and 62 without a cycle is
 * measured on the stand, in a real engine (`tests/visual/measured.spec.ts`).
 */

/** The frame of the layer a node was portalled into, or null for the page. */
const frameOf = (node: Element) => node.closest('[data-dowel-layer]')

/** Whether a reader can reach the node at all. A modal overlay marks the rest
 * of the body `aria-hidden`, and a popup under a hidden ancestor works for a
 * pointer and does not exist for a screen reader. */
const hiddenFromReaders = (node: Element) => node.closest('[aria-hidden="true"]') !== null

function Probe({ onHost }: { onHost: (host: ReturnType<typeof usePopupContainer>) => void }) {
  onHost(usePopupContainer())
  return null
}

describe('the floor', () => {
  it('is worked out from the rung, by the stylesheet', () => {
    // No number of its own: renumbering the ladder moves every floor.
    expect(layerFloor('modal')).toBe('calc(max(var(--z-modal), var(--z-layer, 0)) + 1)')
    expect(layerFloor('floating')).not.toMatch(/\d{2}/)
  })
})

describe('a layer', () => {
  it('offers nothing outside every overlay, so a popup goes to the body', () => {
    let seen: ReturnType<typeof usePopupContainer> = null as never
    render(<Probe onHost={(host) => (seen = host)} />)
    expect(seen).toBeUndefined()
  })

  it('opens a host on the body and offers it inside', () => {
    let seen: ReturnType<typeof usePopupContainer>
    render(
      <LayerProvider above="modal">
        <Probe onHost={(host) => (seen = host)} />
      </LayerProvider>,
    )
    const host = seen!.current!
    expect(host).toBeInstanceOf(HTMLElement)
    const frame = frameOf(host)!
    expect(frame.parentElement).toBe(document.body)
    expect(frame.getAttribute('data-dowel-layer')).toBe('modal')
  })

  it('works the floor out on the frame and publishes it on the host', () => {
    // On one node the floor and the rung it raises would define each other,
    // and CSS answers a cycle by dropping both. Two nodes, two jobs.
    let seen: ReturnType<typeof usePopupContainer>
    render(
      <LayerProvider above="modal">
        <Probe onHost={(host) => (seen = host)} />
      </LayerProvider>,
    )
    const host = seen!.current!
    const frame = frameOf(host) as HTMLElement
    expect(frame).not.toBe(host)
    expect(frame.style.getPropertyValue('--z-layer-next')).toBe(layerFloor('modal'))
    expect(frame.style.getPropertyValue('--z-floating')).toBe('')
    // Every rung a popup might read, not only one of them.
    for (const rung of ['--z-layer', '--z-popup', '--z-menu', '--z-floating']) {
      expect(host.style.getPropertyValue(rung), rung).toBe('var(--z-layer-next)')
    }
    expect(host.style.getPropertyValue('--z-layer-next')).toBe('')
  })

  it('nests inside the layer it was opened in, so it inherits the raised rungs', () => {
    let outer: ReturnType<typeof usePopupContainer>
    let inner: ReturnType<typeof usePopupContainer>
    render(
      <LayerProvider above="modal">
        <Probe onHost={(host) => (outer = host)} />
        <LayerProvider above="floating">
          <Probe onHost={(host) => (inner = host)} />
        </LayerProvider>
      </LayerProvider>,
    )
    const innerFrame = frameOf(inner!.current!)!
    expect(innerFrame.parentElement).toBe(outer!.current)
    expect(innerFrame.getAttribute('data-dowel-layer')).toBe('floating')
  })

  it('takes its nodes away when the overlay goes', () => {
    let seen: ReturnType<typeof usePopupContainer>
    const { unmount } = render(
      <LayerProvider above="modal">
        <Probe onHost={(host) => (seen = host)} />
      </LayerProvider>,
    )
    const frame = frameOf(seen!.current!)!
    expect(document.body.contains(frame)).toBe(true)
    unmount()
    expect(document.body.contains(frame)).toBe(false)
  })
})

describe('the overlays that open one', () => {
  it('a popover opened in a dialog goes to the dialog layer', () => {
    render(
      <Dialog open>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Edit</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Popover open>
              <PopoverTrigger>Pick</PopoverTrigger>
              <PopoverPopup>
                <PopoverTitle>Choices</PopoverTitle>
              </PopoverPopup>
            </Popover>
          </DialogBody>
        </DialogPopup>
      </Dialog>,
    )
    const panel = screen.getByRole('dialog', { name: 'Choices' })
    const frame = frameOf(panel)!
    expect(frame.getAttribute('data-dowel-layer')).toBe('modal')
    // Not inside the dialog itself, whose body scrolls and would clip it -
    // but inside its portal, which is what keeps it the dialog's own.
    const dialog = screen.getByRole('dialog', { name: 'Edit' })
    expect(dialog.contains(panel)).toBe(false)
    expect(frame.parentElement!.closest('[data-base-ui-portal]')?.contains(dialog)).toBe(true)
    expect(hiddenFromReaders(panel)).toBe(false)
  })

  /*
   * In the order a person does it: the overlay first, the popup inside it
   * afterwards. The order is the whole test. A modal hides the siblings of
   * its popup when it opens, and spares what is already there to be spared -
   * so a menu open from the first render was found and kept, the test was
   * green, and on the stand, where the menu opens a moment later, the layer
   * had been hidden while empty and the menu opened into a hidden layer.
   */
  function ChatDrawer({ menu }: { menu: boolean }) {
    return (
      <Drawer open>
        <DrawerPopup>
          <DrawerTitle>Chat</DrawerTitle>
          <DrawerBody>
            <Menu open={menu}>
              <MenuTrigger>Row</MenuTrigger>
              <MenuPopup>
                <MenuItem>Copy</MenuItem>
              </MenuPopup>
            </Menu>
          </DrawerBody>
        </DrawerPopup>
      </Drawer>
    )
  }

  it('a menu opened in a drawer goes to the drawer layer, and a reader can reach it', async () => {
    const { rerender } = render(<ChatDrawer menu={false} />)
    // Let the drawer's focus manager run, which is what hides the page.
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Chat' })).toBeDefined())
    await new Promise((resolve) => setTimeout(resolve, 0))
    rerender(<ChatDrawer menu />)
    // Found by role, which skips anything hidden from readers.
    const menu = await screen.findByRole('menu')
    expect(frameOf(menu)?.getAttribute('data-dowel-layer')).toBe('modal')
    expect(hiddenFromReaders(menu)).toBe(false)
  })

  it('a select opened later in a popover in a dialog is still in reach', async () => {
    function Nested({ select }: { select: boolean }) {
      return (
        <Dialog open>
          <DialogPopup>
            <DialogTitle>Schedule</DialogTitle>
            <DialogBody>
              <Popover open>
                <PopoverTrigger>Options</PopoverTrigger>
                <PopoverPopup>
                  <PopoverTitle>Options</PopoverTitle>
                  <Select open={select} defaultValue="a" items={{ a: 'Draft', b: 'Released' }}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="a">Draft</SelectItem>
                      <SelectItem value="b">Released</SelectItem>
                    </SelectPopup>
                  </Select>
                </PopoverPopup>
              </Popover>
            </DialogBody>
          </DialogPopup>
        </Dialog>
      )
    }
    const { rerender } = render(<Nested select={false} />)
    await new Promise((resolve) => setTimeout(resolve, 0))
    rerender(<Nested select />)
    const list = await screen.findByRole('listbox')
    expect(frameOf(list)?.getAttribute('data-dowel-layer')).toBe('floating')
    expect(hiddenFromReaders(list)).toBe(false)
  })

  it('a select opened in a popover goes to the popover layer, inside the page', () => {
    render(
      <Popover open>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
          <Select open defaultValue="a" items={{ a: 'Apples', b: 'Pears' }}>
            <SelectTrigger aria-label="Fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="a">Apples</SelectItem>
              <SelectItem value="b">Pears</SelectItem>
            </SelectPopup>
          </Select>
        </PopoverPopup>
      </Popover>,
    )
    const list = screen.getByRole('listbox')
    const frame = frameOf(list)!
    expect(frame.getAttribute('data-dowel-layer')).toBe('floating')
    // The popover itself stays on the page's own floor.
    expect(frameOf(screen.getByText('Filters', { selector: 'h2' }))).toBeNull()
  })

  it('a popup on the page itself still goes to the body', () => {
    render(
      <Menu open>
        <MenuTrigger>Row</MenuTrigger>
        <MenuPopup>
          <MenuItem>Copy</MenuItem>
        </MenuPopup>
      </Menu>,
    )
    expect(frameOf(screen.getByRole('menu'))).toBeNull()
  })

  it('draws nothing a reader would meet', async () => {
    await expectNoA11yViolations(
      <LayerProvider above="modal">
        <p>Inside</p>
      </LayerProvider>,
    )
  })
})
