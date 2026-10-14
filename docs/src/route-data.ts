import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import { itemOfPage, releasesOf } from './lib/history'
import { reports } from './lib/accessibility'

/*
 * What axe found and the history, at the foot of a component or block page,
 * are drawn by the MarkdownContent override, outside the markdown Starlight
 * reads its contents from - so they are added to the page's table of
 * contents here, and only where they are drawn.
 */
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute
  const item = itemOfPage(route.id)
  if (!item || !route.toc) return
  if (reports.has(item.name)) {
    route.toc.items.push({ depth: 2, slug: 'accessibility', text: 'Accessibility', children: [] })
  }
  if (releasesOf(item.name).length > 0) {
    route.toc.items.push({ depth: 2, slug: 'history', text: 'History', children: [] })
  }
})
