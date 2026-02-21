'use server'

import { getSeriesRecommendation, type Recommendation } from '@/lib/claude'
import { fetchSeriesData, type SeriesData } from '@/lib/omdb'

export interface RecommendationWithData extends Recommendation {
  seriesData: SeriesData | null
}

export async function getRecommendationAction(
  watchedTitles: string[],
  topTen: Pick<SeriesData, 'title' | 'genres' | 'imdbRating'>[]
): Promise<RecommendationWithData> {
  const recommendation = await getSeriesRecommendation(watchedTitles, topTen)
  const seriesData = await fetchSeriesData(recommendation.title).catch(() => null)

  return { ...recommendation, seriesData }
}
