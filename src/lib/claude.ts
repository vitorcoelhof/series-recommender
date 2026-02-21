import Anthropic from '@anthropic-ai/sdk'
import type { SeriesData } from './omdb'

export interface Recommendation {
  title: string
  reason: string
}

export async function getSeriesRecommendation(
  watchedTitles: string[],
  topTen: Pick<SeriesData, 'title' | 'genres' | 'imdbRating'>[]
): Promise<Recommendation> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error(`Unexpected content type: ${block.type}`)

  // Strip markdown fences if the model wraps the JSON despite instructions
  const text = block.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    return JSON.parse(text) as Recommendation
  } catch {
    throw new Error(`Failed to parse recommendation JSON: ${text}`)
  }
}
