import { useState } from 'react'
import { Row } from '../row'
import { TagInput } from '../../../registry/ui/tag-input'

export function TagInputSection() {
  const [tags, setTags] = useState<string[]>(['documentation', 'registry'])
  const [few, setFew] = useState<string[]>([])

  return (
    <>
      <Row label="type a word, press Enter">
        <TagInput
          value={tags}
          onValueChange={setTags}
          aria-label="Tags"
          placeholder="Add a tag"
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-80"
        />
      </Row>

      <Row label="capped, and saying so">
        <TagInput
          value={few}
          onValueChange={setFew}
          max={3}
          aria-label="Up to three"
          placeholder={few.length < 3 ? 'Add a tag' : undefined}
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-80"
        >
          <span className="px-1 text-2xs text-faint tabular-nums">{few.length}/3</span>
        </TagInput>
      </Row>

      <Row label="sizes">
        <TagInput
          size="sm"
          value={['small']}
          onValueChange={() => {}}
          aria-label="Small"
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-56"
        />
        <TagInput
          size="lg"
          value={['large']}
          onValueChange={() => {}}
          aria-label="Large"
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-56"
        />
      </Row>
    </>
  )
}
