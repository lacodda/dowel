import { Row } from '../row'

/*
 * Rendered markdown, as HTML rather than as JSX.
 *
 * Written as a string and handed to `dangerouslySetInnerHTML` on purpose: the
 * whole point of `prose.css` is the case where a product does NOT author the
 * markup - it comes out of `marked`, out of a CMS, out of a model - and JSX
 * here would be the one shape the stylesheet never has to face.
 *
 * Every tag a markdown renderer emits is in it, so a selector that stopped
 * matching shows up as one element drawn in the browser's default rather than
 * as nothing at all.
 */
const renderedMarkdown = `
<h1>A quantity over time</h1>
<p>A <strong>line chart</strong> says the value <em>existed the whole time</em>
and was sampled - a balance, a price, a temperature. Drawing a sum as a line
claims readings nobody took. See <a href="#line-chart">LineChart</a>, or the
<code>boundsOf</code> helper beside it.</p>
<h2>What a hole means</h2>
<blockquote>Interpolating across a gap invents a reading; closing it up moves
every later point. Both are quieter than the truth.</blockquote>
<ul>
  <li>A run of one point is still a measurement.</li>
  <li>The floor is not zero unless the caller says so.
    <ul><li>For a count, state <code>min: 0</code>.</li></ul>
  </li>
</ul>
<h3>Ticks</h3>
<ol>
  <li>Round numbers, not the range cut into equal parts.</li>
  <li>A range too narrow gets none rather than invented ones.</li>
</ol>
<pre><code>const bounds = boundsOf(points, { min: 0 })
runs(points, bounds)      // the drawable stretches
ticksFor(bounds, 4)       // [0, 10, 20, 30]</code></pre>
<table>
  <thead><tr><th>Token</th><th>What it carries</th></tr></thead>
  <tbody>
    <tr><td><code>--series-*</code></td><td>Identity: which line is which</td></tr>
    <tr><td><code>--heat-*</code></td><td>Magnitude, in five steps</td></tr>
    <tr><td><code>--syntax-*</code></td><td>The eight kinds in a piece of code</td></tr>
  </tbody>
</table>
<h4>A heading below the scale</h4>
<p>Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to open the palette. A value that is
<s>no longer true</s> is struck through, and <mark>this is marked</mark>.</p>
<hr>
<dl>
  <dt>Sequential</dt><dd>A continuous magnitude, read as more and less.</dd>
  <dt>Ordinal</dt><dd>Steps told apart at a glance and counted against a legend.</dd>
</dl>
<p>A footnote hangs here.<sup><a href="#fn1">1</a></sup></p>
<section class="footnotes"><p id="fn1">1. Smaller and dimmer, because a
footnote at the weight of the text interrupts the sentence carrying it.</p></section>
`

export function ProseSection() {
  return (
    <>
      <Row label="rendered markdown - every tag a renderer emits, through one class">
        <div className="rounded-lg border border-line bg-raise p-5">
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
        </div>
      </Row>

      <Row label="prose-tight in a bubble - the same rules, rhythm compressed, measure given up">
        <div className="w-88 rounded-lg border border-line bg-raise p-3">
          <div
            className="prose prose-tight"
            dangerouslySetInnerHTML={{
              __html: `<h2>What changed</h2><p>The floor is <strong>not zero</strong>
              unless you say so - see <code>bounds</code>.</p>
              <ul><li>A hole breaks the line.</li><li>Ticks land on round numbers.</li></ul>`,
            }}
          />
        </div>
      </Row>

      <Row label="the measure - prose is capped in characters, whatever the container gives it">
        <div className="w-full rounded-lg border border-line bg-raise p-5">
          <div
            className="prose"
            dangerouslySetInnerHTML={{
              __html: `<p>This paragraph sits in a container as wide as the stand,
              and stops at 68 characters anyway. Prose across a wide window is
              unreadable: the eye loses the line it is returning from, and the
              limit is stated in the unit it is actually about.</p>`,
            }}
          />
        </div>
      </Row>
    </>
  )
}
