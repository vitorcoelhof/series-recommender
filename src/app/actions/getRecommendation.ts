'use server'

import { getRecommendations, type RecommendationItem } from '@/lib/claude'
import { fetchSeriesData, type SeriesData } from '@/lib/omdb'
import { fetchStreamingAvailability } from '@/lib/justwatch'
import { toEnglishTitle } from '@/lib/title-map'

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
  favorites: string[]
): Promise<RecommendationWithData> {
  const englishWatched = watchedTitles.map(toEnglishTitle)
  const englishFavorites = favorites.map(toEnglishTitle)
  const recommendations = await getRecommendations(englishWatched, englishFavorites)

  const [series, movies] = await Promise.all([
    Promise.all(recommendations.series.map(enrichItem)),
    Promise.all(recommendations.movies.map(enrichItem)),
  ])

  return { series, movies }
}
