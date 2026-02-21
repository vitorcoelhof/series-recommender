export function parseSeriesList(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.replace(/^\d+[→.]\s*/, '').trim())
    .filter((line) => line.length > 0)
}
