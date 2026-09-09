import { useEffect, useState, type FormEvent } from 'react'
import { TripDateInput } from './TripDateInput'
import { parseCountryTokens } from '../lib/iso-country'
import { parsePrefectureTokens } from '../lib/prefectures'
import type { Category, NewTripInput, TripDate } from '../lib/types'
import { hrefFor, navigate } from '../hooks/useHashRoute'

const now = new Date()
const initialDate: TripDate = {
  precision: 'day', startYear: now.getFullYear(), startMonth: now.getMonth() + 1, startDay: now.getDate(),
}

export function NewTripPage({ categories, onAddTrip, isDemo }: {
  categories: Category[]
  onAddTrip: (trip: NewTripInput) => Promise<void>
  isDemo: boolean
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [date, setDate] = useState<TripDate>(initialDate)
  const [title, setTitle] = useState('')
  const [countries, setCountries] = useState('')
  const [prefectures, setPrefectures] = useState('')
  const [places, setPlaces] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const countryCodes = parseCountryTokens(countries)
    const prefectureCodes = parsePrefectureTokens(prefectures)
    if (!categoryId) return setError('カテゴリーを選んでください。')
    if (!countryCodes.length && !prefectureCodes.length) return setError('国または都道府県を1つ以上入力してください。')

    const placeList = places.split(',').map((item) => item.trim()).filter(Boolean)
    const fallbackTitle = placeList[0] || countries.split(',')[0]?.trim() || prefectures.split(',')[0]?.trim() || `${date.startYear} trip`
    setBusy(true)
    setError(null)
    try {
      await onAddTrip({
        title: title.trim() || fallbackTitle,
        categoryId,
        date,
        countryCodes,
        prefectureCodes,
        places: placeList,
        memo: memo.trim() || undefined,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存できませんでした。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="trip-form-wrap">
      <div className="trip-form-heading">
        <p className="section-kicker">Record a journey</p>
        <h1>新しい旅を追加</h1>
        {isDemo && <p className="lede">DEMOでは保存はこの画面を開いている間だけです。Supabase接続後はPC・スマホで同期します。</p>}
      </div>
      <form className="trip-form" onSubmit={submit}>
        <label className="stacked-field">
          <span>Title <small>optional</small></span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：韓国・ソウル旅行" />
        </label>

        <TripDateInput onChange={setDate} />

        <fieldset className="category-fieldset">
          <legend>Category</legend>
          <div className="category-choices">
            {categories.map((item) => (
              <button type="button" key={item.id} className={categoryId === item.id ? 'category-choice is-active' : 'category-choice'} onClick={() => setCategoryId(item.id)}>
                <span className="color-dot" style={{ background: item.color }} />{item.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="where-fieldset">
          <legend>Where</legend>
          <div className="field-row field-row--split">
            <label><span>Country</span><input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="South Korea, THA" /></label>
            <label><span>Prefecture <small>Japan only</small></span><input value={prefectures} onChange={(e) => setPrefectures(e.target.value)} placeholder="Nagano, 東京都" /></label>
          </div>
          <p className="field-help">複数ある場合はカンマ区切り。国は英語名または3文字コード、都道府県は日本語・英語・番号に対応。</p>
          <label className="stacked-field"><span>Places <small>optional</small></span><input value={places} onChange={(e) => setPlaces(e.target.value)} placeholder="Seoul, Busan" /></label>
        </fieldset>

        <label className="stacked-field">
          <span>Memo <small>optional</small></span>
          <textarea rows={4} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="記憶、目的、誰と行ったかなど" />
        </label>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <a href={hrefFor('/')}>Cancel</a>
          <button type="submit" className="primary-button" disabled={busy}>{busy ? '保存中…' : '保存する'}</button>
        </div>
      </form>
    </section>
  )
}
