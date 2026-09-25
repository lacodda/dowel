import { useState } from 'react'
import { Button } from '../../../registry/ui/button'
import { useFieldDraft } from '../../../registry/ui/field-draft'
import { Input } from '../../../registry/ui/input'
import { Textarea } from '../../../registry/ui/textarea'
import { Row } from '../row'

/* Titles a plugin or another tab might write in underneath, while nobody is
 * typing in this box. */
const externalEdits = ['Ready for review', 'Needs another pass', 'Looks good now']

export function FieldDraftSection() {
  const [title, setTitle] = useState('Harbour lights')
  const [note, setNote] = useState('Second verse still needs a rewrite.')
  const [editIndex, setEditIndex] = useState(0)

  const titleDraft = useFieldDraft(title, (text) => setTitle(text))
  const noteDraft = useFieldDraft(note, (text) => setNote(text), { multiline: true })

  const writeUnderneath = () => {
    // `editIndex % externalEdits.length` is always a valid index into a
    // non-empty array; the assertion is the same one every stand section that
    // cycles a fixed list makes.
    setTitle(externalEdits[editIndex % externalEdits.length]!)
    setEditIndex((index) => index + 1)
  }

  return (
    <>
      <Row label="spread onto an Input - the box follows the stored value while nobody is typing">
        <Input aria-label="Title" {...titleDraft} className="w-56" />
        <span className="text-xs text-faint">stored: {title}</span>
        <Button variant="ghost" size="sm" onClick={writeUnderneath}>
          Write underneath
        </Button>
      </Row>

      <Row label="spread onto a Textarea, with multiline so Enter starts a new line instead of leaving the field">
        <Textarea aria-label="Note" {...noteDraft} className="w-64" rows={3} />
        <span className="text-xs text-faint">stored: {note}</span>
      </Row>
    </>
  )
}
