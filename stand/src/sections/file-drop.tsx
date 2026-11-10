import { useState } from 'react'
import { Row } from '../row'
import { FileDrop, type FileRejection } from '../../../registry/ui/file-drop'

export function FileDropSection() {
  const [taken, setTaken] = useState<string[]>([])
  const [refused, setRefused] = useState<FileRejection[]>([])

  return (
    <>
      <Row label="drag files onto it, or press it">
        <div className="w-full">
          <FileDrop
            aria-label="Attachments"
            multiple
            onFiles={(files) => setTaken(files.map((file) => file.name))}
            className="w-full"
          >
            <span className="text-sm text-dim">
              Drop files here, or <span className="text-accent underline">choose them</span>
            </span>
          </FileDrop>
          {taken.length > 0 && (
            <ul className="m-0 mt-2 list-none p-0 text-xs text-dim">
              {taken.map((name) => (
                <li key={name} className="font-mono">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Row>

      <Row label="filtered, and saying what it refused">
        <div className="w-full">
          <FileDrop
            aria-label="Images only, under 1 KB"
            accept="image/*"
            maxSize={1024}
            multiple
            onFiles={() => setRefused([])}
            onReject={setRefused}
            className="w-full"
          >
            <span className="text-sm text-dim">Images, under 1 KB</span>
          </FileDrop>
          {refused.length > 0 && (
            <ul className="m-0 mt-2 list-none p-0 text-xs text-bad">
              {refused.map((rejection) => (
                <li key={rejection.file.name}>
                  {rejection.file.name} - {rejection.reason === 'type' ? 'not an image' : 'too large'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Row>

      <Row label="disabled">
        <FileDrop aria-label="Closed" disabled onFiles={() => {}} className="w-full">
          <span className="text-sm text-dim">Not taking files right now</span>
        </FileDrop>
      </Row>
    </>
  )
}
