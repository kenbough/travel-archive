import type { TripDate } from './types'

const pad2 = (value: number) => String(value).padStart(2, '0')

export function formatTripDate(date: TripDate): string {
  if (date.precision === 'year') {
    return date.endYear && date.endYear !== date.startYear
      ? `${date.startYear}—${date.endYear}`
      : `${date.startYear}`
  }

  if (date.precision === 'month') {
    const start = `${date.startYear}.${pad2(date.startMonth ?? 1)}`
    if (!date.endYear || !date.endMonth) return start
    const end = `${date.endYear}.${pad2(date.endMonth)}`
    return start === end ? start : `${start}—${end}`
  }

  const start = `${date.startYear}.${pad2(date.startMonth ?? 1)}.${pad2(date.startDay ?? 1)}`
  if (!date.endYear || !date.endMonth || !date.endDay) return start

  if (date.endYear === date.startYear && date.endMonth === date.startMonth) {
    return `${start}—${pad2(date.endDay)}`
  }
  if (date.endYear === date.startYear) {
    return `${start}—${pad2(date.endMonth)}.${pad2(date.endDay)}`
  }
  return `${start}—${date.endYear}.${pad2(date.endMonth)}.${pad2(date.endDay)}`
}

export function knownDurationDays(date: TripDate): number | null {
  if (date.precision !== 'day' || !date.startMonth || !date.startDay) return null
  if (!date.endYear || !date.endMonth || !date.endDay) return 1

  const start = Date.UTC(date.startYear, date.startMonth - 1, date.startDay)
  const end = Date.UTC(date.endYear, date.endMonth - 1, date.endDay)
  if (end < start) return null
  return Math.floor((end - start) / 86_400_000) + 1
}

export function isVisibleByYear(date: TripDate, selectedYear: number): boolean {
  return date.startYear <= selectedYear
}

export function compareTripDatesDesc(a: TripDate, b: TripDate): number {
  return (
    b.startYear - a.startYear ||
    (b.startMonth ?? 0) - (a.startMonth ?? 0) ||
    (b.startDay ?? 0) - (a.startDay ?? 0)
  )
}
