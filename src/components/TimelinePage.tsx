import { compareTripDatesDesc, formatTripDate } from '../lib/date'
import type { Category, Trip } from '../lib/types'

export function TimelinePage({ categories, trips }: { categories: Category[]; trips: Trip[] }) {
  const sorted = [...trips].sort((a, b) => compareTripDatesDesc(a.date, b.date))

  return (
    <section className="content-page timeline-page">
      <p className="section-kicker">All journeys</p>
      <h1>Timeline</h1>
      <p className="lede">正確な日付が分からない旅も、そのままの精度で人生の時系列に残します。</p>
      <div className="timeline-list">
        {sorted.map((trip) => {
          const category = categories.find((c) => c.id === trip.categoryId)
          return (
            <article className="timeline-item" key={trip.id}>
              <time>{formatTripDate(trip.date)}</time>
              <div className="timeline-body">
                {category && <div className="timeline-category"><span className="color-dot" style={{ background: category.color }} />{category.name}</div>}
                <h2>{trip.title}</h2>
                <p>{trip.places.join(' / ')}</p>
                {trip.memo && <small>{trip.memo}</small>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
