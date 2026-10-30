# Palettes for native products

Source: https://lacodda.github.io/dowel/reference/palettes

The theme derives most of its colours. `--bg`, `--text`, `--accent-2` and the
rest are `color-mix()` and `oklch(from …)` expressions over a product's accent,
and they have no value until a browser evaluates them. A web product never
notices. A native one does: nitid draws its interface with egui on top of wgpu,
and a Tauri window has to be given a background colour before its WebView has
painted anything.

So the package ships the answer as well as the question: one file per product,
every colour of the theme in both themes, as the browser computed it - as JSON,
and the same values as a Rust module.

```text
dowel-ui/palettes/<product>.json
dowel-ui/rust/<product>.rs
```

## What is in a file

Design Tokens Format Module 2025.10, one colour group with a `dark` and a
`light` theme, and the package version the values were resolved from:

```json
{
  "$extensions": {
    "com.lacodda.dowel": {
      "package": "dowel-ui",
      "version": "0.30.0",
      "product": "nitid",
      "code": "nd",
      "accent": "#3FA9D9"
    }
  },
  "color": {
    "$type": "color",
    "dark": {
      "bg": { "$value": "#171b20" },
      "soft": { "$value": "#ffffff0b" },
      "accent": { "$value": "#3fa9d9" },
      "on-accent": { "$value": "#000000" }
    },
    "light": {}
  }
}
```

- **Every colour the theme declares** is there, under its token name without
  the `--`: grounds, hairlines, ink, the accent and its partners, status and
  their soft fills and `on-` inks, series, scale, heat, syntax, chart
  furniture. The parameters (`accent-base`, `neutral-base`, `ground`, `ink`)
  are not — they are inputs, and `accent` is what the theme makes of them.
- **Translucent colours keep their alpha** as `#rrggbbaa`. `soft`, `line` and
  every `-soft` are meant to be composited over a surface, exactly as on the
  web; flattening them would paint a slab.
- **Eight bits per channel.** That is what a browser keeps for alpha too, so
  nothing finer is lost.

## How it is made

`theme.css` is the only place a token is defined. `tools/build-tokens.mjs`
reads it once and writes every other form from that one reading: `tokens.json`
(the scales), `accents/<product>.css`, `palettes/<product>.json` and
`rust/<product>.rs`. For the palettes it loads the theme into Chromium once per
product, theme and contrast mode, and writes down the computed colour of every
custom property. The formulas stay in `theme.css`; there is no second
implementation of `color-mix` anywhere to drift from the first. The tests paint
each colour into a canvas by a separate route and compare the pixel, so a
mistake in turning the browser's `oklab()` into hex cannot hide - and they
compile every Rust module with `rustc` and compare what it holds with the JSON.

## Using it from a Rust product

`rust/<product>.rs` is the palette and the scales as Rust: a `Palette` struct
with a field per colour, the four modes as constants (`DARK`, `LIGHT`,
`DARK_CONTRAST_MORE`, `LIGHT_CONTRAST_MORE`), and modules for `radius`, `text`,
`font_weight`, `icon`, `duration`, `easing` and `layer`. It names no colour
type, because the products of the line need not share a toolkit; include it
where you say what a colour is:

```rust
mod dowel {
    pub type Color = egui::Color32;
    const fn rgba(r: u8, g: u8, b: u8, a: u8) -> Color {
        egui::Color32::from_rgba_unmultiplied_const(r, g, b, a)
    }
    include!("../assets/dowel/nitid.rs");
}

let ground = dowel::DARK.bg;
let corner = dowel::radius::MD;
```

`Color` has to be `Copy`, `Debug` and `PartialEq`; `[u8; 4]` will do. The
colours are unmultiplied RGBA, as the JSON writes them.

1. Copy `rust/<product>.rs` from the `dowel-ui` release you are adopting. Its
   `VERSION` constant names the release.
2. Keep a check that the vendored copy is byte-for-byte the one published at
   that version, so an edit by hand is caught rather than shipped.

## Using the JSON from anything else

The same values, for a toolkit that is not Rust: copy `palettes/<product>.json`
(and `tokens.json`, for radius, type and motion) from the release you are
adopting, and generate constants from it at build time. The file, not your
code, is where a colour lives.

There is no crate. The Rust module is what one would hold; it becomes a crate
once a second native product of the line needs it, and the module's shape is
the crate's.
