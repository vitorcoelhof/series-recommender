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
