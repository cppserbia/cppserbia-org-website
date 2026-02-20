import type { SerbianScript } from '@/i18n/config';

export function getDateLocale(locale: string, serbianScript?: SerbianScript): string {
  if (locale === 'sr') {
    return serbianScript === 'latin' ? 'sr-Latn' : 'sr-Cyrl';
  }
  return 'en-US';
}
