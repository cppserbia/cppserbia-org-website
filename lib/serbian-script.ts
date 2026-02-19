import { defaultSerbianScript, type SerbianScript } from '@/i18n/config';

export function getSerbianScriptClient(): SerbianScript {
  if (typeof document === 'undefined') return defaultSerbianScript;
  const match = document.cookie.match(/(?:^|;\s*)sr-script=(\w+)/);
  return (match?.[1] as SerbianScript) || defaultSerbianScript;
}

export function setSerbianScriptCookie(script: SerbianScript): void {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `sr-script=${script};path=/;max-age=${maxAge};SameSite=Lax`;
}
