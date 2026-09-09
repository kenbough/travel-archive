import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import type { Trip } from '../lib/types'
import { countryDisplayName, numericToAlpha3 } from '../lib/iso-country'

const WIDTH = 760
const HEIGHT = 580
const GLOBE_RADIUS = 248
const VISITED = '#4F7C91'
const UNVISITED = '#D9D8D2'
const MIN_ZOOM = 0.82
const MAX_ZOOM = 4.2

type Rotation = [number, number, number]
type GlobeView = { rotation: Rotation; zoom: number }
type Point = { x: number; y: number }

const initialView: GlobeView = { rotation: [-25, -14, 0], zoom: 1 }
const japanView: GlobeView = { rotation: [-138, -37, 0], zoom: 2.45 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const shortestAngle = (from: number, to: number) => ((to - from + 540) % 360) - 180

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
  const gestureRef = useRef<{ view: GlobeView; center: Point; distance: number } | null>(null)
  const viewRef = useRef<GlobeView>(initialView)
  const lastUserViewRef = useRef<GlobeView>(initialView)
  const previousFocusRef = useRef(focusJapan)
  const didMoveRef = useRef(false)
  const animationRef = useRef<number | null>(null)
  const [view, setView] = useState<GlobeView>(initialView)
  const [isDragging, setIsDragging] = useState(false)

  const countries = useMemo(() => {
    const topo = worldData as any
    return (feature(topo, topo.objects.countries) as any).features as any[]
  }, [])

  const projection = useMemo(() => (
    geoOrthographic()
      .translate([WIDTH / 2, HEIGHT / 2])
      .scale(GLOBE_RADIUS * view.zoom)
      .rotate(view.rotation)
      .clipAngle(90)
      .precision(.35)
  ), [view])
  const path = useMemo(() => geoPath(projection), [projection])
  const graticule = useMemo(() => geoGraticule10(), [])

  const matchingTrips = trips.filter((trip) => activeCategories.has(trip.categoryId))
  const visited = new Set(matchingTrips.flatMap((trip) => trip.countryCodes))
  const oneCategory = activeCategories.size === 1 ? [...activeCategories][0] : null

  function updateView(next: GlobeView, remember = true) {
    viewRef.current = next
    if (remember) lastUserViewRef.current = next
    setView(next)
  }

  useEffect(() => {
    if (previousFocusRef.current === focusJapan) return
    previousFocusRef.current = focusJapan
    if (focusJapan) lastUserViewRef.current = viewRef.current

    const start = viewRef.current
    const target = focusJapan ? japanView : lastUserViewRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      updateView(target, false)
      return
    }

    const startedAt = performance.now()
    const duration = 760
    const rotationDelta = target.rotation.map((angle, index) => shortestAngle(start.rotation[index], angle)) as Rotation

    const tick = (now: number) => {
      const raw = clamp((now - startedAt) / duration, 0, 1)
      const progress = 1 - Math.pow(1 - raw, 3)
      updateView({
        rotation: start.rotation.map((angle, index) => angle + rotationDelta[index] * progress) as Rotation,
        zoom: start.zoom + (target.zoom - start.zoom) * progress,
      }, false)
      if (raw < 1) animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [focusJapan])

  function gestureSnapshot() {
    const points = [...pointersRef.current.values()]
    if (!points.length) return null
    const center = points.length === 1
      ? points[0]
      : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
    const distance = points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0
    return { view: viewRef.current, center, distance }
  }

  function pointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (focusJapan || animateTransform) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    gestureRef.current = gestureSnapshot()
    didMoveRef.current = false
    setIsDragging(true)
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(event.pointerId) || !gestureRef.current) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointersRef.current.values()]
    const center = points.length === 1
      ? points[0]
      : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
    const start = gestureRef.current
    const dx = center.x - start.center.x
    const dy = center.y - start.center.y
    const zoom = points.length > 1 && start.distance > 0
      ? clamp(start.view.zoom * Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) / start.distance, MIN_ZOOM, MAX_ZOOM)
      : start.view.zoom

    updateView({
      rotation: [
        start.view.rotation[0] + dx * .36 / Math.sqrt(start.view.zoom),
        clamp(start.view.rotation[1] - dy * .3 / Math.sqrt(start.view.zoom), -88, 88),
        0,
      ],
      zoom,
    })
    if (Math.hypot(dx, dy) > 3 || Math.abs(zoom - start.view.zoom) > .01) didMoveRef.current = true
  }

  function pointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(event.pointerId)
    gestureRef.current = gestureSnapshot()
    if (!pointersRef.current.size) setIsDragging(false)
  }

  function changeZoom(factor: number) {
    const current = viewRef.current
    updateView({ ...current, zoom: clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM) })
  }

  function wheel(event: WheelEvent<SVGSVGElement>) {
    if (focusJapan || animateTransform) return
    event.preventDefault()
    changeZoom(Math.exp(-event.deltaY * .0014))
  }

  function reset() {
    updateView(initialView)
  }

  const sphere = { type: 'Sphere' } as any

  return (
    <div className="interactive-map interactive-map--globe">
      <svg
        ref={svgRef}
        className={`map-svg map-svg--interactive map-svg--globe${isDragging ? ' is-dragging' : ''}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Interactive 3D globe. Drag to rotate, scroll or pinch to zoom."
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onWheel={wheel}
        onDoubleClick={() => changeZoom(1.65)}
      >
        <defs>
          <radialGradient id="globe-ocean" cx="34%" cy="27%" r="72%">
            <stop offset="0%" stopColor="#F9F8F3" />
            <stop offset="67%" stopColor="#E9ECE9" />
            <stop offset="100%" stopColor="#C7D0CF" />
          </radialGradient>
          <clipPath id="globe-clip"><path d={path(sphere) ?? undefined} /></clipPath>
          <radialGradient id="globe-shade" cx="28%" cy="22%" r="78%">
            <stop offset="50%" stopColor="#17303a" stopOpacity="0" />
            <stop offset="100%" stopColor="#17303a" stopOpacity=".2" />
          </radialGradient>
        </defs>
        <path className="globe-ocean" d={path(sphere) ?? undefined} fill="url(#globe-ocean)" />
        <path className="globe-graticule" d={path(graticule) ?? undefined} />
        {countries.map((country, index) => {
          const numeric = country.id == null ? null : String(country.id).padStart(3, '0')
          const alpha3 = numeric ? numericToAlpha3[numeric] : undefined
          const isVisited = alpha3 ? visited.has(alpha3) : false
          const countryPath = path(country)
          if (!countryPath) return null
          return (
            <path
              key={alpha3 ?? country.properties?.name ?? `region-${index}`}
              d={countryPath}
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
        <path className="globe-shade" d={path(sphere) ?? undefined} fill="url(#globe-shade)" pointerEvents="none" />
        <ellipse className="globe-highlight" cx="292" cy="205" rx="108" ry="68" clipPath="url(#globe-clip)" />
      </svg>
      <p className="map-gesture-hint">DRAG TO ROTATE · SCROLL · PINCH</p>
      <div className="map-zoom-controls" aria-label="Globe zoom controls">
        <button type="button" onClick={() => changeZoom(1.45)} aria-label="Zoom in">＋</button>
        <button type="button" onClick={() => changeZoom(1 / 1.45)} aria-label="Zoom out">−</button>
        <button type="button" className="map-reset" onClick={reset} aria-label="Reset globe view">↺</button>
      </div>
    </div>
  )
}
