import { useCallback, useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { cn } from 'dowel-ui'

/*
 * FileDrop.
 *
 * A place to put files: drag them onto it, or press it and pick them. It takes
 * files and hands them over - it does not upload them. Where they go, with
 * which credentials, retried how - that is the product's transport, and a
 * primitive that owned it would be wrong for every product whose upload does
 * not look like the one it guessed.
 *
 * The boundary is the same one `Field` draws around validation: the component
 * knows the shape of the interaction, the product knows what the interaction
 * means.
 *
 * The parts that are easy to get wrong, and are therefore here:
 *
 * - **A real `<input type="file">` underneath.** Not a div with a click
 *   handler. The native input is what makes the keyboard work, what the
 *   operating system's file picker attaches to, and what a screen reader
 *   announces as a file field. It is visually hidden, not `display: none` -
 *   hidden that way it is unfocusable, and the label stops reaching it.
 * - **The drag counter.** `dragleave` fires when the pointer crosses onto a
 *   *child* of the drop zone, so a zone that toggles on leave flickers as the
 *   pointer moves over its own text. Counting enters and leaves is the fix,
 *   and it is the single commonest defect in hand-written drop zones.
 * - **`dragover` must be prevented.** Without it the browser navigates to the
 *   file instead of dropping it - the drop appears to do nothing, and the page
 *   is replaced by a PDF.
 * - **Rejected files are reported, not swallowed.** A file dropped and
 *   silently ignored looks like a broken page. What is wrong with it is the
 *   product's word, so `onReject` hands back the file and the reason.
 */

/** Why a file was not accepted. The product turns this into a sentence. */
export type FileRejection = {
  file: File
  reason: 'type' | 'size' | 'count'
}

export interface FileDropProps {
  /** Called with the files that passed the filters. */
  onFiles: (files: File[]) => void
  /** Called with the ones that did not, so the product can say why. */
  onReject?: (rejections: FileRejection[]) => void
  /** What to take, in the form `<input accept>` uses: `image/*`, `.pdf,.docx`. */
  accept?: string
  /** Largest file, in bytes. */
  maxSize?: number
  /** How many at once. Without it, any number. */
  maxFiles?: number
  /** Whether several may be chosen in the picker. */
  multiple?: boolean
  disabled?: boolean
  /** What the zone says. The product's words, in the product's language. */
  children?: ReactNode
  className?: string
  id?: string
  /** Names the field for a screen reader, when there is no visible label. */
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

/** Whether a file matches an `accept` list. Handles the three forms the
 * attribute takes: an extension, a full type, and a wildcard type. */
function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true
  return accept
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry.startsWith('.')) return file.name.toLowerCase().endsWith(entry)
      if (entry.endsWith('/*')) return file.type.toLowerCase().startsWith(entry.slice(0, -1))
      return file.type.toLowerCase() === entry
    })
}

export function FileDrop({
  onFiles,
  onReject,
  accept,
  maxSize,
  maxFiles,
  multiple,
  disabled,
  children,
  className,
  id,
  ...aria
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const generatedId = useId()
  const inputId = id ?? generatedId

  /* Nested elements each fire their own enter and leave as the pointer crosses
   * them, so a boolean would flicker while the pointer moves across the zone's
   * own label. The depth counter is what makes "still inside" answerable. */
  const [depth, setDepth] = useState(0)
  const over = depth > 0

  const take = useCallback(
    (list: FileList | null) => {
      if (!list) return
      const incoming = Array.from(list)
      const accepted: File[] = []
      const rejected: FileRejection[] = []

      for (const file of incoming) {
        if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'type' })
        else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' })
        else if (maxFiles !== undefined && accepted.length >= maxFiles)
          rejected.push({ file, reason: 'count' })
        else accepted.push(file)
      }

      if (accepted.length) onFiles(accepted)
      if (rejected.length) onReject?.(rejected)
    },
    [accept, maxFiles, maxSize, onFiles, onReject],
  )

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDepth(0)
    if (disabled) return
    take(event.dataTransfer.files)
  }

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault()
        setDepth((d) => d + 1)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setDepth((d) => Math.max(0, d - 1))
      }}
      // Without preventing this, the browser opens the dropped file instead,
      // and the page the reader was filling in is simply gone.
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      // Presentational: the input inside is the control, and wrapping it in a
      // second interactive element would give a screen reader two.
      className={cn(
        'rounded-lg border border-dashed border-line bg-raise p-6 text-center transition-colors',
        over && !disabled && 'border-accent bg-accent-soft',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <label htmlFor={inputId} className={cn('block', !disabled && 'cursor-pointer')}>
        {children}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        {...aria}
        onChange={(event) => {
          take(event.target.files)
          // Cleared so that choosing the same file twice in a row still fires
          // a change - otherwise the second attempt silently does nothing.
          event.target.value = ''
        }}
        /* Visually hidden, not `hidden`: it stays focusable, keeps its place
         * in the tab order, and the label above still points at a real
         * control. `display: none` would take all three away. */
        className="sr-only"
      />
    </div>
  )
}
