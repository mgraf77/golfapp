/** On-device voice for the caddie + lesson narration (Web Speech API, free). */

let enabled = false

export function voiceAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on
  if (!on) stopSpeaking()
}

export function voiceEnabled(): boolean {
  return enabled
}

export function speak(text: string, opts?: { force?: boolean; rate?: number }): void {
  if (!voiceAvailable()) return
  if (!enabled && !opts?.force) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = opts?.rate ?? 1.02
  u.pitch = 1
  // prefer a natural en voice when available
  const voices = window.speechSynthesis.getVoices()
  const preferred =
    voices.find((v) => /en[-_]US/i.test(v.lang) && /natural|premium|enhanced|neural/i.test(v.name)) ??
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices.find((v) => v.lang.startsWith('en'))
  if (preferred) u.voice = preferred
  window.speechSynthesis.speak(u)
}

export function stopSpeaking(): void {
  if (voiceAvailable()) window.speechSynthesis.cancel()
}

/** Speak and resolve when finished (for narrated video scenes). */
export function speakAsync(text: string, rate = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (!voiceAvailable()) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find((v) => /en[-_]US/i.test(v.lang) && /natural|premium|enhanced|neural/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith('en'))
    if (preferred) u.voice = preferred
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}
