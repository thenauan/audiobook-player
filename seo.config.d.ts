import type { Plugin } from 'vite';
export declare const SITE_URL = "https://thenauan.github.io/audiobook-player/";
type Lang = 'pt' | 'en' | 'es' | 'ru' | 'ar';
interface SeoText {
    htmlLang: string;
    ogLocale: string;
    dir?: 'rtl';
    path: string;
    title: string;
    description: string;
    keywords: string;
    noscript: string;
}
export declare const SEO: Record<Lang, SeoText>;
export declare function seoPlugin(): Plugin;
export {};
