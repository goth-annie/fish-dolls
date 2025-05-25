// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://goth-annie.github.io/fish-dolls',
	base:'/fish-dolls',
	integrations: [mdx(), sitemap()],
});
