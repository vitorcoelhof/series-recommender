import { GoogleGenAI } from '@google/genai'

export interface RecommendationItem {
  title: string
  reason: string
}

export interface RecommendationsResponse {
  series: RecommendationItem[]
  movies: RecommendationItem[]
}

export async function getRecommendations(
  watchedTitles: string[],
  favorites: string[]
): Promise<RecommendationsResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const favoritesSection = favorites.length > 0
    ? `Os favoritos do usuário (séries que mais gostou) são:\n${favorites.map((t) => `- ${t}`).join('\n')}\n\n`
    : ''

  const prompt = `Você é um especialista em séries e filmes.

O usuário já assistiu estas séries: ${watchedTitles.join(', ')}.

${favoritesSection}Com base no gosto do usuário, recomende:
- 5 SÉRIES que o usuário ainda não assistiu
- 5 FILMES que combinam com o perfil do usuário

Nenhuma série recomendada pode estar na lista de séries já assistidas.
Para cada item, justifique em 1-2 frases baseando-se nos padrões dos favoritos.

Responda APENAS em JSON válido, sem markdown, sem explicações:
{
  "series": [
    {"title": "Nome da Série", "reason": "Justificativa..."},
    {"title": "Nome da Série", "reason": "Justificativa..."},
    {"title": "Nome da Série", "reason": "Justificativa..."},
    {"title": "Nome da Série", "reason": "Justificativa..."},
    {"title": "Nome da Série", "reason": "Justificativa..."}
  ],
  "movies": [
    {"title": "Nome do Filme", "reason": "Justificativa..."},
    {"title": "Nome do Filme", "reason": "Justificativa..."},
    {"title": "Nome do Filme", "reason": "Justificativa..."},
    {"title": "Nome do Filme", "reason": "Justificativa..."},
    {"title": "Nome do Filme", "reason": "Justificativa..."}
  ]
}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  })

  if (!response.text) throw new Error('Empty response from Gemini')

  const text = response.text
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  try {
    return JSON.parse(text) as RecommendationsResponse
  } catch {
    console.error('[getRecommendations] Failed to parse JSON. Raw text:', text)
    throw new Error(`Failed to parse recommendations JSON: ${text}`)
  }
}
