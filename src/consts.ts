// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Fish Dolls';
export const SITE_DESCRIPTION = 'Welcome to my website!';

export const LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
