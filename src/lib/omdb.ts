export interface SeriesData {
  title: string
  imdbRating: string
  genres: string[]
  poster: string
  year: string
  imdbId: string
  found: boolean
}

export async function fetchSeriesData(title: string): Promise<SeriesData> {
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&type=series&apikey=${process.env.OMDB_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.Response === 'False') {
    return { title, imdbRating: 'N/A', genres: [], poster: '', year: '', imdbId: '', found: false }
  }

  return {
    title: data.Title,
    imdbRating: data.imdbRating,
    genres: data.Genre ? data.Genre.split(', ') : [],
    poster: data.Poster !== 'N/A' ? data.Poster : '',
    year: data.Year,
    imdbId: data.imdbID,
    found: true,
  }
}
