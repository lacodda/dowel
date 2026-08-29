// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
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
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/lacodda/dowel' }],
			editLink: {
				baseUrl: 'https://github.com/lacodda/dowel/edit/main/docs/',
			},
			sidebar: [
				{ label: 'Getting Started', slug: 'getting-started' },
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
	],
});
