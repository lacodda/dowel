import { useState } from 'react'
import { cn } from 'dowel-ui'
import { Row } from '../row'
import { MarkedText, MarkedTextarea, type Mark } from '../../../registry/ui/marked-text'

/* A verse with one word used twice and one line new since the last draft:
 * the two kinds of mark, on text short enough to read at a glance. */
const verse = `The wire hums where the road gives out,
a kettle somewhere, a door ajar.
The light stays on in the hallway.
Nobody counts the hours here.`

/** Every occurrence of a word, as marks into the text. */
function occurrences(text: string, word: string, className: string): Mark[] {
  const marks: Mark[] = []
  let at = text.indexOf(word)
  while (at !== -1) {
    marks.push({ start: at, end: at + word.length, className })
    at = text.indexOf(word, at + word.length)
  }
  return marks
}

export function MarkedTextSection() {
  const [text, setText] = useState(verse)
  const metrics = 'p-3 text-sm leading-6'

  return (
    <>
      <Row label="to read - a repeated word marked, a new line painted">
        <MarkedText
          text={verse}
          marks={occurrences(verse, 'The', 'bg-warn-soft')}
          lineMarks={[{ line: 2, className: 'bg-good-soft' }]}
          className={cn('w-104 rounded-md border border-line bg-raise', metrics)}
        />
      </Row>

      <Row label="to type into - the marks stay under the letters as you edit">
        <MarkedTextarea
          value={text}
          onChange={setText}
          marks={occurrences(text, 'the', 'bg-warn-soft')}
          lineMarks={[{ line: 2, className: 'bg-good-soft' }]}
          aria-label="Verse"
          className={cn('w-104 rounded-md border border-line bg-raise', metrics)}
        />
      </Row>
    </>
  )
}
