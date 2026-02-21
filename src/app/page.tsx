'use client'

import { useState } from 'react'
import { StepIndicator } from '@/components/StepIndicator'
import { parseSeriesList } from '@/lib/parser'
import { getRecommendationAction } from './actions/getRecommendation'
import type { RecommendationWithData, RecommendationItemWithData } from './actions/getRecommendation'

type Step = 1 | 2 | 3

function RecommendationItemCard({ item }: { item: RecommendationItemWithData }) {
  return (
    <div className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 text-left">
      {item.seriesData?.poster && (
        <img src={item.seriesData.poster} alt={item.title} className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-lg flex-shrink-0" />
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="text-white font-semibold text-sm sm:text-base leading-tight">{item.title}</h3>
        {item.seriesData && (
          <div className="flex flex-wrap gap-1.5 text-xs text-zinc-400">
            <span>⭐ {item.seriesData.imdbRating}</span>
            <span>{item.seriesData.year}</span>
            <span className="truncate">{item.seriesData.genres.join(', ')}</span>
          </div>
        )}
        {item.streamingServices.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.streamingServices.map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded-full text-zinc-300">{s}</span>
            ))}
          </div>
        )}
        <p className="text-zinc-400 text-xs sm:text-sm mt-1 leading-relaxed">{item.reason}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const [step, setStep] = useState<Step>(1)
  const [rawInput, setRawInput] = useState('')
  const [parsedTitles, setParsedTitles] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [recommendation, setRecommendation] = useState<RecommendationWithData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleParse() {
    const titles = parseSeriesList(rawInput)
    setParsedTitles(titles)
    setFavorites(new Set())
  }

  function toggleFavorite(title: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(title)) { next.delete(title) }
      else if (next.size < 10) { next.add(title) }
      return next
    })
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setStep(2)
    try {
      const result = await getRecommendationAction(parsedTitles, [...favorites])
      setRecommendation(result)
      setStep(3)
    } catch {
      setError('Erro ao gerar recomendação. Tente novamente.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  async function handleNewRecommendation() {
    setLoading(true)
    setError(null)
    setRecommendation(null)
    try {
      const result = await getRecommendationAction(parsedTitles, [...favorites])
      setRecommendation(result)
    } catch {
      setError('Erro ao gerar recomendação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Series Recommender</h1>
      <p className="text-zinc-400 text-center mb-6 sm:mb-8">Descubra sua próxima série favorita</p>

      <StepIndicator currentStep={step} />

      {error && (
        <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Etapa 1: Input + seleção opcional */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-zinc-400">
              Cole sua lista de séries (uma por linha, numeradas ou não):
            </label>
            <textarea
              value={rawInput}
              onChange={(e) => { setRawInput(e.target.value); setParsedTitles([]) }}
              placeholder={'1. Breaking Bad\n2. Prison Break\n...'}
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white text-sm font-mono focus:outline-none focus:border-zinc-500 resize-none"
            />
            {rawInput.trim() && parsedTitles.length === 0 && (
              <button
                onClick={handleParse}
                className="w-full py-2 border border-zinc-600 text-zinc-300 text-sm rounded-xl hover:border-zinc-400 transition"
              >
                Carregar lista ({parseSeriesList(rawInput).length} séries detectadas)
              </button>
            )}
          </div>

          {parsedTitles.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-medium">{parsedTitles.length} séries</span> carregadas
                  {favorites.size > 0 && (
                    <span className="text-green-400 ml-2">· {favorites.size} selecionada{favorites.size !== 1 ? 's' : ''}</span>
                  )}
                </p>
                <span className="text-xs text-zinc-600">Selecione até 10 favoritas (opcional)</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl divide-y divide-zinc-800 max-h-64 overflow-y-auto">
                {parsedTitles.map((title) => {
                  const checked = favorites.has(title)
                  return (
                    <label
                      key={title}
                      className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition
                        ${checked ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}
                        ${!checked && favorites.size >= 10 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && favorites.size >= 10}
                        onChange={() => toggleFavorite(title)}
                        className="accent-white w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-zinc-300 text-sm">{title}</span>
                    </label>
                  )
                })}
              </div>
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition text-sm sm:text-base"
              >
                {favorites.size > 0
                  ? `Ver recomendações (${favorites.size} favorito${favorites.size !== 1 ? 's' : ''}) →`
                  : 'Ver recomendações →'}
              </button>
            </div>
          )}

          {parsedTitles.length === 0 && !rawInput.trim() && (
            <p className="text-center text-zinc-600 text-sm pt-4">Cole sua lista acima para começar</p>
          )}
        </div>
      )}

      {/* Etapa 2: Loading */}
      {step === 2 && (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-lg">Analisando seu gosto... ✨</p>
          <p className="text-zinc-600 text-sm mt-2">{parsedTitles.length} séries na lista</p>
        </div>
      )}

      {/* Etapa 3: Resultado */}
      {step === 3 && recommendation && (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-wide">📺 Séries para você</h2>
            <div className="space-y-3">
              {recommendation.series.map((item) => (
                <RecommendationItemCard key={item.title} item={item} />
              ))}
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-wide">🎬 Filmes para você</h2>
            <div className="space-y-3">
              {recommendation.movies.map((item) => (
                <RecommendationItemCard key={item.title} item={item} />
              ))}
            </div>
          </section>
          <div className="text-center pt-2">
            <button onClick={handleNewRecommendation} disabled={loading} className="px-6 py-3 border border-zinc-700 text-white font-medium rounded-xl hover:border-zinc-500 transition disabled:opacity-40">
              Gerar novas recomendações
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
