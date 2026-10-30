# Image

Source: https://lacodda.github.io/dowel/components/image

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#image

A ratio box with a picture inside, a broken source showing its fallback, and a source that never resolves showing the placeholder.

## Notes

A loading picture's layout jump is not a styling defect - it is a missing
number. The browser has nowhere to put the box until the file arrives and
says how big it is, so everything below the picture slides down and back up.
`AspectRatio` is that number, given up front by the caller instead of
discovered by the browser: a plain box on CSS `aspect-ratio` that reserves
its space the instant it is in the tree.

```tsx
<AspectRatio ratio="video" className="rounded-lg">
  <Image src={cover} alt={work.title} className="absolute inset-0" fallback={<ImageOffIcon />} />
</AspectRatio>
```

**`Image` carries the same three states `Avatar`'s picture already does** -
loading, loaded, failed - because a face and a photograph fail to load for
the same reasons. While loading it shows `Skeleton`'s own look
(`animate-pulse bg-soft`) rather than a second grey rectangle invented for
this one component, so the set has one loading language rather than two that
drift apart. Once loaded it fades in over `--duration-base`; a sudden
picture reads as a flash the eye has to catch, and the theme's own
reduced-motion media query already cuts every duration near zero for a
reader who asked for that, so nothing extra had to be wired up here.

**On error it shows `fallback` instead of the browser's own broken-image
icon.** A blank product-branded slot reads as "the picture is missing"; the
browser's glyph reads as "the product is broken." `fallback` is a prop
because the right text or icon is the product's word, never a default this
component would have to pick in one language.

**A cached picture is the state a naive version gets wrong.** An `<img>`
already in the browser's cache is already `complete` the instant it mounts
and fires no `load` event at all - there is nothing left to load. Without
checking `img.complete && naturalWidth` in a layout effect on mount, that
picture's placeholder would sit forever, waiting for an event that already
happened. `useLayoutEffect` rather than `useEffect`, so a cached picture
never paints its placeholder for even one frame.

**`alt` is required, with no default.** A decorative picture says so
explicitly with `alt=""`; there is no third option that means "nobody
decided yet," because that option is how a picture ships with no
description at all.

**Not Base UI.** Base UI's `Avatar` package is not installed in this
workspace, and this line's own `Avatar` already reimplements the same
loaded/failed state by hand for the same reason: a picture is common enough,
and the state small enough, that a dependency would cost more than the
`useState` it replaces. `Image` follows that precedent instead of adding a
second one.

## Props

### `AspectRatio`

A box that keeps its shape before, during and after whatever fills it loads. `size-full` on the child is the contract: this component reserves the rectangle, the child covers it.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `ratio` | `AspectRatioVariant` |  | The box's shape: `square`, `video`, or a raw number as width / height - `4 / 3`, `21 / 9` - for anything the named steps do not cover. |
| `children` | `ReactNode` |  |  |

And every prop of `HTMLAttributes<HTMLDivElement>` except `children`, passed on.

### `Image`

A picture that reserves its box, shows `Skeleton`'s placeholder while it loads, fades in once it has, and shows `fallback` instead of a broken-image glyph if it can't be loaded at all.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `fit` | `cover \| contain` | `'cover'` | How the picture fills a box that is not its own shape. `cover` for a photo standing in for the whole box; `contain` for a logo or a diagram where cropping would cut off the point of it. |
| `alt` (required) | `string` |  | Required, with no default: a decorative picture says so explicitly with `alt=""` rather than by omission, which is indistinguishable from a picture nobody described yet. |
| `fallback` | `ReactNode` |  | What stands in the box when the picture fails to load - the product's text or icon, not a default this component would have to write in some one language. |

And every prop of `ImgHTMLAttributes<HTMLImageElement>` except `onLoad`, `onError`, `placeholder`, passed on.
