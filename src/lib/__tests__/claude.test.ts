import { getSeriesRecommendation } from '../claude'

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: '{"title":"The Wire","reason":"Similar to Breaking Bad in its depth."}',
      }),
    },
  })),
}))

describe('getSeriesRecommendation', () => {
  it('returns recommendation with title and reason', async () => {
    const watched = ['Breaking Bad', 'Prison Break']
    const topTen = [
      { title: 'Breaking Bad', genres: ['Crime', 'Drama'], imdbRating: '9.5' },
      { title: 'Prison Break', genres: ['Drama', 'Thriller'], imdbRating: '8.3' },
    ]

    const result = await getSeriesRecommendation(watched, topTen as any)

    expect(result).toEqual({ title: 'The Wire', reason: 'Similar to Breaking Bad in its depth.' })
  })
})
