# Scrollbars

Source: https://lacodda.github.io/dowel/concepts/scrollbars

The theme replaces the browser's scrollbar everywhere, in one place, for every
product. Importing it is the whole of the setup — there is no component to add
and no class to remember.

## What an overlay scrollbar is

A scrollbar drawn **over** the content rather than beside it. The name matters
because the distinction is not decorative: an overlay bar takes no space in
layout, and a classic one takes a strip of it.

That strip is the problem. It appears when a document becomes one line too tall
and goes away when a filter removes a row, and the content shifts sideways by
its width each time. In a list that loads, a panel that filters, a page that
grows as you type, the layout twitches — and nothing on screen explains why.

The second problem is milder and more constant: a default bar is a piece of
someone else's chrome sitting in the middle of a product, full width, with step
arrows at the ends that nobody has used in twenty years.

## What the theme does

```css
@import 'dowel-ui/theme.css';
```

From that import every scrollable element in the product gets:

- **A `::-webkit-scrollbar` rule set.** What Chromium, Safari and the desktop
  WebViews lay out.
- **`scrollbar-width: thin` with a transparent track**, for the browsers with
  no `::-webkit-scrollbar` — Firefox. Only for them: since version 121 Chromium
  ignores the `-webkit` rules on any element with the standard properties set,
  and draws the system's thin bar with its step arrows instead.
- **A thumb painted from `line-2`**, and `dim` under the pointer. Both are
  vocabulary, so a product that tints its neutrals differently gets a bar that
  matches without saying anything.
- **No step arrows**, and no painted track or corner.

The rules sit in the `base` layer, so a utility on one element can still say
otherwise: `[scrollbar-width:none]` on a bar of tabs wins.

Two details in the thumb are worth knowing about, because they look arbitrary
and are not:

```css
::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  background-clip: content-box;
  min-height: 2.5rem;
}
```

The transparent border, clipped away from the background, makes the *visible*
thumb narrower than the strip while the whole strip stays a hit target — a
10-pixel bar that reads as a 4-pixel line and is still easy to grab. Drop the
`background-clip` and the border is painted instead: the inset disappears and
the bar is fat again.

The floor on the height exists because the thumb is drawn proportional to how
much of the document fits on screen. On a very long one it collapses to a few
pixels: visible, but not something a pointer can catch.

## What a stylesheet cannot do

Take the strip out of layout. Chromium removed `overflow: overlay` in version
114, and a bar styled through `::-webkit-scrollbar` always takes its width, so
the theme's bar is a transparent strip of 10 pixels rather than a stock 15: it
reads as drawn over the content and still moves the content when it appears.

The engine can do what a stylesheet cannot, if nothing styles its bar: a phone,
a Mac set to show bars while scrolling, and a desktop window that asks for it
all draw one that takes no width. So the theme stands aside where that is the
case, and it goes by a measure rather than by what a product says.

## A bar that takes no width

```tsx
import { overlayScrollbars } from 'dowel-ui'

overlayScrollbars()
```

Call it once, as the product starts, before the first render. It measures the
bar the engine draws. Where that takes no width, it sets
`data-scrollbars="overlay"` on the root: the theme's strip goes, and the bar is
coloured from `dim`. Anywhere else it does nothing and the strip stays, so every
product can make the same call, site or window.

A desktop window has to ask its engine as well. In a Tauri window on WebView2:

```json
{
  "app": {
    "windows": [
      {
        "additionalBrowserArgs": "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --enable-features=OverlayScrollbar"
      }
    ]
  }
}
```

This key replaces Tauri's defaults rather than adding to them, so the
`--disable-features` list has to stay; a window with a longer list of its own
keeps that one.

The bar is then the engine's: nothing at rest, a thin line while scrolling, and
under the pointer a wider thumb with the step arrows Windows gives it. It takes
no width at any of those moments, and `scrollbar-gutter: stable` has nothing to
reserve.

`OverlayScrollbar` is a switch inside Chromium, not a promise from it, and an
update of the runtime could drop it. That is what the measure is for: the bar
would take width again, the root would go unmarked, and the product would have
the theme's strip rather than a stock bar with arrows.

### Waking a sleeping bar

Left to itself this bar cannot be reached from rest. Once it has faded it answers
neither hover nor press: a press at the edge lands on the content, however the
pointer arrives. It can be taken for about half a second after a scroll, and a
pointer that gets there in time keeps it up.

So `overlayScrollbars()` shows it when a mouse comes within 48 pixels of a
scroller's edge, well before it gets there: the engine keeps a shown bar up only
for a pointer that moves onto it afterwards. A new bar comes up shown, and one frame of `overflow: hidden`
makes a new one. Nothing moves when it does: no scroll event, the same position,
the same width, since the bar took no width to begin with. A finger or a held
button does not set it off, and neither does a pointer that stays by a bar it is
already keeping up.

### Where there is no flag to pass

A site in a browser on Windows cannot ask, so it keeps the strip. Where a twitch
shows there are two ways through, and each is a decision about one scrolling
area:

- **[ScrollArea](/dowel/components/scroll-area/)** is a real overlay: the native
  bar is hidden, and a thumb is drawn over the content and takes no space.
- **`scrollbar-gutter: stable`** keeps the strip reserved whether or not anything
  scrolls, so nothing moves. The flow form of
  [`Screen`](/dowel/components/app-shell/) does this for a whole page.

## Under a strict Content-Security-Policy

A desktop window's policy carries hashes, and a hash switches `'unsafe-inline'`
off. Base UI hides the native bar of a ScrollArea with a `<style>` it writes at
run time, the browser refuses that element without a word, and the native bar
comes back beside the overlay one. The theme carries the same rule, so it
arrives with the bundle. To stop Base UI writing the element at all, and the
console reporting it refused:

```tsx
import { CSPProvider } from '@base-ui/react/csp-provider'

<CSPProvider disableStyleElements>
  <App />
</CSPProvider>
```

Nothing in the set renders a `<style>` of its own, and a gate holds it to that.

## What is deliberately not here

**No setting.** A scrollbar is chrome, and the products of the line do not offer
their chrome as a preference.

**No component to import for the ordinary bar.** The rules are on `*`, so a
scrollable area a product writes itself gets them without asking.

## How it is checked

In a real browser, with the bars shown. Playwright launches Chromium with
`--hide-scrollbars`, which is why a headless run reads `offsetWidth -
clientWidth` as zero for any stylesheet at all; without that flag it is 10 here.
The gate measures that strip, that the standard properties stay off in Chromium,
and that a utility and Base UI's class take the bar away.

The engine's own bar is measured the same way, in a browser started with the
flag and in one without. The first must read no width once told, the second must
keep the strip, and a mouse is walked up to a bar that has gone to sleep: with the
wake it takes the thumb, and without it the press lands on the content. Should an
engine start waking the bar by itself, that control goes red and the wake can go.
Every grab is read beside the width, because a mode that quietly went back to a
classic bar also lets every press land.
