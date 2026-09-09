import { useEffect, useMemo, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { Trip } from '../lib/types'

const WIDTH = 720
const HEIGHT = 620
const VISITED = '#4F7C91'
const UNVISITED = '#DEDCD5'
const JAPAN_GEOJSON_URL = 'https://raw.githubusercontent.com/geolonia/prefecture-tiles/master/prefectures.geojson'

export function JapanMap({ trips, activeCategories, categoryColors, onSelectPrefecture }: {
  trips: Trip[]
  activeCategories: Set<string>
  categoryColors: Record<string, string>
  onSelectPrefecture: (prefectureCode: string) => void
}) {
  const [features, setFeatures] = useState<any[]>([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetch(JAPAN_GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error('failed')
        return res.json()
      })
      .then((geojson) => setFeatures(geojson.features ?? []))
      .catch(() => setLoadError(true))
  }, [])

  const path = useMemo(() => {
    if (!features.length) return null
    const collection = { type: 'FeatureCollection', features }
    const projection = geoMercator().fitExtent([[22, 20], [WIDTH - 22, HEIGHT - 20]], collection as any)
    return geoPath(projection)
  }, [features])

  const matchingTrips = trips.filter((trip) => activeCategories.has(trip.categoryId))
  const visited = new Set(matchingTrips.flatMap((trip) => trip.prefectureCodes))
  const oneCategory = activeCategories.size === 1 ? [...activeCategories][0] : null

  if (loadError) return <div className="map-loading">日本地図データを読み込めませんでした。</div>
  if (!path) return <div className="map-loading">Loading Japan…</div>

  return (
    <svg className="map-svg map-svg--japan" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Japan prefecture travel map">
      {features.map((pref, index) => {
        const rawCode = pref.properties?.code ?? pref.properties?.pref ?? pref.id ?? index + 1
        const code = String(rawCode).padStart(2, '0')
        const isVisited = visited.has(code)
        return (
          <path
            key={`${code}-${index}`}
            d={path(pref) ?? undefined}
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
