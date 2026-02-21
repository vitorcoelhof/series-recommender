'use client'

import { useState } from 'react'
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

      {/* Etapa 1: Confirmação da lista */}
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
