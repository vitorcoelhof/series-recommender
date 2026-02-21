'use server'

import { getRecommendations, type RecommendationItem } from '@/lib/claude'
import { fetchSeriesData, type SeriesData } from '@/lib/omdb'
import { fetchStreamingAvailability } from '@/lib/justwatch'

export interface RecommendationItemWithData extends RecommendationItem {
  seriesData: SeriesData | null
  streamingServices: string[]
}

export interface RecommendationWithData {
  series: RecommendationItemWithData[]
  movies: RecommendationItemWithData[]
}

async function enrichItem(item: RecommendationItem): Promise<RecommendationItemWithData> {
  const [seriesData, streamingServices] = await Promise.all([
    fetchSeriesData(item.title).catch(() => null),
    fetchStreamingAvailability(item.title),
  ])
  return { ...item, seriesData, streamingServices }
}

export async function getRecommendationAction(
  watchedTitles: string[],
  topTen: Pick<SeriesData, 'title' | 'genres' | 'imdbRating'>[]
): Promise<RecommendationWithData> {
  try {
    console.log('[getRecommendationAction] GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY)
    const recommendations = await getRecommendations(watchedTitles, topTen)
    console.log('[getRecommendationAction] Gemini returned series:', recommendations.series.length, 'movies:', recommendations.movies.length)

    const [series, movies] = await Promise.all([
      Promise.all(recommendations.series.map(enrichItem)),
      Promise.all(recommendations.movies.map(enrichItem)),
    ])

    return { series, movies }
  } catch (e) {
    console.error('[getRecommendationAction] ERROR:', e)
    throw e
  }
}
