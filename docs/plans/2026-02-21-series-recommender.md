# Series Recommender Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Web app que enriquece uma lista de séries assistidas com dados do OMDb, deixa o usuário selecionar seu top 10, e usa Claude API para recomendar uma nova série com justificativa personalizada.

**Architecture:** App Next.js 15 stateless (sem banco de dados). Todo o estado vive em React state no cliente entre as 4 etapas. Server Actions mantêm as API keys seguras. A rota `/vitor` pré-carrega a lista hardcoded do arquivo `series.md`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, OMDb API, Anthropic Claude API (claude-sonnet-4-6), Jest + Testing Library, Vercel

---

## Task 1: Scaffold do projeto Next.js

**Files:**
- Create: `series-recommender/` (projeto inteiro via CLI)

**Step 1: Criar o projeto com create-next-app**

Dentro de `/c/Users/vitor/Documents/Projetos/series-recommender/` já existe o `.git` e a pasta `docs/`. Inicializar o Next.js no diretório atual:

```bash
cd /c/Users/vitor/Documents/Projetos/series-recommender
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Quando perguntar se quer continuar com o diretório não vazio, responder `y`.

**Step 2: Instalar dependências adicionais**

```bash
npm install @anthropic-ai/sdk
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest ts-jest
```

**Step 3: Configurar Jest**

Criar `jest.config.ts`:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

Criar `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Adicionar ao `package.json` em `scripts`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

**Step 4: Criar arquivo `.env.local`**

```env
OMDB_API_KEY=sua_chave_aqui
ANTHROPIC_API_KEY=sua_chave_aqui
```

Criar `.env.local.example` com o mesmo conteúdo (sem valores reais).

**Step 5: Limpar boilerplate do Next.js**

- Apagar conteúdo de `src/app/page.tsx`, deixar só `export default function Home() { return <main>Series Recommender</main> }`
- Apagar `src/app/globals.css` e recriar com apenas `@import "tailwindcss";`
- Apagar `public/` (SVGs do boilerplate)

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with Jest"
```

---

## Task 2: Parser da lista de séries

**Files:**
- Create: `src/lib/parser.ts`
- Create: `src/lib/__tests__/parser.test.ts`

**Step 1: Escrever os testes**

```typescript
// src/lib/__tests__/parser.test.ts
import { parseSeriesList } from '../parser'

describe('parseSeriesList', () => {
  it('parses arrow format (1→Title)', () => {
    const input = '1→Breaking Bad\n2→Prison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('parses dot format (1. Title)', () => {
    const input = '1. Breaking Bad\n2. Prison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('ignores empty lines', () => {
    const input = '1→Breaking Bad\n\n2→Prison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('handles plain text lines (no prefix)', () => {
    const input = 'Breaking Bad\nPrison Break'
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('trims whitespace', () => {
    const input = '1→  Breaking Bad  \n2→  Prison Break  '
    expect(parseSeriesList(input)).toEqual(['Breaking Bad', 'Prison Break'])
  })

  it('returns empty array for empty string', () => {
    expect(parseSeriesList('')).toEqual([])
  })
})
```

**Step 2: Rodar e confirmar que falha**

```bash
npm test src/lib/__tests__/parser.test.ts
```
Esperado: FAIL — "Cannot find module '../parser'"

**Step 3: Implementar o parser**

```typescript
// src/lib/parser.ts
export function parseSeriesList(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.replace(/^\d+[→.]\s*/, '').trim())
    .filter((line) => line.length > 0)
}
```

**Step 4: Rodar e confirmar que passa**

```bash
npm test src/lib/__tests__/parser.test.ts
```
Esperado: PASS — 6 tests passed

**Step 5: Commit**

```bash
git add src/lib/parser.ts src/lib/__tests__/parser.test.ts
git commit -m "feat: add series list parser with tests"
```

---

## Task 3: Cliente OMDb

**Files:**
- Create: `src/lib/omdb.ts`
- Create: `src/lib/__tests__/omdb.test.ts`

**Step 1: Definir o tipo e escrever os testes**

```typescript
// src/lib/__tests__/omdb.test.ts
import { fetchSeriesData } from '../omdb'

global.fetch = jest.fn()

describe('fetchSeriesData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns series data when found', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        Response: 'True',
        Title: 'Breaking Bad',
        imdbRating: '9.5',
        Genre: 'Crime, Drama, Thriller',
        Poster: 'https://example.com/poster.jpg',
        Year: '2008–2013',
        imdbID: 'tt0903747',
      }),
    })

    const result = await fetchSeriesData('Breaking Bad')

    expect(result).toEqual({
      title: 'Breaking Bad',
      imdbRating: '9.5',
      genres: ['Crime', 'Drama', 'Thriller'],
      poster: 'https://example.com/poster.jpg',
      year: '2008–2013',
      imdbId: 'tt0903747',
      found: true,
    })
  })

  it('returns not-found result when series does not exist', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ Response: 'False', Error: 'Movie not found!' }),
    })

    const result = await fetchSeriesData('Serie Inexistente')

    expect(result.found).toBe(false)
    expect(result.title).toBe('Serie Inexistente')
  })

  it('handles N/A poster as empty string', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        Response: 'True',
        Title: 'Test',
        imdbRating: '7.0',
        Genre: 'Drama',
        Poster: 'N/A',
        Year: '2020',
        imdbID: 'tt1234567',
      }),
    })

    const result = await fetchSeriesData('Test')
    expect(result.poster).toBe('')
  })
})
```

**Step 2: Rodar e confirmar que falha**

```bash
npm test src/lib/__tests__/omdb.test.ts
```
Esperado: FAIL

**Step 3: Implementar o cliente OMDb**

```typescript
// src/lib/omdb.ts
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
```

**Step 4: Rodar e confirmar que passa**

```bash
npm test src/lib/__tests__/omdb.test.ts
```
Esperado: PASS — 3 tests passed

**Step 5: Commit**

```bash
git add src/lib/omdb.ts src/lib/__tests__/omdb.test.ts
git commit -m "feat: add OMDb client with tests"
```

---

## Task 4: Cliente Claude

**Files:**
- Create: `src/lib/claude.ts`
- Create: `src/lib/__tests__/claude.test.ts`

**Step 1: Escrever os testes**

```typescript
// src/lib/__tests__/claude.test.ts
import { getSeriesRecommendation } from '../claude'

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: '{"title":"The Wire","reason":"Similar to Breaking Bad in its depth."}' }],
      }),
    },
  })),
}))

describe('getSeriesRecommendation', () => {
  it('returns recommendation with title and reason', async () => {
    const watched = ['Breaking Bad', 'Prison Break']
    const topTen = [
      { title: 'Breaking Bad', genres: ['Crime', 'Drama'], imdbRating: '9.5' },
      { title: 'Prison Break', genres: ['Drama', 'Thriller'], imdbRating: '8.3' },
    ]

    const result = await getSeriesRecommendation(watched, topTen as any)

    expect(result).toEqual({ title: 'The Wire', reason: 'Similar to Breaking Bad in its depth.' })
  })
})
```

**Step 2: Rodar e confirmar que falha**

```bash
npm test src/lib/__tests__/claude.test.ts
```

**Step 3: Implementar o cliente Claude**

```typescript
// src/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import type { SeriesData } from './omdb'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface Recommendation {
  title: string
  reason: string
}

export async function getSeriesRecommendation(
  watchedTitles: string[],
  topTen: Pick<SeriesData, 'title' | 'genres' | 'imdbRating'>[]
): Promise<Recommendation> {
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

  const text = (message.content[0] as { text: string }).text
  return JSON.parse(text) as Recommendation
}
```

**Step 4: Rodar e confirmar que passa**

```bash
npm test src/lib/__tests__/claude.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/claude.ts src/lib/__tests__/claude.test.ts
git commit -m "feat: add Claude recommendation client with tests"
```

---

## Task 5: Dados hardcoded do Vitor

**Files:**
- Create: `src/data/vitor-series.ts`

**Step 1: Criar o arquivo com a lista do series.md**

```typescript
// src/data/vitor-series.ts
export const VITOR_SERIES = `Breaking Bad
Prison Break
Chernobyl
Game Of Thrones
Sherlock
Better Call Saul
The Office
Dexter: Ressureição
Fargo
Friends
Succession
Narcos
Peaky Blinders
Ozark
Dr House
Dexter
House of Cards
Pinguim
Homeland
Mr Robot
Yellowstone
Stranger Things
Demolidor
Suits
How to get away with murder
The walking dead
The handmaid's tale
Blacklist
O justiceiro
Mindhunter
La Casa de Papel
O Atirador
His & Hers
All her fault
Billions
How I Met your mother
The Last of Us
The Mentalist
Lupin
Senna
Dexter: Pecado Original
1923`
```

**Step 2: Commit**

```bash
git add src/data/vitor-series.ts
git commit -m "feat: add Vitor's hardcoded series list"
```

---

## Task 6: Server Actions

**Files:**
- Create: `src/app/actions/enrichSeries.ts`
- Create: `src/app/actions/getRecommendation.ts`

**Step 1: Criar a Server Action de enriquecimento**

```typescript
// src/app/actions/enrichSeries.ts
'use server'

import { fetchSeriesData, type SeriesData } from '@/lib/omdb'

export async function enrichSeries(titles: string[]): Promise<SeriesData[]> {
  const results = await Promise.allSettled(titles.map((t) => fetchSeriesData(t)))

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
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
```

**Step 2: Criar a Server Action de recomendação**

```typescript
// src/app/actions/getRecommendation.ts
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
```

**Step 3: Commit**

```bash
git add src/app/actions/
git commit -m "feat: add server actions for enrichment and recommendation"
```

---

## Task 7: Componentes base

**Files:**
- Create: `src/components/StepIndicator.tsx`
- Create: `src/components/SeriesCard.tsx`

**Step 1: StepIndicator**

```tsx
// src/components/StepIndicator.tsx
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4
}

const steps = ['Lista', 'Enriquecimento', 'Top 10', 'Recomendação']

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <div key={step} className="flex items-center">
            <div className={`flex items-center gap-1.5 text-sm font-medium
              ${isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-zinc-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border
                ${isActive ? 'bg-white text-black border-white' : isDone ? 'border-green-400 text-green-400' : 'border-zinc-600 text-zinc-600'}`}>
                {isDone ? '✓' : step}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-zinc-700 mx-2" />}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2: SeriesCard**

```tsx
// src/components/SeriesCard.tsx
import Image from 'next/image'
import type { SeriesData } from '@/lib/omdb'

interface SeriesCardProps {
  series: SeriesData
  selected?: boolean
  selectable?: boolean
  onClick?: () => void
}

export function SeriesCard({ series, selected = false, selectable = false, onClick }: SeriesCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden border transition-all duration-150
        ${selectable ? 'cursor-pointer hover:border-white/50' : ''}
        ${selected ? 'border-white ring-2 ring-white/20' : 'border-zinc-700'}
        ${!series.found ? 'opacity-50' : ''}`}
    >
      {series.poster ? (
        <div className="relative aspect-[2/3]">
          <Image src={series.poster} alt={series.title} fill className="object-cover" />
        </div>
      ) : (
        <div className="aspect-[2/3] bg-zinc-800 flex items-center justify-center">
          <span className="text-zinc-500 text-xs text-center px-2">{series.title}</span>
        </div>
      )}
      <div className="p-2 bg-zinc-900">
        <p className="text-white text-xs font-medium truncate">{series.title}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-zinc-400 text-xs">⭐ {series.imdbRating}</p>
          {!series.found && <span className="text-xs text-yellow-500">Não encontrada</span>}
        </div>
        {series.genres.length > 0 && (
          <p className="text-zinc-500 text-xs truncate mt-0.5">{series.genres.join(', ')}</p>
        )}
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">
          ✓
        </div>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/
git commit -m "feat: add StepIndicator and SeriesCard components"
```

---

## Task 8: Fluxo principal — página `/`

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/globals.css` (já existe, só ajustar fundo)

**Step 1: Atualizar globals.css**

```css
/* src/app/globals.css */
@import "tailwindcss";

body {
  background-color: #0a0a0a;
  color: #ffffff;
}
```

**Step 2: Implementar page.tsx com os 4 passos**

```tsx
// src/app/page.tsx
'use client'

import { useState } from 'react'
import { StepIndicator } from '@/components/StepIndicator'
import { SeriesCard } from '@/components/SeriesCard'
import { parseSeriesList } from '@/lib/parser'
import { enrichSeries } from './actions/enrichSeries'
import { getRecommendationAction } from './actions/getRecommendation'
import type { SeriesData } from '@/lib/omdb'
import type { RecommendationWithData } from './actions/getRecommendation'

type Step = 1 | 2 | 3 | 4

export default function Home() {
  const [step, setStep] = useState<Step>(1)
  const [rawInput, setRawInput] = useState('')
  const [parsedTitles, setParsedTitles] = useState<string[]>([])
  const [enrichedSeries, setEnrichedSeries] = useState<SeriesData[]>([])
  const [enrichProgress, setEnrichProgress] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recommendation, setRecommendation] = useState<RecommendationWithData | null>(null)
  const [loading, setLoading] = useState(false)

  // Etapa 1 → 2
  async function handleEnrich() {
    const titles = parseSeriesList(rawInput)
    setParsedTitles(titles)
    setLoading(true)
    setStep(2)
    const data = await enrichSeries(titles)
    setEnrichedSeries(data)
    setLoading(false)
    setStep(3)
  }

  // Etapa 3 → 4
  async function handleRecommend() {
    const topTen = enrichedSeries.filter((s) => selected.has(s.title))
    setLoading(true)
    setStep(4)
    const result = await getRecommendationAction(parsedTitles, topTen)
    setRecommendation(result)
    setLoading(false)
  }

  function toggleSelect(title: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else if (next.size < 10) {
        next.add(title)
      }
      return next
    })
  }

  async function handleNewRecommendation() {
    const topTen = enrichedSeries.filter((s) => selected.has(s.title))
    setLoading(true)
    setRecommendation(null)
    const result = await getRecommendationAction(parsedTitles, topTen)
    setRecommendation(result)
    setLoading(false)
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Series Recommender</h1>
      <p className="text-zinc-400 text-center mb-8">Descubra sua próxima série favorita</p>

      <StepIndicator currentStep={step} />

      {/* Etapa 1: Input */}
      {step === 1 && (
        <div className="space-y-4">
          <label className="block text-sm text-zinc-400 mb-1">
            Cole sua lista de séries (uma por linha, numeradas ou não):
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={'1→Breaking Bad\n2→Prison Break\n...'}
            rows={12}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white text-sm font-mono focus:outline-none focus:border-zinc-500 resize-none"
          />
          <button
            onClick={handleEnrich}
            disabled={rawInput.trim().length === 0}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-40 hover:bg-zinc-100 transition"
          >
            Buscar dados das séries →
          </button>
        </div>
      )}

      {/* Etapa 2: Loading enriquecimento */}
      {step === 2 && loading && (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-lg">Buscando dados no OMDb...</p>
          <p className="text-zinc-600 text-sm mt-2">{parsedTitles.length} séries encontradas na lista</p>
        </div>
      )}

      {/* Etapa 3: Seleção Top 10 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">Selecione seus <span className="text-white font-semibold">10 favoritos</span></p>
            <span className={`text-sm font-medium ${selected.size === 10 ? 'text-green-400' : 'text-zinc-400'}`}>
              {selected.size}/10 selecionados
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {enrichedSeries.map((s) => (
              <SeriesCard
                key={s.title}
                series={s}
                selectable
                selected={selected.has(s.title)}
                onClick={() => toggleSelect(s.title)}
              />
            ))}
          </div>
          <button
            onClick={handleRecommend}
            disabled={selected.size !== 10}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-40 hover:bg-zinc-100 transition"
          >
            Ver minha recomendação →
          </button>
        </div>
      )}

      {/* Etapa 4: Recomendação */}
      {step === 4 && (
        <div className="text-center space-y-6">
          {loading && !recommendation && (
            <p className="text-zinc-400 py-20">Analisando seu gosto... ✨</p>
          )}
          {recommendation && (
            <div className="space-y-6">
              <p className="text-zinc-400 text-sm uppercase tracking-widest">Sua próxima série é</p>
              <h2 className="text-4xl font-bold">{recommendation.title}</h2>
              {recommendation.seriesData && (
                <div className="flex flex-col items-center gap-4">
                  {recommendation.seriesData.poster && (
                    <div className="relative w-40 rounded-xl overflow-hidden">
                      <img src={recommendation.seriesData.poster} alt={recommendation.title} className="w-full" />
                    </div>
                  )}
                  <div className="flex gap-4 text-sm text-zinc-400">
                    <span>⭐ {recommendation.seriesData.imdbRating}</span>
                    <span>{recommendation.seriesData.year}</span>
                    <span>{recommendation.seriesData.genres.join(', ')}</span>
                  </div>
                </div>
              )}
              <p className="text-zinc-300 text-base max-w-lg mx-auto leading-relaxed">
                {recommendation.reason}
              </p>
              <button
                onClick={handleNewRecommendation}
                disabled={loading}
                className="px-6 py-3 border border-zinc-700 text-white font-medium rounded-xl hover:border-zinc-500 transition disabled:opacity-40"
              >
                Gerar outra recomendação
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "feat: implement main 4-step flow on homepage"
```

---

## Task 9: Rota `/vitor`

**Files:**
- Create: `src/app/vitor/page.tsx`

**Step 1: Criar a página com lista pré-carregada**

```tsx
// src/app/vitor/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { VITOR_SERIES } from '@/data/vitor-series'
import { StepIndicator } from '@/components/StepIndicator'
import { SeriesCard } from '@/components/SeriesCard'
import { parseSeriesList } from '@/lib/parser'
import { enrichSeries } from '../actions/enrichSeries'
import { getRecommendationAction } from '../actions/getRecommendation'
import type { SeriesData } from '@/lib/omdb'
import type { RecommendationWithData } from '../actions/getRecommendation'

type Step = 1 | 2 | 3 | 4

export default function VitorPage() {
  const [step, setStep] = useState<Step>(1)
  const parsedTitles = parseSeriesList(VITOR_SERIES)
  const [enrichedSeries, setEnrichedSeries] = useState<SeriesData[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recommendation, setRecommendation] = useState<RecommendationWithData | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEnrich() {
    setLoading(true)
    setStep(2)
    const data = await enrichSeries(parsedTitles)
    setEnrichedSeries(data)
    setLoading(false)
    setStep(3)
  }

  async function handleRecommend() {
    const topTen = enrichedSeries.filter((s) => selected.has(s.title))
    setLoading(true)
    setStep(4)
    const result = await getRecommendationAction(parsedTitles, topTen)
    setRecommendation(result)
    setLoading(false)
  }

  function toggleSelect(title: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(title)) { next.delete(title) }
      else if (next.size < 10) { next.add(title) }
      return next
    })
  }

  async function handleNewRecommendation() {
    const topTen = enrichedSeries.filter((s) => selected.has(s.title))
    setLoading(true)
    setRecommendation(null)
    const result = await getRecommendationAction(parsedTitles, topTen)
    setRecommendation(result)
    setLoading(false)
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Series Recommender</h1>
      <p className="text-zinc-400 text-center mb-8">Lista do Vitor — {parsedTitles.length} séries</p>

      <StepIndicator currentStep={step} />

      {/* Etapa 1: Confirmação */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 max-h-64 overflow-y-auto">
            {parsedTitles.map((title, i) => (
              <p key={i} className="text-zinc-300 text-sm py-0.5">
                <span className="text-zinc-600 mr-2">{i + 1}.</span>{title}
              </p>
            ))}
          </div>
          <button
            onClick={handleEnrich}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition"
          >
            Buscar dados das séries →
          </button>
        </div>
      )}

      {/* Etapa 2: Loading */}
      {step === 2 && loading && (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-lg">Buscando dados no OMDb...</p>
          <p className="text-zinc-600 text-sm mt-2">{parsedTitles.length} séries</p>
        </div>
      )}

      {/* Etapa 3: Top 10 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">Selecione seus <span className="text-white font-semibold">10 favoritos</span></p>
            <span className={`text-sm font-medium ${selected.size === 10 ? 'text-green-400' : 'text-zinc-400'}`}>
              {selected.size}/10 selecionados
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {enrichedSeries.map((s) => (
              <SeriesCard key={s.title} series={s} selectable selected={selected.has(s.title)} onClick={() => toggleSelect(s.title)} />
            ))}
          </div>
          <button onClick={handleRecommend} disabled={selected.size !== 10} className="w-full py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-40 hover:bg-zinc-100 transition">
            Ver minha recomendação →
          </button>
        </div>
      )}

      {/* Etapa 4: Resultado */}
      {step === 4 && (
        <div className="text-center space-y-6">
          {loading && !recommendation && <p className="text-zinc-400 py-20">Analisando seu gosto... ✨</p>}
          {recommendation && (
            <div className="space-y-6">
              <p className="text-zinc-400 text-sm uppercase tracking-widest">Sua próxima série é</p>
              <h2 className="text-4xl font-bold">{recommendation.title}</h2>
              {recommendation.seriesData?.poster && (
                <img src={recommendation.seriesData.poster} alt={recommendation.title} className="w-40 mx-auto rounded-xl" />
              )}
              {recommendation.seriesData && (
                <div className="flex justify-center gap-4 text-sm text-zinc-400">
                  <span>⭐ {recommendation.seriesData.imdbRating}</span>
                  <span>{recommendation.seriesData.year}</span>
                  <span>{recommendation.seriesData.genres.join(', ')}</span>
                </div>
              )}
              <p className="text-zinc-300 text-base max-w-lg mx-auto leading-relaxed">{recommendation.reason}</p>
              <button onClick={handleNewRecommendation} disabled={loading} className="px-6 py-3 border border-zinc-700 text-white font-medium rounded-xl hover:border-zinc-500 transition disabled:opacity-40">
                Gerar outra recomendação
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/vitor/
git commit -m "feat: add /vitor route with pre-loaded series list"
```

---

## Task 10: Criar repositório no GitHub e fazer push

**Step 1: Criar repositório no GitHub via gh CLI**

```bash
cd /c/Users/vitor/Documents/Projetos/series-recommender
gh repo create series-recommender --public --source=. --remote=origin --push
```

**Step 2: Verificar**

```bash
git remote -v
git log --oneline
```

---

## Task 11: Deploy no Vercel

**Step 1: Instalar Vercel CLI e fazer login (se necessário)**

```bash
npx vercel --version
```

**Step 2: Configurar variáveis de ambiente no Vercel**

Antes do deploy, configurar via CLI ou dashboard:

```bash
npx vercel env add OMDB_API_KEY
npx vercel env add ANTHROPIC_API_KEY
```

**Step 3: Deploy**

```bash
npx vercel --prod
```

**Step 4: Verificar a URL gerada e testar o fluxo completo**

- Acessar `/` → colar lista → buscar → selecionar top 10 → recomendação
- Acessar `/vitor` → buscar → selecionar top 10 → recomendação

**Step 5: Commit final**

```bash
git add .
git commit -m "chore: add vercel config if generated"
git push origin main
```
