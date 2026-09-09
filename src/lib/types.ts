export type DatePrecision = 'year' | 'month' | 'day'

export type TripDate = {
  precision: DatePrecision
  startYear: number
  startMonth?: number | null
  startDay?: number | null
  endYear?: number | null
  endMonth?: number | null
  endDay?: number | null
}

export type Category = {
  id: string
  name: string
  color: string
  sortOrder?: number
}

export type Trip = {
  id: string
  title: string
  date: TripDate
  categoryId: string
  countryCodes: string[]
  prefectureCodes: string[]
  places: string[]
  memo?: string
}

export type NewTripInput = Omit<Trip, 'id'>
