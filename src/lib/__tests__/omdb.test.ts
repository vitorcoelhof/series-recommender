import { fetchSeriesData } from '../omdb'

global.fetch = jest.fn()

describe('fetchSeriesData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns series data when found', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        Response: 'True',
        Title: 'Breaking Bad',
        imdbRating: '9.5',
        Genre: 'Crime, Drama, Thriller',
        Poster: 'https://example.com/poster.jpg',
        Year: '2008–2013',
        imdbID: 'tt0903747',
      }),
    })

    const result = await fetchSeriesData('Breaking Bad')

    expect(result).toEqual({
      title: 'Breaking Bad',
      imdbRating: '9.5',
      genres: ['Crime', 'Drama', 'Thriller'],
      poster: 'https://example.com/poster.jpg',
      year: '2008–2013',
      imdbId: 'tt0903747',
      found: true,
    })
  })

  it('returns not-found result when series does not exist', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ Response: 'False', Error: 'Movie not found!' }),
    })

    const result = await fetchSeriesData('Serie Inexistente')

    expect(result.found).toBe(false)
    expect(result.title).toBe('Serie Inexistente')
  })

  it('handles N/A poster as empty string', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        Response: 'True',
        Title: 'Test',
        imdbRating: '7.0',
        Genre: 'Drama',
        Poster: 'N/A',
        Year: '2020',
        imdbID: 'tt1234567',
      }),
    })

    const result = await fetchSeriesData('Test')
    expect(result.poster).toBe('')
  })
})
