/** 利用可能なロケール */
export const LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
