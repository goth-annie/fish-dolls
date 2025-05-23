// @ts-check
import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: '/gothannie.github.io/',
    integrations: [
        mdx(),
        sitemap(),
    ],
});
