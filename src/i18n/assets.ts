import type {Locale} from './index';

export type AssetsKeys = 'heading' | 'learnMore';

type Dict = Record<AssetsKeys, string>;

export const ASSETS_DICT: Record<Locale, Dict> = {
    en: {
        heading: 'Our Assets',
        learnMore: 'Learn more',
    },
    ja: {
        heading: '公開中アセット',
        learnMore: '詳細を見る',
    },
} as const;
