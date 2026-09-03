import { readFileSync, writeFileSync } from 'node:fs'

/*
 * One 404 page for a site with two applications under it.
 *
 * GitHub Pages serves the 404 at the site root for every miss anywhere on the
 * site - `/dowel/stand/button` included - and it is the documentation's own
 * Starlight page. So the stand's routes came back as the docs' "page not
 * found", which is worse than a plain 404: it looks like the link was wrong
 * rather than like the server does not know about client-side routes.
 *
 * A stand `404.html` next to the stand does not help, because Pages never
 * looks there. The root is the only 404 there is, so the root is where the
 * decision has to be made: a path under the stand hands control to the stand's
 * own index, and anything else keeps the documentation's page exactly as
 * Starlight built it.
 *
 * The redirect runs before the body renders and uses `location.replace`, so
 * the failed URL does not become a history entry the back button lands on.
 */

const root = new URL('../docs/dist/', import.meta.url)
const page = new URL('404.html', root)

/** Where the stand is mounted, matching `base` in the stand's Vite config. */
const STAND = '/dowel/stand/'

const redirect = `<script>
(function () {
  var path = location.pathname;
  if (path.indexOf(${JSON.stringify(STAND)}) === 0) {
    // Hand the route to the stand, which reads it out of the address bar. The
    // path is preserved, so a deep link lands on the component it names.
    sessionStorage.setItem('dowel.stand.redirect', path + location.search + location.hash);
    location.replace(${JSON.stringify(STAND)});
  }
})();
</script>`

const html = readFileSync(page, 'utf8')

// Into `<head>`, so it runs before the documentation's 404 paints. Appending
// to the body would show the wrong page first and then move.
const marked = html.replace('</head>', `${redirect}</head>`)
if (marked === html) throw new Error('404.html has no </head>; the docs build changed shape')

writeFileSync(page, marked)
console.log('404: stand routes hand off to the stand')
