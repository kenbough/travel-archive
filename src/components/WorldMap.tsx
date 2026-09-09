import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import type { Trip } from '../lib/types'
import { countryDisplayName, numericToAlpha3 } from '../lib/iso-country'

const WIDTH = 960
const HEIGHT = 520
const VISITED = '#4F7C91'
const UNVISITED = '#DEDCD5'
const MIN_ZOOM = 1
const MAX_ZOOM = 8

type MapTransform = { x: number; y: number; scale: number }
type Point = { x: number; y: number }

const identityTransform: MapTransform = { x: 0, y: 0, scale: 1 }

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function WorldMap({ trips, activeCategories, categoryColors, onSelectCountry, focusJapan, animateTransform }: {
  trips: Trip[]
  activeCategories: Set<string>
  categoryColors: Record<string, string>
  onSelectCountry: (countryCode: string) => void
  focusJapan: boolean
  animateTransform: boolean
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const gestureRef = useRef<{ transform: MapTransform; center: Point; distance: number } | null>(null)
  const transformRef = useRef<MapTransform>(identityTransform)
  const lastUserTransformRef = useRef<MapTransform>(identityTransform)
  const didMoveRef = useRef(false)
  const [transform, setTransform] = useState<MapTransform>(identityTransform)
  const [isDragging, setIsDragging] = useState(false)

  const countries = useMemo(() => {
    const topo = worldData as any
    return (feature(topo, topo.objects.countries) as any).features as any[]
  }, [])

  const projection = useMemo(() => (
    geoNaturalEarth1().fitExtent([[18, 18], [WIDTH - 18, HEIGHT - 18]], {
      type: 'FeatureCollection', features: countries,
    } as any)
  ), [countries])
  const path = useMemo(() => geoPath(projection), [projection])

  const japanFocus = useMemo<MapTransform>(() => {
    const japan = countries.find((country) => String(country.id).padStart(3, '0') === '392')
    if (!japan) return identityTransform
    const [centerX, centerY] = path.centroid(japan)
    const scale = 5.4
    return { x: WIDTH / 2 - centerX * scale, y: HEIGHT / 2 - centerY * scale, scale }
  }, [countries, path])

  useEffect(() => {
    if (focusJapan) {
      lastUserTransformRef.current = transformRef.current
      updateTransform(japanFocus, false)
    } else {
      updateTransform(lastUserTransformRef.current, false)
    }
  }, [focusJapan, japanFocus])

  const matchingTrips = trips.filter((trip) => activeCategories.has(trip.categoryId))
  const visited = new Set(matchingTrips.flatMap((trip) => trip.countryCodes))
  const oneCategory = activeCategories.size === 1 ? [...activeCategories][0] : null

  function updateTransform(next: MapTransform, remember = true) {
    transformRef.current = next
    if (remember) lastUserTransformRef.current = next
    setTransform(next)
  }

  function pointInView(clientX: number, clientY: number): Point {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds) return { x: 0, y: 0 }
    return {
      x: (clientX - bounds.left) * WIDTH / bounds.width,
      y: (clientY - bounds.top) * HEIGHT / bounds.height,
    }
  }

  function gestureSnapshot() {
    const points = [...pointersRef.current.values()]
    if (!points.length) return null
    const center = points.length === 1
      ? points[0]
      : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
    const distance = points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0
    return { transform: transformRef.current, center, distance }
  }

  function pointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (focusJapan || animateTransform) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, pointInView(event.clientX, event.clientY))
    gestureRef.current = gestureSnapshot()
    didMoveRef.current = false
    setIsDragging(true)
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(event.pointerId) || !gestureRef.current) return
    pointersRef.current.set(event.pointerId, pointInView(event.clientX, event.clientY))
    const points = [...pointersRef.current.values()]
    const currentCenter = points.length === 1
      ? points[0]
      : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
    const start = gestureRef.current
    const scale = points.length > 1 && start.distance > 0
      ? clampZoom(start.transform.scale * Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) / start.distance)
      : start.transform.scale
    const mapX = (start.center.x - start.transform.x) / start.transform.scale
    const mapY = (start.center.y - start.transform.y) / start.transform.scale
    updateTransform({ x: currentCenter.x - mapX * scale, y: currentCenter.y - mapY * scale, scale })
    if (Math.hypot(currentCenter.x - start.center.x, currentCenter.y - start.center.y) > 2 || Math.abs(scale - start.transform.scale) > 0.01) {
      didMoveRef.current = true
    }
  }

  function pointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(event.pointerId)
    gestureRef.current = gestureSnapshot()
    if (!pointersRef.current.size) setIsDragging(false)
  }

  function zoomAt(point: Point, nextScale: number) {
    const current = transformRef.current
    const scale = clampZoom(nextScale)
    const mapX = (point.x - current.x) / current.scale
    const mapY = (point.y - current.y) / current.scale
    updateTransform({ x: point.x - mapX * scale, y: point.y - mapY * scale, scale })
  }

  function wheel(event: WheelEvent<SVGSVGElement>) {
    if (focusJapan || animateTransform) return
    event.preventDefault()
    zoomAt(pointInView(event.clientX, event.clientY), transformRef.current.scale * Math.exp(-event.deltaY * 0.0015))
  }

  function zoomFromCenter(factor: number) {
    zoomAt({ x: WIDTH / 2, y: HEIGHT / 2 }, transformRef.current.scale * factor)
  }

  function reset() {
    updateTransform(identityTransform)
  }

  return (
    <div className="interactive-map">
      <svg
        ref={svgRef}
        className={`map-svg map-svg--interactive${isDragging ? ' is-dragging' : ''}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="World travel map. Drag to move, scroll or pinch to zoom."
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onWheel={wheel}
        onDoubleClick={(event) => zoomAt(pointInView(event.clientX, event.clientY), transformRef.current.scale * 1.8)}
      >
        <g
          className={animateTransform ? 'world-map-content is-animating' : 'world-map-content'}
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
        >
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
            onClick={() => !didMoveRef.current && isVisited && alpha3 && onSelectCountry(alpha3)}
            tabIndex={isVisited ? 0 : -1}
            onKeyDown={(event) => {
              if (isVisited && alpha3 && (event.key === 'Enter' || event.key === ' ')) onSelectCountry(alpha3)
            }}
          >
            <title>{alpha3 ? countryDisplayName(alpha3) : (country.properties?.name ?? 'Unknown region')}</title>
          </path>
        )
        })}
        </g>
      </svg>
      <p className="map-gesture-hint">DRAG · SCROLL · PINCH</p>
      <div className="map-zoom-controls" aria-label="Map zoom controls">
        <button type="button" onClick={() => zoomFromCenter(1.6)} aria-label="Zoom in">＋</button>
        <button type="button" onClick={() => zoomFromCenter(1 / 1.6)} aria-label="Zoom out">−</button>
        <button type="button" className="map-reset" onClick={reset} aria-label="Reset map view">↺</button>
      </div>
    </div>
  )
}
