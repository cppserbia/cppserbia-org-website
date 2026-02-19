import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { routing } from './routing';
import { defaultSerbianScript, type SerbianScript } from './config';
import { transliterateMessages } from '@/lib/transliterate';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  const messages = (await import(`../messages/${locale}.json`)).default;

  if (locale === 'sr') {
    const cookieStore = await cookies();
    const scriptCookie = cookieStore.get('sr-script')?.value as SerbianScript | undefined;
    const script = scriptCookie || defaultSerbianScript;

    if (script === 'latin') {
      return {
        locale,
        messages: transliterateMessages(messages),
      };
    }
  }

  return {
    locale,
    messages,
  };
});
