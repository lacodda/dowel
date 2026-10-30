# Avatar

Source: https://lacodda.github.io/dowel/components/avatar

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#avatar

Five sizes, initials on a neutral ground, the square shape for a thing that is not a person, a picture that fails to load, and a group with its count.

## Notes

Every screen that lists people needs one, and the three things that go wrong
with it are always the same.

**The picture fails to load**, and a broken-image glyph appears where a face
was. Profile links expire; the fallback is not a nicety but the state the
component spends most of its life in, so it is the default rather than the
exception.

**The initials are cut from the wrong end.** Splitting a name on spaces and
taking the first letter of each part is the version everyone writes, and it
turns a one-word name into one letter and a hyphenated surname into three.
`initialsOf` takes the first and the *last* word, keeps punctuation inside a
word, gives a single word two letters, and iterates by character rather than
by code unit — so a name beginning outside the basic plane does not come out
as a replacement glyph.

```tsx
<Avatar name={person.fullName} src={person.avatarUrl} size="sm" />
```

**It is announced once.** The tile is the `role="img"` and carries the name;
the `<img>` inside it has `alt=""`. A picture labelled with the person's name
beside the person's name as text reads the name twice.

**A name is not a colour.** Hashing a string into a hue looks charming on a
design page and produces, in a real list, colours that collide with the status
vocabulary — a face is not `--bad` — and that differ between products for the
same person. The ground is the neutral `--soft`, always.

**Square is for a thing that is not a person**: a project, a repository. It is
how every other tool says so, and borrowing that saves a caption.

**In a group, the first face is on top.** Later siblings paint over earlier
ones by default, which would put the last face over the first; the eye reads
left to right and expects the leftmost tile whole, so the stack is reversed
explicitly. The `+3` tile has nobody behind it, so it is text rather than a
labelled image.

## Props

### `Avatar`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `xs \| sm \| md \| lg \| xl` | `'md'` |  |
| `shape` | `circle \| square` | `'circle'` |  |
| `name` (required) | `string` |  | Who or what this stands for. Always required: it is the name a reader who does not see the picture gets, and the source of the initials. |
| `src` | `string` |  | The picture. Absent, or failing to load, falls back to the initials. |
| `fallback` | `ReactNode` |  | Anything to draw instead of the initials when there is no picture - an icon for a thing that is not a person. |
| `imgProps` | `Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError' \| 'src' \| 'alt'>` |  | Passed to the `<img>`, for `loading` or `referrerPolicy`. |

And every prop of `HTMLAttributes<HTMLSpanElement>` except `children`, passed on.

### `AvatarGroup`

A row of faces, overlapping, with a count for the rest.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `4` | How many tiles to show before the rest become a count. |
| `people` (required) | `{ name: string; src?: string \| undefined; }[]` |  | The people. Given as data rather than as children, because the group has to know how many there are to say how many are hidden. |
| `size` | `sm \| md \| xs \| lg \| xl \| null` | `'sm'` | The size of every tile in the row, the count included. |
| `label` | `string` |  | What the whole row is called, for a screen reader - "Assignees", in the product's word. |

And every prop of `HTMLAttributes<HTMLDivElement>`, passed on.
