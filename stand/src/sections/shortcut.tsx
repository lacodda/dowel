import { useEffect, useState } from 'react'
import { Input } from '../../../registry/ui/input'
import { Kbd } from '../../../registry/ui/kbd'
import { isTypingTarget, keysOf } from '../../../registry/ui/shortcut'
import { Row } from '../row'

/*
 * The notation, answering live.
 *
 * Press anything and the stand writes what it is as a shortcut, and draws it
 * the way this platform writes it. Switch to another keyboard layout and press
 * Ctrl+P again: it is still Ctrl+P, which is the point of reading a letter by
 * its place when the layout does not type Latin.
 */

const WRITTEN = ['Mod+K', 'Mod+Shift+P', 'Ctrl+Tab', 'Alt+ArrowLeft', '?', 'Escape', 'G D', 'Mod++']

export function ShortcutSection() {
  const [last, setLast] = useState<{ keys: string; typing: boolean } | null>(null)
  const [inField, setInField] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keys = keysOf(event)
      if (keys !== null) setLast({ keys, typing: isTypingTarget(event.target) })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Row label="written once, drawn the way this platform writes it">
        {WRITTEN.map((keys) => (
          <span key={keys} className="flex items-center gap-2 pr-3 font-mono text-xs text-dim">
            {keys}
            <Kbd keys={keys} />
          </span>
        ))}
      </Row>

      <Row label="press anything - then switch keyboard layout and press it again">
        <span className="font-mono text-sm text-text" data-probe="pressed">
          {last === null ? 'nothing pressed yet' : last.keys}
        </span>
        {last !== null && <Kbd keys={last.keys} />}
        {last?.typing && <span className="text-xs text-dim">in a field - a command would leave it alone</span>}
      </Row>

      <Row label="a field owns its keys">
        <Input
          className="max-w-72"
          aria-label="A field that owns its own keys"
          placeholder="Type here, then press Ctrl+K"
          value={inField}
          onChange={(event) => setInField(event.target.value)}
        />
      </Row>
    </>
  )
}
