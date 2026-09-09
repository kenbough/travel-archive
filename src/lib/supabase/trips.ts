import type { User } from '@supabase/supabase-js'
import { getSupabase } from './client'
import type { Category, NewTripInput, Trip } from '../types'

function mapTrip(row: any): Trip {
  return {
    id: row.id,
    title: row.title || 'Untitled journey',
    categoryId: row.category_id,
    date: {
      precision: row.date_precision,
      startYear: row.start_year,
      startMonth: row.start_month,
      startDay: row.start_day,
      endYear: row.end_year,
      endMonth: row.end_month,
      endDay: row.end_day,
    },
    countryCodes: (row.trip_countries ?? []).map((item: any) => item.country_code),
    prefectureCodes: (row.trip_prefectures ?? []).map((item: any) => item.prefecture_code),
    places: [...(row.trip_places ?? [])]
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item: any) => item.name),
    memo: row.memo ?? undefined,
  }
}

export async function fetchArchiveData(): Promise<{ categories: Category[]; trips: Trip[] }> {
  const supabase = getSupabase()
  if (!supabase) return { categories: [], trips: [] }

  const [categoriesResult, tripsResult] = await Promise.all([
    supabase.from('categories').select('id,name,color,sort_order').order('sort_order'),
    supabase
      .from('trips')
      .select('id,category_id,title,memo,date_precision,start_year,start_month,start_day,end_year,end_month,end_day,trip_countries(country_code),trip_prefectures(prefecture_code),trip_places(name,sort_order)')
      .order('start_year', { ascending: false })
      .order('start_month', { ascending: false, nullsFirst: false })
      .order('start_day', { ascending: false, nullsFirst: false }),
  ])

  if (categoriesResult.error) throw categoriesResult.error
  if (tripsResult.error) throw tripsResult.error

  return {
    categories: (categoriesResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      sortOrder: row.sort_order,
    })),
    trips: (tripsResult.data ?? []).map(mapTrip),
  }
}

export async function createTrip(user: User, input: NewTripInput): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      category_id: input.categoryId,
      title: input.title || null,
      memo: input.memo || null,
      date_precision: input.date.precision,
      start_year: input.date.startYear,
      start_month: input.date.startMonth ?? null,
      start_day: input.date.startDay ?? null,
      end_year: input.date.endYear ?? null,
      end_month: input.date.endMonth ?? null,
      end_day: input.date.endDay ?? null,
    })
    .select('id')
    .single()

  if (error) throw error

  const writes: PromiseLike<any>[] = []
  if (input.countryCodes.length) {
    writes.push(supabase.from('trip_countries').insert(input.countryCodes.map((country_code) => ({ trip_id: trip.id, country_code }))))
  }
  if (input.prefectureCodes.length) {
    writes.push(supabase.from('trip_prefectures').insert(input.prefectureCodes.map((prefecture_code) => ({ trip_id: trip.id, prefecture_code }))))
  }
  if (input.places.length) {
    writes.push(supabase.from('trip_places').insert(input.places.map((name, index) => ({ trip_id: trip.id, name, sort_order: index }))))
  }

  const results = await Promise.all(writes)
  const childError = results.find((result: any) => result.error)?.error
  if (childError) throw childError
}
