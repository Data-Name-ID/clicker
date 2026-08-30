const UNITS: [number, string][] = [
  [1e3, 'тыс'],
  [1e6, 'млн'],
  [1e9, 'млрд'],
  [1e12, 'трлн'],
]

const withComma = (s: string): string => s.replace('.', ',').replace(/,0$/, '')

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞'
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(n)
  if (abs >= 1e15) return sign + abs.toExponential(1).replace('e+', 'e')
  if (abs < 1000) return sign + String(Math.floor(abs))
  let tier = UNITS.findLastIndex(([threshold]) => abs >= threshold)
  let value = Math.round((abs / UNITS[tier][0]) * 10) / 10
  if (value >= 1000 && tier < UNITS.length - 1) {
    tier += 1
    value = 1
  }
  return `${sign}${withComma(value.toFixed(1))} ${UNITS[tier][1]}`
}

export function formatRate(n: number): string {
  if (Math.abs(n) < 1000) {
    const sign = n < 0 ? '−' : ''
    return sign + withComma(Math.abs(n).toFixed(1))
  }
  return formatNumber(n)
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
