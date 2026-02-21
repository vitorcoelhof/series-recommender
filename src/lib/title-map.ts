/**
 * Maps localized (Portuguese/Spanish) series titles to their English OMDb titles.
 * Keys are case-insensitive matched.
 */
const TITLE_MAP: Record<string, string> = {
  'pinguim': 'The Penguin',
  'demolidor': 'Daredevil',
  'o justiceiro': 'The Punisher',
  'o atirador': 'Shooter',
  'la casa de papel': 'Money Heist',
  'dexter: ressureição': 'Dexter: New Blood',
  'dexter: pecado original': 'Dexter: Original Sin',
  'dr house': 'House M.D.',
  'blacklist': 'The Blacklist',
}

export function toEnglishTitle(title: string): string {
  return TITLE_MAP[title.toLowerCase()] ?? title
}
