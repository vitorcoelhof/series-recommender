# Series Recommender — SUMMARY

Contexto para retomar o projeto em qualquer sessão futura.

---

## Stack

- **Next.js 16** (App Router + Server Actions)
- **Tailwind CSS**
- **Groq API** — Llama 3.3 70B via `groq-sdk` (`GROQ_API_KEY`)
- **OMDb API** — poster, rating, ano, gêneros (`OMDB_API_KEY`)
- **JustWatch GraphQL API** — disponibilidade em streaming no Brasil (sem chave)
- **Vercel** — deploy em https://series-recommender.vercel.app

## Variáveis de ambiente (.env.local e Vercel)

```
OMDB_API_KEY=e23ebf3
GROQ_API_KEY=<ver no Vercel ou .env.local — não commitar>
```

---

## Estrutura de arquivos relevantes

```
src/
  app/
    page.tsx                  ← Página principal (textarea + parse + favoritos)
    layout.tsx                ← Metadata + OG tags
    opengraph-image.tsx       ← OG image dinâmica (1200x630)
    vitor/page.tsx            ← Página pessoal do Vitor (lista pré-carregada)
    actions/
      getRecommendation.ts    ← Server action principal (Groq + enrich)
  components/
    StepIndicator.tsx         ← Indicador de 3 etapas
  lib/
    claude.ts                 ← Integração Groq (llama-3.3-70b-versatile)
    justwatch.ts              ← fetchStreamingAvailability (BR)
    omdb.ts                   ← fetchSeriesData
    parser.ts                 ← parseSeriesList (parse de texto livre)
    title-map.ts              ← toEnglishTitle() — de-para PT→EN
  data/
    vitor-series.ts           ← Lista hardcoded de séries do Vitor
```

---

## Fluxo da página principal (/)

1. **Step 1** — Usuário cola lista no textarea → clica "Carregar lista" → séries aparecem como checkboxes para marcar favoritos (até 10, opcional) → clica "Ver recomendações"
2. **Step 2** — Loading enquanto chama `getRecommendationAction`
3. **Step 3** — Grid com 5 séries + 5 filmes, cada um com poster/rating/streaming

## Fluxo da página /vitor

- Igual ao step 1 (checkboxes), mas sem textarea — lista vem pré-carregada de `vitor-series.ts`
- Títulos são convertidos PT→EN via `toEnglishTitle()` antes de exibir e antes de enviar ao AI

---

## Funções principais

### `getRecommendationAction(watchedTitles, favorites)` — `actions/getRecommendation.ts`
- Converte títulos PT→EN via `toEnglishTitle()`
- Chama `getRecommendations()` (Groq)
- Enrich paralelo: `fetchSeriesData()` (OMDb) + `fetchStreamingAvailability()` (JustWatch)
- Retorna `{ series: RecommendationItemWithData[], movies: RecommendationItemWithData[] }`

### `getRecommendations(watchedTitles, favorites)` — `lib/claude.ts`
- Groq `llama-3.3-70b-versatile` com `response_format: { type: 'json_object' }`
- Prompt em PT-BR, retorna JSON `{ series: [{title, reason}], movies: [{title, reason}] }`

### `toEnglishTitle(title)` — `lib/title-map.ts`
- Mapeia nomes em PT para EN (ex: "Pinguim" → "The Penguin")
- Aplicado tanto no display do /vitor quanto antes de enviar ao AI

---

## Próximos passos sugeridos

- [ ] Considerar adicionar mais entradas no `title-map.ts` conforme necessário
