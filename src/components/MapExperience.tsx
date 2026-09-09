import { useEffect, useMemo, useState } from 'react'
import { JapanMap } from './JapanMap'
import { WorldMap } from './WorldMap'
import { formatTripDate, isVisibleByYear, knownDurationDays } from '../lib/date'
import { countryDisplayName } from '../lib/iso-country'
import { prefectureNameByCode } from '../lib/prefectures'
import type { Category, Trip } from '../lib/types'
import { hrefFor } from '../hooks/useHashRoute'

type Selection = { kind: 'country' | 'prefecture'; code: string } | null

export function MapExperience({ categories, trips, loading }: { categories: Category[]; trips: Trip[]; loading: boolean }) {
  const [mode, setMode] = useState<'world' | 'japan'>('world')
  const maxYear = Math.max(new Date().getFullYear(), ...trips.map((trip) => trip.date.startYear))
  const minYear = trips.length ? Math.min(...trips.map((trip) => trip.date.startYear)) : maxYear
  const [selectedYear, setSelectedYear] = useState(maxYear)
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(categories.map((c) => c.id)))
  const [selection, setSelection] = useState<Selection>(null)

  const categoryColors = Object.fromEntries(categories.map((c) => [c.id, c.color]))
  const visibleTrips = useMemo(() => trips.filter((trip) => isVisibleByYear(trip.date, selectedYear)), [trips, selectedYear])
  const filteredTrips = visibleTrips.filter((trip) => activeCategories.has(trip.categoryId))
  const countryCount = new Set(filteredTrips.flatMap((trip) => trip.countryCodes)).size
  const prefCount = new Set(filteredTrips.flatMap((trip) => trip.prefectureCodes)).size
  const knownDays = filteredTrips.reduce((sum, trip) => sum + (knownDurationDays(trip.date) ?? 0), 0)

  const selectedTrips = selection
    ? filteredTrips.filter((trip) => selection.kind === 'country'
      ? trip.countryCodes.includes(selection.code)
      : trip.prefectureCodes.includes(selection.code))
    : []

  function toggleCategory(id: string) {
    setActiveCategories((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else next.add(id)
      return next
    })
    setSelection(null)
  }

  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategories((current) => current.size ? current : new Set(categories.map((c) => c.id)))
    }
  }, [categories])

  return (
    <>
      <section className="map-layout">
        <aside className="map-meta">
          <p className="eyebrow">A map<br />of my<br />journeys</p>
          <div className="stats">
            <div><strong>{countryCount}</strong><span>Countries</span></div>
            <div><strong>{prefCount}</strong><span>Prefectures</span></div>
            <div><strong>{filteredTrips.length}</strong><span>Trips</span></div>
            <div><strong>{knownDays || '—'}</strong><span>Known days</span></div>
          </div>
          <div className="category-list" aria-label="Trip type filters">
            {categories.map((category) => (
              <button type="button" key={category.id} className={activeCategories.has(category.id) ? 'category-filter is-active' : 'category-filter'} onClick={() => toggleCategory(category.id)}>
                <span className="color-dot" style={{ background: category.color }} />{category.name}
              </button>
            ))}
          </div>
        </aside>

        <div className="map-stage">
          <div className="map-canvas">
            {loading ? <div className="map-loading">Loading archive…</div> : mode === 'world' ? (
              <WorldMap trips={visibleTrips} activeCategories={activeCategories} categoryColors={categoryColors} onSelectCountry={(code) => setSelection({ kind: 'country', code })} />
            ) : (
              <JapanMap trips={visibleTrips} activeCategories={activeCategories} categoryColors={categoryColors} onSelectPrefecture={(code) => setSelection({ kind: 'prefecture', code })} />
            )}
          </div>
          <div className="map-credit">Map data: Natural Earth / Geolonia</div>
          <div className="map-bottom">
            <div className="year-control">
              <span>{minYear}</span>
              <input aria-label="Show journeys up to year" type="range" min={minYear} max={maxYear} value={Math.min(selectedYear, maxYear)} onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelection(null) }} />
              <strong>{selectedYear}</strong>
            </div>
            <div className="mode-switch" role="group" aria-label="Map mode">
              <button className={mode === 'world' ? 'is-active' : ''} onClick={() => { setMode('world'); setSelection(null) }}>WORLD</button>
              <button className={mode === 'japan' ? 'is-active' : ''} onClick={() => { setMode('japan'); setSelection(null) }}>JAPAN</button>
            </div>
          </div>
        </div>
      </section>

      <a href={hrefFor('/trip/new')} className="floating-add" aria-label="Add a trip">+</a>
      {selection && <PlaceDrawer selection={selection} trips={selectedTrips} categories={categories} onClose={() => setSelection(null)} />}
    </>
  )
}

function PlaceDrawer({ selection, trips, categories, onClose }: { selection: NonNullable<Selection>; trips: Trip[]; categories: Category[]; onClose: () => void }) {
  const name = selection.kind === 'country' ? countryDisplayName(selection.code) : (prefectureNameByCode[selection.code] ?? `Prefecture ${selection.code}`)
  const knownDays = trips.reduce((sum, trip) => sum + (knownDurationDays(trip.date) ?? 0), 0)
  return (
    <aside className="place-drawer" aria-label={`${name} travel history`}>
      <button className="drawer-close" type="button" onClick={onClose}>×</button>
      <p className="drawer-kicker">{selection.kind === 'country' ? 'Country' : 'Prefecture'}</p>
      <h2>{name}</h2>
      <div className="drawer-stats"><span><strong>{trips.length}</strong> Trips</span><span><strong>{knownDays || '—'}</strong> Known days</span></div>
      <div className="drawer-trip-list">
        {trips.map((trip) => {
          const category = categories.find((c) => c.id === trip.categoryId)
          return (
            <article className="drawer-trip" key={trip.id}>
              <time>{formatTripDate(trip.date)}</time>
              {category && <div><span className="color-dot" style={{ background: category.color }} />{category.name}</div>}
              <h3>{trip.title}</h3>
              {trip.places.length > 0 && <p>{trip.places.join(' / ')}</p>}
            </article>
          )
        })}
      </div>
      <a href={hrefFor('/trip/new')} className="drawer-add">＋ この場所への旅を追加</a>
    </aside>
  )
}
