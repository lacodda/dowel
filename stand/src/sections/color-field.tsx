import { useState } from 'react'
import { lineProducts } from 'dowel-ui'
import { Row } from '../row'
import { ColorField } from '../../../registry/ui/color-field'

export function ColorFieldSection() {
  const [token, setToken] = useState('kilna')
  const [anything, setAnything] = useState(lineProducts[7]!.accent)

  return (
    <>
      <Row label="the vocabulary a product already speaks">
        <div className="flex flex-col gap-2">
          <ColorField value={token} onValueChange={setToken} aria-label="Colour" />
          <span className="text-xs text-dim">
            chosen: <code className="font-mono text-text">{token}</code>
          </span>
        </div>
      </Row>

      <Row label="or a colour the reader picked">
        <div className="flex flex-col gap-2">
          <ColorField
            value={anything}
            onValueChange={setAnything}
            allowCustom
            customLabel="Custom"
            aria-label="Any colour"
          />
          <span className="text-xs text-dim">
            chosen: <code className="font-mono text-text">{anything}</code>
          </span>
        </div>
      </Row>
    </>
  )
}
