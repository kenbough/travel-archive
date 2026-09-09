export const prefectures: Array<{ code: string; en: string; ja: string }> = [
  ['01','Hokkaido','北海道'],['02','Aomori','青森県'],['03','Iwate','岩手県'],['04','Miyagi','宮城県'],['05','Akita','秋田県'],['06','Yamagata','山形県'],['07','Fukushima','福島県'],
  ['08','Ibaraki','茨城県'],['09','Tochigi','栃木県'],['10','Gunma','群馬県'],['11','Saitama','埼玉県'],['12','Chiba','千葉県'],['13','Tokyo','東京都'],['14','Kanagawa','神奈川県'],
  ['15','Niigata','新潟県'],['16','Toyama','富山県'],['17','Ishikawa','石川県'],['18','Fukui','福井県'],['19','Yamanashi','山梨県'],['20','Nagano','長野県'],
  ['21','Gifu','岐阜県'],['22','Shizuoka','静岡県'],['23','Aichi','愛知県'],['24','Mie','三重県'],['25','Shiga','滋賀県'],['26','Kyoto','京都府'],['27','Osaka','大阪府'],['28','Hyogo','兵庫県'],['29','Nara','奈良県'],['30','Wakayama','和歌山県'],
  ['31','Tottori','鳥取県'],['32','Shimane','島根県'],['33','Okayama','岡山県'],['34','Hiroshima','広島県'],['35','Yamaguchi','山口県'],
  ['36','Tokushima','徳島県'],['37','Kagawa','香川県'],['38','Ehime','愛媛県'],['39','Kochi','高知県'],
  ['40','Fukuoka','福岡県'],['41','Saga','佐賀県'],['42','Nagasaki','長崎県'],['43','Kumamoto','熊本県'],['44','Oita','大分県'],['45','Miyazaki','宮崎県'],['46','Kagoshima','鹿児島県'],['47','Okinawa','沖縄県'],
].map(([code,en,ja]) => ({ code, en, ja }))

export const prefectureNameByCode = Object.fromEntries(prefectures.map((p) => [p.code, p.en]))

export function parsePrefectureTokens(value: string): string[] {
  const tokens = value.split(',').map((token) => token.trim()).filter(Boolean)
  const codes = tokens.map((token) => {
    if (/^\d{1,2}$/.test(token)) return token.padStart(2, '0')
    const normalized = token.toLowerCase()
    return prefectures.find((p) => p.en.toLowerCase() === normalized || p.ja === token)?.code
  }).filter((code): code is string => Boolean(code))
  return [...new Set(codes)]
}
