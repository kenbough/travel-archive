import { useEffect, useMemo, useState } from 'react'
import { geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Trip } from '../lib/types'

const WIDTH = 865
const HEIGHT = 665
const VISITED = '#4F7C91'
const UNVISITED = '#DEDCD5'
const JAPAN_TOPOJSON_URL = `${import.meta.env.BASE_URL}data/japan.json`

export function JapanMap({ trips, activeCategories, categoryColors, onSelectPrefecture }: {
  trips: Trip[]
  activeCategories: Set<string>
  categoryColors: Record<string, string>
  onSelectPrefecture: (prefectureCode: string) => void
}) {
  const [features, setFeatures] = useState<any[]>([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetch(JAPAN_TOPOJSON_URL)
      .then((response) => {
        if (!response.ok) throw new Error('failed')
        return response.json()
      })
      .then((topology) => {
        const collection = feature(topology, topology.objects.prefectures) as any
        setFeatures(collection.features ?? [])
      })
      .catch(() => setLoadError(true))
  }, [])

  const path = useMemo(() => geoPath(), [])
  const matchingTrips = trips.filter((trip) => activeCategories.has(trip.categoryId))
  const visited = new Set(matchingTrips.flatMap((trip) => trip.prefectureCodes))
  const oneCategory = activeCategories.size === 1 ? [...activeCategories][0] : null

  if (loadError) return <div className="map-loading">日本地図データを読み込めませんでした。</div>
  if (!features.length) return <div className="map-loading">Loading Japan…</div>

  return (
    <svg className="map-svg map-svg--japan" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Japan prefecture travel map">
      {features.map((prefecture, index) => {
        const code = String(prefecture.id ?? index + 1).slice(0, 2).padStart(2, '0')
        const isVisited = visited.has(code)
        return (
          <path
            key={`${code}-${index}`}
            d={path(prefecture) ?? undefined}
            className={isVisited ? 'map-region map-region--visited' : 'map-region'}
            fill={isVisited ? (oneCategory ? categoryColors[oneCategory] : VISITED) : UNVISITED}
            onClick={() => isVisited && onSelectPrefecture(code)}
            tabIndex={isVisited ? 0 : -1}
            onKeyDown={(event) => {
              if (isVisited && (event.key === 'Enter' || event.key === ' ')) onSelectPrefecture(code)
            }}
          />
        )
      })}
    </svg>
  )
}
