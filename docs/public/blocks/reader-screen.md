# ReaderScreen

Source: https://lacodda.github.io/dowel/blocks/reader-screen

FENCE0 

The block lands in `components/blocks/reader-screen.tsx`, and what it is made of -
[Progress](/dowel/components/progress/) - in `components/ui`.

See it live on the stand: https://lacodda.github.io/dowel/stand/#reader-screen

A short story in a window: scroll it and the bar follows the paragraph being read, at a desktop's width and a phone's.

## Notes

Two products of the line read long text: rhapsod a library of stories, hilvan a
text in the language being learnt, with a hand on every word. They read it the
same way, and that way is this block; every word in it is still the product's.

**The words are the product's.** `renderParagraph(index)` draws a paragraph -
plain text, rich runs with links and highlights, a button per word that opens a
word's card - and the block never looks inside it.

```tsx
<ReaderScreen
  title={text.title}
  byline={text.author}
  count={text.paragraphs.length}
  renderParagraph={(index) => <Words paragraph={text.paragraphs[index]} onWord={openCard} />}
  start={place}
  onParagraphChange={keepPlace}
  onSwipe={knowTheRest}
  marked={swept}
  foot={<Button size="sm" onClick={() => knowTheRest(place)}>{t('knowTheRest')}</Button>}
  after={<Button variant="primary" onClick={finish}>{t('read')}</Button>}
  words={{ progress: (at, count) => t('paragraphOf', { at, count }) }}
/>
```

**The measure.** A column a line of prose fits in, the text a step larger on a
phone, held a little further from the eye, and the leading a long read needs.

**Where the reader is.** The paragraph being read is the last one whose top has
passed the middle of the box the text scrolls in - the line the eye is on, not
the one about to appear. It is followed a frame at a time as the page scrolls,
and `onParagraphChange` is told whenever it changes: what the product does with
it, and how often it saves it, is the product's. The box is found, not given:
the nearest one around the text that scrolls, or the window - a reader in a
screen whose column holds still scrolls in a pane.

**Back where they stopped.** The paragraph in `start` is scrolled to once, when
the screen opens, with room above it: a paragraph flush against the top edge
reads as a page that was cut. A place that moved under someone who had started
scrolling would be worse than none, so a later `start` moves nothing.

**A sweep across a paragraph.** A finger drawn 80px to the right across a
paragraph tells `onSwipe` which one - hilvan's "I know the rest of it". Only a
finger, only to the right, and dropped the moment it runs more than 30px down the
page or back to the left: a reader scrolling must never set off anything,
however far the scroll drifts sideways. Without `onSwipe`, nothing listens and
the page keeps its sideways pan. `marked` draws a paragraph marked - the one just
swept, the one being heard.

**A bar that stands at the foot.** How far through the text the reader is, named
by `words.progress`, and `foot` beside it for what the product keeps in reach.
`after` follows the text: the next chapter, "I have read it".

The two rules are exported as plain functions, `paragraphAt` and
`swipeVerdict`, for a product that needs them elsewhere.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  | The text's title. |
| `byline` | `ReactNode` |  | Under the title: an author, a chapter, how long it reads. |
| `lead` | `ReactNode` |  | Above the text: a line on how to read it, the chapters' link. |
| `count` (required) | `number` |  | How many paragraphs the text has. |
| `renderParagraph` (required) | `(index: number) => ReactNode` |  | A paragraph, words and all. |
| `start` | `number \| null` |  | Where the reader stopped, scrolled to once when the screen opens. `0` or nothing: the top. |
| `onParagraphChange` | `(index: number) => void` |  | Told the paragraph being read whenever it changes. |
| `onSwipe` | `(index: number) => void` |  | Told a paragraph a finger swept to the right. Without it, nothing listens for a sweep. |
| `marked` | `number \| null` |  | A paragraph drawn marked - the one just swept, the one being heard. |
| `foot` | `ReactNode` |  | What stands in the foot bar beside the progress: an action in reach. |
| `after` | `ReactNode` |  | What follows the text: the next chapter, "I have read it". |
| `words` (required) | `ReaderScreenWords` |  |  |
| `className` | `string` |  |  |
