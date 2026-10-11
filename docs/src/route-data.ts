import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import { itemOfPage, releasesOf } from './lib/history'

/*
 * The history at the foot of a component or block page is drawn by the
 * MarkdownContent override, outside the markdown Starlight reads its
 * contents from - so it is added to the page's table of contents here, and
 * only where it is drawn.
 */
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute
  const item = itemOfPage(route.id)
  if (!item || releasesOf(item.name).length === 0 || !route.toc) return
  route.toc.items.push({ depth: 2, slug: 'history', text: 'History', children: [] })
})
