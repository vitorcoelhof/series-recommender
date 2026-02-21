import { GoogleGenAI } from '@google/genai'
import type { SeriesData } from './omdb'

export interface Recommendation {
  title: string
  reason: string
}

export async function getSeriesRecommendation(
  watchedTitles: string[],
  topTen: Pick<SeriesData, 'title' | 'genres' | 'imdbRating'>[]
): Promise<Recommendation> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const topTenFormatted = topTen
    .map((s) => `- ${s.title} (${s.genres.join(', ')}) — IMDB: ${s.imdbRating}`)
    .join('\n')

  const prompt = `Você é um especialista em séries de TV.

O usuário já assistiu estas séries: ${watchedTitles.join(', ')}.

Os 10 favoritos do usuário são:
${topTenFormatted}

Recomende UMA série que o usuário ainda não assistiu.
A série NÃO pode estar na lista de séries já assistidas.
Justifique em 2-3 frases baseando-se nos padrões do top 10.

Responda APENAS em JSON válido, sem markdown, sem explicações:
{"title": "Nome da Série", "reason": "Justificativa..."}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  })

  if (!response.text) throw new Error('Empty response from Gemini')

  const text = response.text
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  try {
    return JSON.parse(text) as Recommendation
  } catch {
    throw new Error(`Failed to parse recommendation JSON: ${text}`)
  }
}
