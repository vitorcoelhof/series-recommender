'use client'

import { useState } from 'react'
import { VITOR_SERIES } from '@/data/vitor-series'
import { StepIndicator } from '@/components/StepIndicator'
import { SeriesCard } from '@/components/SeriesCard'
import { parseSeriesList } from '@/lib/parser'
import { enrichSeries } from '../actions/enrichSeries'
import { getRecommendationAction } from '../actions/getRecommendation'
import type { SeriesData } from '@/lib/omdb'
import type { RecommendationWithData, RecommendationItemWithData } from '../actions/getRecommendation'

type Step = 1 | 2 | 3 | 4

function RecommendationItemCard({ item }: { item: RecommendationItemWithData }) {
  return (
    <div className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left">
      {item.seriesData?.poster && (
        <img src={item.seriesData.poster} alt={item.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="text-white font-semibold text-base leading-tight">{item.title}</h3>
        {item.seriesData && (
          <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
            <span>⭐ {item.seriesData.imdbRating}</span>
            <span>{item.seriesData.year}</span>
            <span className="truncate">{item.seriesData.genres.join(', ')}</span>
          </div>
        )}
        {item.streamingServices.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.streamingServices.map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded-full text-zinc-300">
                {s}
              </span>
            ))}
          </div>
        )}
        {item.streamingServices.length === 0 && (
          <span className="text-xs text-zinc-600 mt-1">Não disponível em streaming no Brasil</span>
        )}
        <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{item.reason}</p>
      </div>
    </div>
  )
}

export default function VitorPage() {
  const [step, setStep] = useState<Step>(1)
  const parsedTitles = parseSeriesList(VITOR_SERIES)
  const [enrichedSeries, setEnrichedSeries] = useState<SeriesData[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recommendation, setRecommendation] = useState<RecommendationWithData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEnrich() {
    setLoading(true)
    setError(null)
    setStep(2)
    try {
      const data = await enrichSeries(parsedTitles)
      setEnrichedSeries(data)
      setStep(3)
    } catch (e) {
      setError('Erro ao buscar dados das séries. Tente novamente.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecommend() {
    const topTen = enrichedSeries.filter((s) => selected.has(s.title))
    setLoading(true)
    setError(null)
    setStep(4)
    try {
      const result = await getRecommendationAction(parsedTitles, topTen)
      setRecommendation(result)
    } catch (e) {
      setError('Erro ao gerar recomendação. Tente novamente.')
      setStep(3)
    } finally {
      setLoading(false)
    }
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
    setError(null)
    setRecommendation(null)
    try {
      const result = await getRecommendationAction(parsedTitles, topTen)
      setRecommendation(result)
    } catch (e) {
      setError('Erro ao gerar recomendação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Series Recommender</h1>
      <p className="text-zinc-400 text-center mb-8">Lista do Vitor — {parsedTitles.length} séries</p>

      <StepIndicator currentStep={step} />

      {error && (
        <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

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

      {/* Etapa 3: Seleção de favoritos */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">Selecione seus <span className="text-white font-semibold">favoritos</span> (até 10)</p>
            <span className={`text-sm font-medium ${selected.size > 0 ? 'text-green-400' : 'text-zinc-400'}`}>
              {selected.size} selecionados
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {enrichedSeries.map((s) => (
              <SeriesCard key={s.title} series={s} selectable selected={selected.has(s.title)} onClick={() => toggleSelect(s.title)} />
            ))}
          </div>
          <button onClick={handleRecommend} disabled={selected.size === 0} className="w-full py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-40 hover:bg-zinc-100 transition">
            Ver minhas recomendações →
          </button>
        </div>
      )}

      {/* Etapa 4: Resultados */}
      {step === 4 && (
        <div className="space-y-10">
          {loading && !recommendation && (
            <p className="text-zinc-400 py-20 text-center">Analisando seu gosto... ✨</p>
          )}

          {recommendation && (
            <>
              {/* Séries */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white tracking-wide">📺 Séries para você</h2>
                <div className="space-y-3">
                  {recommendation.series.map((item) => (
                    <RecommendationItemCard key={item.title} item={item} />
                  ))}
                </div>
              </section>

              {/* Filmes */}
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
            </>
          )}
        </div>
      )}
    </main>
  )
}
