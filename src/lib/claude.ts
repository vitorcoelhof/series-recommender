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
    model: 'gemini-2.0-flash',
    contents: prompt,
  })

  if (!response.text) throw new Error('Empty response from Gemini')

  // Extract the JSON object from anywhere in the response
  // (handles markdown code blocks, thinking tokens, extra text, etc.)
  const jsonMatch = response.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[getRecommendations] No JSON found. Raw:', response.text.substring(0, 300))
    throw new Error('No JSON object found in Gemini response')
  }

  try {
    return JSON.parse(jsonMatch[0]) as RecommendationsResponse
  } catch {
    console.error('[getRecommendations] Failed to parse JSON. Extracted:', jsonMatch[0].substring(0, 300))
    throw new Error('Failed to parse recommendations JSON')
  }
}
