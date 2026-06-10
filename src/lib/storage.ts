import type { AppState } from '../types'

const KEY = 'truecaddie-state-v1'

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || typeof parsed !== 'object' || !parsed.profile) return null
    return migrate(parsed)
  } catch {
    return null
  }
}

/** Forward-migrate older persisted states so updates never wipe user data. */
function migrate(s: AppState): AppState {
  if (s.version >= 2) return s
  return { ...s, version: 2, scores: s.scores ?? [] }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full / private mode — prototype silently continues in memory
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `truecaddie-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
