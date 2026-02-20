import { describe, it, expect } from 'vitest';
import { cyrillicToLatin, transliterateMessages } from './transliterate';

describe('cyrillicToLatin', () => {
  it('transliterates simple Serbian Cyrillic text', () => {
    expect(cyrillicToLatin('Србија')).toBe('Srbija');
  });

  it('handles digraphs correctly', () => {
    expect(cyrillicToLatin('Љубав')).toBe('Ljubav');
    expect(cyrillicToLatin('Њушка')).toBe('Njuška');
    expect(cyrillicToLatin('Џеп')).toBe('Džep');
  });

  it('preserves ASCII text unchanged', () => {
    expect(cyrillicToLatin('C++ Serbia')).toBe('C++ Serbia');
    expect(cyrillicToLatin('https://example.com')).toBe('https://example.com');
  });

  it('handles mixed Cyrillic and ASCII text', () => {
    expect(cyrillicToLatin('C++ Србија заједница')).toBe('C++ Srbija zajednica');
  });

  it('handles empty string', () => {
    expect(cyrillicToLatin('')).toBe('');
  });

  it('handles all Serbian-specific characters', () => {
    expect(cyrillicToLatin('ЂђЋћЏџ')).toBe('ĐđĆćDždž');
    expect(cyrillicToLatin('ЖжШшЧч')).toBe('ŽžŠšČč');
  });

  it('handles uppercase digraphs', () => {
    expect(cyrillicToLatin('ЉЊЏ')).toBe('LjNjDž');
  });
});

describe('transliterateMessages', () => {
  it('transliterates string values in a flat object', () => {
    const input = { greeting: 'Здраво', name: 'Свет' };
    const result = transliterateMessages(input);
    expect(result).toEqual({ greeting: 'Zdravo', name: 'Svet' });
  });

  it('transliterates nested objects', () => {
    const input = { nav: { home: 'Почетна', events: 'Догађаји' } };
    const result = transliterateMessages(input);
    expect(result).toEqual({ nav: { home: 'Početna', events: 'Događaji' } });
  });

  it('preserves non-string values', () => {
    const input = { count: 42 as unknown, active: true as unknown };
    const result = transliterateMessages(input as Record<string, unknown>);
    expect(result).toEqual({ count: 42, active: true });
  });

  it('handles mixed ASCII and Cyrillic in values', () => {
    const input = { title: 'C++ Србија заједница' };
    const result = transliterateMessages(input);
    expect(result).toEqual({ title: 'C++ Srbija zajednica' });
  });
});
