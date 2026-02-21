'use server'

import { fetchSeriesData, type SeriesData } from '@/lib/omdb'
import { toEnglishTitle } from '@/lib/title-map'

export async function enrichSeries(titles: string[]): Promise<SeriesData[]> {
  const results = await Promise.allSettled(
    titles.map((t) => fetchSeriesData(toEnglishTitle(t)))
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      // Preserve the original title the user knows (e.g. "Pinguim"), not the English lookup title
      return { ...result.value, title: result.value.found ? result.value.title : titles[i] }
    }
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
