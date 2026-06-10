export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Deterministic pick keyed on a seed so the same shot gives the same phrasing. */
export function pickSeeded<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.floor(seed)) % arr.length]
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function fmtScoreToPar(strokes: number, par: number): string {
  const d = strokes - par
  if (d === 0) return 'E'
  return d > 0 ? `+${d}` : `${d}`
}

export function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(10, 30, 0, 0)
  return d.toISOString()
}
