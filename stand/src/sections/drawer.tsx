import { Button } from '../../../registry/ui/button'
import {
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from '../../../registry/ui/drawer'
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '../../../registry/ui/menu'
import { Row } from '../row'
import { MoreIcon, XIcon } from './icons'

const MESSAGES = [
  'Draft the release note for Friday.',
  'Here is a first pass, three short paragraphs.',
  'Shorter, and lead with the date.',
  'Done - two sentences now.',
  'Add the cover credit.',
  'Added at the end.',
  'And the links to the three platforms.',
  'Added, one per line.',
  'Good. Check the spelling of the title.',
  'Fixed one: "Harbour", with a u.',
  'Save it to the release.',
  'Saved.',
]

export function DrawerSection() {
  return (
    <>
      <Row label="from an edge - the header and the actions stay, the body scrolls; a row's menu opens above the drawer">
        <Drawer swipeDirection="right">
          <DrawerTrigger render={<Button variant="ghost" />}>The assistant</DrawerTrigger>
          <DrawerPopup side="right">
            <DrawerHeader
              action={
                <DrawerClose render={<Button variant="icon" size="icon-sm" aria-label="Close" />}>
                  <XIcon />
                </DrawerClose>
              }
            >
              <DrawerTitle>The assistant</DrawerTitle>
              <DrawerDescription>A conversation about this release.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody data-probe="drawer-body">
              <ul className="flex flex-col gap-2 pb-1">
                {MESSAGES.map((message, index) => (
                  <li key={message} className="flex items-start gap-2 rounded-md bg-soft px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">{message}</span>
                    <Menu>
                      <MenuTrigger
                        render={<Button variant="icon" size="icon-xs" aria-label="Message actions" />}
                        data-probe={index === 0 ? 'drawer-menu' : undefined}
                      >
                        <MoreIcon />
                      </MenuTrigger>
                      <MenuPopup>
                        <MenuItem>Copy</MenuItem>
                        <MenuItem>Quote in the reply</MenuItem>
                        <MenuSeparator />
                        <MenuItem tone="danger">Delete</MenuItem>
                      </MenuPopup>
                    </Menu>
                  </li>
                ))}
              </ul>
            </DrawerBody>
            <DrawerActions>
              <Button render={<DrawerClose />}>Close</Button>
              <Button variant="primary">Send</Button>
            </DrawerActions>
          </DrawerPopup>
        </Drawer>

        <Drawer>
          <DrawerTrigger render={<Button variant="ghost" />}>From the bottom</DrawerTrigger>
          <DrawerPopup side="bottom">
            <DrawerHeader>
              <DrawerTitle>Add a version</DrawerTitle>
              <DrawerDescription>Paste the text, or drop a file.</DrawerDescription>
            </DrawerHeader>
            <DrawerActions>
              <Button render={<DrawerClose />}>Close</Button>
            </DrawerActions>
          </DrawerPopup>
        </Drawer>
      </Row>

      <Row label="sizes - the width of a side panel, the height of a sheet">
        {(['sm', 'lg', 'xl'] as const).map((size) => (
          <Drawer key={size} swipeDirection="right">
            <DrawerTrigger render={<Button variant="ghost" />}>{size}</DrawerTrigger>
            <DrawerPopup side="right" size={size}>
              <DrawerHeader>
                <DrawerTitle>A {size} panel</DrawerTitle>
              </DrawerHeader>
              <DrawerActions>
                <Button render={<DrawerClose />}>Close</Button>
              </DrawerActions>
            </DrawerPopup>
          </Drawer>
        ))}
      </Row>
    </>
  )
}
