import type {Locale} from './index';

/* Home ページで使用するキー */
export type HomeKeys = 'title' | 'intro';

type Dict = Record<HomeKeys, string>;

/* 言語別辞書 */
export const HOME_DICT: Record<Locale, Dict> = {
    en: {
        title: 'Welcome',
        intro: 'Build smarter games with our tools.',
    },
    ja: {
        title: 'ようこそ',
        intro: '私たちのツールで賢くゲーム制作を。',
    },
} as const;
