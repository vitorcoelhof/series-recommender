import { parseSeriesList } from '../parser'

describe('parseSeriesList', () => {
  it('parses arrow format (1→Title)', () => {
    const input = '1→Breaking Bad\n2→Prison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('parses dot format (1. Title)', () => {
    const input = '1. Breaking Bad\n2. Prison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('ignores empty lines', () => {
    const input = '1→Breaking Bad\n\n2→Prison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('handles plain text lines (no prefix)', () => {
    const input = 'Breaking Bad\nPrison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('trims whitespace', () => {
    const input = '1→  Breaking Bad  \n2→  Prison Break  '
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('returns empty array for empty string', () => {
    expect(parseSeriesList('')).toEqual([])
  })
})
