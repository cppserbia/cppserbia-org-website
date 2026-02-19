export const locales = ['en', 'sr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export type SerbianScript = 'cyrillic' | 'latin';
export const defaultSerbianScript: SerbianScript = 'cyrillic';
