import { getRecommendations } from '../claude'

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: '{"series":[{"title":"The Wire","reason":"Similar to Breaking Bad."}],"movies":[{"title":"Sicario","reason":"Crime drama."}]}',
      }),
    },
  })),
}))

describe('getRecommendations', () => {
  it('returns series and movies recommendations', async () => {
    const watched = ['Breaking Bad', 'Prison Break']
    const topTen = [
      { title: 'Breaking Bad', genres: ['Crime', 'Drama'], imdbRating: '9.5' },
      { title: 'Prison Break', genres: ['Drama', 'Thriller'], imdbRating: '8.3' },
    ]

    const result = await getRecommendations(watched, topTen as any)

    expect(result.series[0]).toEqual({ title: 'The Wire', reason: 'Similar to Breaking Bad.' })
    expect(result.movies[0]).toEqual({ title: 'Sicario', reason: 'Crime drama.' })
  })
})
