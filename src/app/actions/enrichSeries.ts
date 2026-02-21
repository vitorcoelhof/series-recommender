'use server'

import { fetchSeriesData, type SeriesData } from '@/lib/omdb'

export async function enrichSeries(titles: string[]): Promise<SeriesData[]> {
  const results = await Promise.allSettled(titles.map((t) => fetchSeriesData(t)))

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
    return {
      title: titles[i],
      imdbRating: 'N/A',
      genres: [],
      poster: '',
      year: '',
      imdbId: '',
      found: false,
    }
  })
}
