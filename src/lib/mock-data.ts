import type { Category, Trip } from './types'

export const demoCategories: Category[] = [
  { id: 'personal', name: 'Personal', color: '#3E7FA6', sortOrder: 10 },
  { id: 'family', name: 'Family', color: '#D69C2F', sortOrder: 20 },
  { id: 'work', name: 'Work', color: '#B8463B', sortOrder: 30 },
  { id: 'solo', name: 'Solo', color: '#43816A', sortOrder: 40 },
  { id: 'other', name: 'Other', color: '#85837C', sortOrder: 50 },
]

export const demoTrips: Trip[] = [
  {
    id: 'kr-2026', title: '韓国・ソウル旅行', categoryId: 'personal',
    date: { precision: 'day', startYear: 2026, startMonth: 8, startDay: 1, endYear: 2026, endMonth: 8, endDay: 8 },
    countryCodes: ['KOR'], prefectureCodes: [], places: ['Seoul'],
  },
  {
    id: 'th-2024', title: 'Thailand', categoryId: 'personal',
    date: { precision: 'day', startYear: 2024, startMonth: 12, startDay: 29, endYear: 2025, endMonth: 1, endDay: 5 },
    countryCodes: ['THA'], prefectureCodes: [], places: ['Bangkok', 'Chiang Mai'],
  },
  {
    id: 'us-2023', title: 'Hawaii', categoryId: 'personal',
    date: { precision: 'month', startYear: 2023, startMonth: 10 },
    countryCodes: ['USA'], prefectureCodes: [], places: ['Hawaii Island'],
  },
  {
    id: 'jp-nagano-2026', title: '木曽駒ヶ岳', categoryId: 'personal',
    date: { precision: 'day', startYear: 2026, startMonth: 8, startDay: 6 },
    countryCodes: ['JPN'], prefectureCodes: ['20'], places: ['Nagano'],
  },
  {
    id: 'kr-2019', title: 'Seoul — Work', categoryId: 'work',
    date: { precision: 'month', startYear: 2019, startMonth: 11 },
    countryCodes: ['KOR'], prefectureCodes: [], places: ['Seoul'],
  },
  {
    id: 'fr-2010', title: 'France', categoryId: 'personal',
    date: { precision: 'year', startYear: 2010 },
    countryCodes: ['FRA'], prefectureCodes: [], places: ['France'],
    memo: '日付不詳。2010年に訪問。',
  },
  {
    id: 'jp-tokyo-2010', title: '東京', categoryId: 'work',
    date: { precision: 'month', startYear: 2010, startMonth: 8 },
    countryCodes: ['JPN'], prefectureCodes: ['13'], places: ['Tokyo'],
  },
  {
    id: 'cz-2006', title: 'Czech Republic', categoryId: 'solo',
    date: { precision: 'year', startYear: 2006 },
    countryCodes: ['CZE'], prefectureCodes: [], places: ['Prague'],
  },
]
