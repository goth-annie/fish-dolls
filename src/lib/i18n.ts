import type {Locale} from '../i18n/index';

/**
 * 指定辞書とロケールから t() を生成
 * @param dict  Record<Locale, Dict> 型の辞書（ページごと）
 * @param lang  'en' | 'ja'
 */
export function createT<T extends Record<string, string>>(
    dict: Record<Locale, T>,
    lang: Locale
) {
    const map = dict[lang];
    return (key: keyof T) => map[key];
}
