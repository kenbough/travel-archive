import { useMemo } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import type { Trip } from '../lib/types'
import { countryDisplayName, numericToAlpha3 } from '../lib/iso-country'

const WIDTH = 960
const HEIGHT = 520
const VISITED = '#4F7C91'
const UNVISITED = '#DEDCD5'

export function WorldMap({ trips, activeCategories, categoryColors, onSelectCountry }: {
  trips: Trip[]
  activeCategories: Set<string>
  categoryColors: Record<string, string>
  onSelectCountry: (countryCode: string) => void
}) {
  const countries = useMemo(() => {
    const topo = worldData as any
    return (feature(topo, topo.objects.countries) as any).features as any[]
  }, [])

  const path = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[18, 18], [WIDTH - 18, HEIGHT - 18]], {
      type: 'FeatureCollection', features: countries,
    } as any)
    return geoPath(projection)
  }, [countries])

  const matchingTrips = trips.filter((trip) => activeCategories.has(trip.categoryId))
  const visited = new Set(matchingTrips.flatMap((trip) => trip.countryCodes))
  const oneCategory = activeCategories.size === 1 ? [...activeCategories][0] : null

  return (
    <svg className="map-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="World travel map">
      {countries.map((country, index) => {
        const numeric = country.id == null ? null : String(country.id).padStart(3, '0')
        const alpha3 = numeric ? numericToAlpha3[numeric] : undefined
        const isVisited = alpha3 ? visited.has(alpha3) : false
        return (
          <path
            key={alpha3 ?? country.properties?.name ?? `region-${index}`}
            d={path(country) ?? undefined}
            className={isVisited ? 'map-region map-region--visited' : 'map-region'}
            fill={isVisited ? (oneCategory ? categoryColors[oneCategory] : VISITED) : UNVISITED}
            onClick={() => isVisited && alpha3 && onSelectCountry(alpha3)}
            tabIndex={isVisited ? 0 : -1}
            onKeyDown={(event) => {
              if (isVisited && alpha3 && (event.key === 'Enter' || event.key === ' ')) onSelectCountry(alpha3)
            }}
          >
            <title>{alpha3 ? countryDisplayName(alpha3) : (country.properties?.name ?? 'Unknown region')}</title>
          </path>
        )
      })}
    </svg>
  )
}
