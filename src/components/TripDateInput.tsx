import { useState } from 'react'
import type { DatePrecision, TripDate } from '../lib/types'

const now = new Date()
const initialDate: TripDate = {
  precision: 'day',
  startYear: now.getFullYear(),
  startMonth: now.getMonth() + 1,
  startDay: now.getDate(),
}

function isoDate(year?: number | null, month?: number | null, day?: number | null) {
  if (!year || !month || !day) return ''
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function TripDateInput({ onChange }: { onChange: (date: TripDate) => void }) {
  const [value, setValue] = useState<TripDate>(initialDate)

  function patch(next: Partial<TripDate>) {
    const merged = { ...value, ...next }
    setValue(merged)
    onChange(merged)
  }

  function setPrecision(precision: DatePrecision) {
    if (precision === 'year') {
      patch({ precision, startMonth: null, startDay: null, endYear: null, endMonth: null, endDay: null })
    } else if (precision === 'month') {
      patch({ precision, startMonth: value.startMonth ?? 1, startDay: null, endYear: null, endMonth: null, endDay: null })
    } else {
      patch({ precision, startMonth: value.startMonth ?? 1, startDay: value.startDay ?? 1 })
    }
  }

  return (
    <fieldset className="date-fieldset">
      <legend>When</legend>
      <div className="precision-tabs" aria-label="Date precision">
        <button type="button" className={value.precision === 'day' ? 'is-active' : ''} onClick={() => setPrecision('day')}>日まで</button>
        <button type="button" className={value.precision === 'month' ? 'is-active' : ''} onClick={() => setPrecision('month')}>月まで</button>
        <button type="button" className={value.precision === 'year' ? 'is-active' : ''} onClick={() => setPrecision('year')}>年のみ</button>
      </div>

      {value.precision === 'year' && (
        <label className="field-row">
          <span>Year</span>
          <input type="number" min="1800" max="2200" value={value.startYear} onChange={(e) => patch({ startYear: Number(e.target.value) })} />
        </label>
      )}

      {value.precision === 'month' && (
        <div className="field-row field-row--split">
          <label><span>Year</span><input type="number" min="1800" max="2200" value={value.startYear} onChange={(e) => patch({ startYear: Number(e.target.value) })} /></label>
          <label><span>Month</span><input type="number" min="1" max="12" value={value.startMonth ?? 1} onChange={(e) => patch({ startMonth: Number(e.target.value) })} /></label>
        </div>
      )}

      {value.precision === 'day' && (
        <div className="field-row field-row--split">
          <label>
            <span>From</span>
            <input type="date" value={isoDate(value.startYear, value.startMonth, value.startDay)} onChange={(e) => {
              const [year, month, day] = e.target.value.split('-').map(Number)
              if (year) patch({ startYear: year, startMonth: month, startDay: day })
            }} />
          </label>
          <label>
            <span>To <small>optional</small></span>
            <input type="date" value={isoDate(value.endYear, value.endMonth, value.endDay)} onChange={(e) => {
              if (!e.target.value) return patch({ endYear: null, endMonth: null, endDay: null })
              const [year, month, day] = e.target.value.split('-').map(Number)
              patch({ endYear: year, endMonth: month, endDay: day })
            }} />
          </label>
        </div>
      )}
      <p className="field-help">分かるところまでで保存できます。例：2010 / 2010.08 / 2026.08.01—08.08</p>
    </fieldset>
  )
}
