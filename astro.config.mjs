// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

export default defineConfig({
	site: 'https://example.com',
	output: 'hybrid',
	adapter: netlify(),
	integrations: [mdx(), sitemap(), react()],
});