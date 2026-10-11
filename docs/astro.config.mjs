// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	vite: {
		resolve: {
			alias: {
				// What a copied component imports; here it is the source next door.
				'dowel-ui/marks': new URL('../packages/dowel/src/marks.ts', import.meta.url).pathname,
				'dowel-ui': new URL('../packages/dowel/src/index.ts', import.meta.url).pathname,
			},
		},
	},
	site: 'https://lacodda.github.io',
	base: '/dowel',
	integrations: [
		starlight({
			title: 'dowel',
			description: 'The lacodda line design system: theme tokens and React primitives, distributed as a shadcn-compatible registry.',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'dowel',
			},
			favicon: '/favicon.svg',
			customCss: ['./src/styles/brand.css'],
			// Every component and block page ends with the history of its
			// file, drawn once here rather than remembered by each page.
			components: { MarkdownContent: './src/components/MarkdownContent.astro' },
			routeMiddleware: './src/route-data.ts',
			head: [
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/dowel/apple-touch-icon.png' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://raw.githubusercontent.com/lacodda/dowel/main/assets/social-preview.png' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/lacodda/dowel' }],
			editLink: {
				baseUrl: 'https://github.com/lacodda/dowel/edit/main/docs/',
			},
			sidebar: [
				{ label: 'Getting Started', slug: 'getting-started' },
				// The stand is the other half of this site: the documentation
				// explains a component, the stand shows it. Every page should
				// have the door to it, not only the ones that remember.
				{ label: 'The stand ↗', link: '/stand/', attrs: { class: 'stand-nav-link' } },
				// The blocks at work: a small product made of them.
				{ label: 'The demo ↗', link: '/demo/', attrs: { class: 'stand-nav-link' } },
				{
					label: 'Components',
					items: [{ autogenerate: { directory: 'components' } }],
				},
				// Screens made of the components, which a product copies to
				// change rather than to keep.
				{
					label: 'Blocks',
					items: [{ autogenerate: { directory: 'blocks' } }],
				},
				{
					label: 'Guides',
					items: [{ autogenerate: { directory: 'guides' } }],
				},
				{
					label: 'Concepts',
					items: [{ autogenerate: { directory: 'concepts' } }],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
		}),
		mdx(),
	],
});
