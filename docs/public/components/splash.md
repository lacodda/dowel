# Splash

Source: https://lacodda.github.io/dowel/components/splash

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#splash

The full picture inside a box, sweeping and still, with and without the two lines only the application can say.

## Notes

A desktop product has a second or two between the window appearing and the
first screen being ready — a workspace to open, a database to migrate, a
plugin to start — and a blank window for that long reads as a crash. So the
window shows the product instead.

```tsx
<Splash
  mark={<Mark />}
  name="kilna"
  tagline={t('app.tagline')}
  version={`v${__APP_VERSION__}`}
  status={t('splash.opening')}
  tip={t('splash.tip')}
/>
```

**It is a status region.** `role="status"` with a polite live region, so the
`status` line is announced when it changes and nothing about the panel asks
for an answer. It is not a dialog: the reader cannot act on it.

**The sweep stops honestly under reduced motion.** The theme halts every
animation for `prefers-reduced-motion`, which on its own would leave the sweep
parked off the end of its track — an empty bar. The bar is drawn full and
still instead, and the same when `busy` is `false`: waiting on a person has
no progress to show.

**The keyframes travel with the component.** A product installs the theme on
its first day and a splash once, so the sweep is a `<style>` the component
renders rather than a keyframe in the theme.

**Only the lines you give are drawn.** An empty `<p>` still takes its height,
and the picture below has no such line — the name would jump when React took
over.

## The other half: before the bundle

This component cannot be the first thing the window shows, because React is
what is still loading. So the page paints the same picture in inline CSS —
inline, because the stylesheet arrives with the bundle, which is the thing
being waited for — and the component takes over on its first render with the
same geometry, so nothing moves:

```tsx
useEffect(() => {
  document.getElementById('splash')?.remove()
}, [])
```

The static half, in `index.html`. The two backgrounds are the theme's dark
and light written out, since the theme file is in that same bundle; a stored
explicit theme is applied by the page a moment later and the splash follows it
through the classes on `<html>`:

```html
<style>
  html { background: #141216; color: #e8e3ec; }
  @media (prefers-color-scheme: light) {
    html { background: #f7f5f9; color: #221c27; }
  }
  html.dark { background: #141216; color: #e8e3ec; }
  html.light { background: #f7f5f9; color: #221c27; }
  #splash {
    position: fixed; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; user-select: none;
    font-family: 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif;
  }
  #splash .mark { width: 56px; height: 56px; margin-bottom: 6px; }
  #splash .name { font-size: 26px; font-weight: 600; letter-spacing: 0.02em; line-height: 1; }
  #splash .tagline { font-size: 13px; opacity: 0.62; }
  #splash .version { margin-top: 6px; font-family: Consolas, ui-monospace, monospace; font-size: 11px; opacity: 0.45; }
  #splash .bar {
    position: relative; width: 160px; height: 2px; margin-top: 18px;
    border-radius: 999px; background: rgba(128, 128, 128, 0.18); overflow: hidden;
  }
  #splash .bar::after {
    content: ''; position: absolute; top: 0; left: -40%; width: 40%; height: 100%;
    border-radius: 999px; background: #d9569e;
    animation: splash-sweep 1.1s ease-in-out infinite;
  }
  @keyframes splash-sweep { to { left: 100%; } }
  @media (prefers-reduced-motion: reduce) {
    #splash .bar::after { animation: none; left: 0; width: 100%; }
  }
</style>

<div id="splash" aria-hidden="true">
  <svg class="mark" viewBox="0 0 32 32">…</svg>
  <div class="name">kilna</div>
  <div class="tagline">From raw idea to shipped work.</div>
  <div class="version">v__APP_VERSION__</div>
  <div class="bar"></div>
</div>
<div id="root"></div>
```

The raw colours are allowed there and nowhere else: this is the one file that
runs before the theme exists. `aria-hidden` because the React half is the one
that speaks; two status regions saying the same thing would be announced
twice.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `mark` | `ReactNode` | | The product's mark, drawn at 56px |
| `name` | `string` | | Required |
| `tagline` | `string` | | |
| `version` | `string` | | Drawn in the mono face; the `v` is yours |
| `status` | `string` | | What the application is doing, announced |
| `tip` | `string` | | One thing worth knowing |
| `busy` | `boolean` | `true` | `false` draws the bar full and still |
| `className` | `string` | | Merged so the caller wins a conflict — `absolute` puts it in a box |
