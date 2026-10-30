/*
 * An accent file per product of the line: `accents/<product>.css`.
 *
 * Each is one declaration. That is the whole point: a product's theme is its
 * mark's colour, so the only thing it should have to state is which product it
 * is - not a palette, not a pair of accent shades, not what colour text goes
 * on top. The theme derives all of that.
 *
 *   @import 'dowel-ui/theme.css';
 *   @import 'dowel-ui/accents/kilna.css';
 *
 * Generated rather than written, so the fourteen files cannot disagree with
 * the registry or with each other.
 */
/** The accent file of one product: `accents/<product>.css`. */
export function accentCss({ name, code, accent, colorName }) {
  return `/*
 * ${name} - ${colorName} ${accent}, the colour of its mark (${code}).
 *
 * Import after the theme. Everything else - the hover shade, the soft fill,
 * the focus ring, the colour of text on an accent fill, and the trace of the
 * hue the greys carry - is derived from this one value.
 */
:root {
  --accent-base: ${accent};
}
`
}
