// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { InlineField, numberCodec, textCodec, timecodeCodec } from './inline-field'

/*
 * InlineField.
 *
 * The rules of Enter, Escape and leaving are FieldDraft's and tested there;
 * what is tested here is what this adds - the codec between the text and the
 * value, the caption that names the box, and a box that is always an input.
 */

describe('the codecs', () => {
  it('reads numbers, with a comma as the point, and refuses what is not one', () => {
    expect(numberCodec.parse('120')).toBe(120)
    expect(numberCodec.parse(' 3,5 ')).toBe(3.5)
    expect(numberCodec.parse('-2')).toBe(-2)
    expect(numberCodec.parse('')).toBeNull()
    expect(numberCodec.parse('12a')).toBeUndefined()
    expect(numberCodec.parse('1.2.3')).toBeUndefined()
  })

  it('reads timecodes as seconds', () => {
    expect(timecodeCodec.parse('83')).toBe(83)
    expect(timecodeCodec.parse('1:23')).toBe(83)
    expect(timecodeCodec.parse('0:04.5')).toBe(4.5)
    expect(timecodeCodec.parse('1:00:00')).toBe(3600)
    expect(timecodeCodec.parse('  2:05 ')).toBe(125)
    expect(timecodeCodec.parse('')).toBeNull()
  })

  it('refuses a timecode rather than guessing at it', () => {
    for (const text of ['abc', '-4', '1:75', '1.5:10', '1:2:3:4']) {
      expect(timecodeCodec.parse(text), text).toBeUndefined()
    }
  })

  it('writes timecodes as m:ss, with a tenth only when there is one', () => {
    expect(timecodeCodec.format(83)).toBe('1:23')
    expect(timecodeCodec.format(4.5)).toBe('0:04.5')
    expect(timecodeCodec.format(0)).toBe('0:00')
    expect(timecodeCodec.format(3600)).toBe('60:00')
    expect(timecodeCodec.format(59.96)).toBe('1:00')
    expect(timecodeCodec.format(12.34)).toBe('0:12.3')
  })

  it('round-trips a timecode it wrote', () => {
    for (const text of ['1:23', '0:04.5', '60:00', '0:00']) {
      expect(timecodeCodec.format(timecodeCodec.parse(text)!)).toBe(text)
    }
  })

  it('leaves text as it was typed', () => {
    expect(textCodec.parse('  F#m ')).toBe('  F#m ')
  })
})

function Tempo({ onCommit, initial = 120 }: { onCommit?: (value: number | null) => boolean | void; initial?: number | null }) {
  const [bpm, setBpm] = useState<number | null>(initial)
  return (
    <InlineField
      label="BPM"
      codec={numberCodec}
      value={bpm}
      placeholder="—"
      onCommit={(value) => {
        const answer = onCommit?.(value)
        if (answer !== false) setBpm(value)
        return answer
      }}
    />
  )
}

const box = (name = 'BPM') => screen.getByRole('textbox', { name }) as HTMLInputElement

describe('InlineField', () => {
  it('is an input named by its caption, showing the value in its spelling', () => {
    render(<Tempo />)
    expect(box().value).toBe('120')
    expect(screen.getByText('BPM').className).toContain('caption')
  })

  it('hands back the parsed value, not the text', async () => {
    const onCommit = vi.fn()
    render(<Tempo onCommit={onCommit} />)
    await userEvent.clear(box())
    await userEvent.type(box(), '128{Enter}')
    expect(onCommit).toHaveBeenCalledWith(128)
  })

  it('hands back null for a cleared value, not zero', async () => {
    const onCommit = vi.fn()
    render(<Tempo onCommit={onCommit} />)
    await userEvent.clear(box())
    await userEvent.tab()
    expect(onCommit).toHaveBeenCalledWith(null)
    expect(box().getAttribute('placeholder')).toBe('—')
  })

  it('keeps unreadable text on Enter, marked, and never hands it over', async () => {
    const onCommit = vi.fn()
    render(<Tempo onCommit={onCommit} />)
    await userEvent.type(box(), 'x{Enter}')
    expect(box().value).toBe('120x')
    expect(box().getAttribute('aria-invalid')).toBe('true')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('writes back in its own spelling', async () => {
    function Cut() {
      const [at, setAt] = useState<number | null>(83)
      return <InlineField label="Start" codec={timecodeCodec} value={at} onCommit={setAt} />
    }
    render(<Cut />)
    await userEvent.clear(box('Start'))
    await userEvent.type(box('Start'), '125{Enter}')
    expect(box('Start').value).toBe('2:05')
  })

  it('takes text with no codec at all', async () => {
    const onCommit = vi.fn()
    render(<InlineField label="Key" value="F#m" onCommit={onCommit} />)
    await userEvent.clear(box('Key'))
    await userEvent.type(box('Key'), 'Am{Enter}')
    expect(onCommit).toHaveBeenCalledWith('Am')
  })

  it('sets numbers in the monospaced face and text in the body face', () => {
    render(
      <>
        <Tempo />
        <InlineField label="Key" value="F#m" onCommit={() => {}} />
      </>,
    )
    expect(box().className).toContain('font-mono')
    expect(box('Key').className).not.toContain('font-mono')
  })

  it('keeps a hidden caption as the name, for a cell under a column header', () => {
    render(<InlineField label="Scene" labelHidden value="Rain" onCommit={() => {}} />)
    expect(screen.getByText('Scene').className).toContain('sr-only')
    expect(box('Scene')).toBeDefined()
  })

  it('does not take a number without a codec', () => {
    // The overloads refuse it at compile time; this fails the typecheck if
    // they ever stop doing so.
    // @ts-expect-error - a number needs a codec
    const field = <InlineField label="BPM" value={120} onCommit={() => {}} />
    expect(field).toBeDefined()
  })

  it('passes axe, filled and empty', async () => {
    await expectNoA11yViolations(<Tempo />)
    await expectNoA11yViolations(<Tempo initial={null} />)
  })
})
