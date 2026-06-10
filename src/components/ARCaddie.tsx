import { useEffect, useRef, useState } from 'react'
import { angleDelta } from '../lib/geo'

/**
 * AR aim mode: live rear camera with a compass-driven target line.
 * Rotate until the needle centers — you're aimed at the pin — then the
 * overlay shows front/center/back numbers and the caddie's club.
 * (Glasses-ready: the overlay layer is isolated from the camera layer.)
 */

interface Props {
  onClose: () => void
  targetBearing: number
  distances: { f: number; c: number; b: number }
  clubShort: string
  playsLike: number
}

export function ARCaddie({ onClose, targetBearing, distances, clubShort, playsLike }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [camera, setCamera] = useState<'pending' | 'live' | 'denied'>('pending')
  const [heading, setHeading] = useState<number | null>(null)
  const [needsPermission, setNeedsPermission] = useState(false)

  // camera
  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
        setCamera('live')
      })
      .catch(() => setCamera('denied'))
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  // compass
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      if (typeof webkitHeading === 'number') setHeading(webkitHeading)
      else if (e.absolute && e.alpha != null) setHeading((360 - e.alpha) % 360)
      else if (e.alpha != null) setHeading((360 - e.alpha) % 360)
    }
    const needsReq =
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    if (needsReq) setNeedsPermission(true)
    else {
      window.addEventListener('deviceorientationabsolute' as 'deviceorientation', handler, true)
      window.addEventListener('deviceorientation', handler, true)
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute' as 'deviceorientation', handler, true)
      window.removeEventListener('deviceorientation', handler, true)
    }
  }, [])

  async function enableCompass() {
    try {
      const res = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
      if (res === 'granted') {
        window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
          const wk = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
          if (typeof wk === 'number') setHeading(wk)
          else if (e.alpha != null) setHeading((360 - e.alpha) % 360)
        }, true)
      }
    } finally {
      setNeedsPermission(false)
    }
  }

  const delta = heading != null ? angleDelta(heading, targetBearing) : null
  const aligned = delta != null && Math.abs(delta) < 7
  // target line position: shift across screen by compass delta (±40° visible field)
  const lineX = delta != null ? 50 + Math.max(-48, Math.min(48, (delta / 40) * 50)) : null

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {camera === 'live' ? (
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 ar-sky" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />

      {/* target line */}
      {lineX != null && (
        <div
          className="absolute top-0 bottom-0 w-px transition-[left] duration-150"
          style={{ left: `${lineX}%` }}
        >
          <div className={`h-full w-[2.5px] -translate-x-1/2 ${aligned ? 'bg-accent shadow-[0_0_18px_rgba(16,185,129,0.9)]' : 'bg-gold/70'}`} />
          <div className={`absolute top-[30%] left-1/2 -translate-x-1/2 text-2xl ${aligned ? '' : 'opacity-70'}`}>⛳</div>
        </div>
      )}

      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 pt-[max(env(safe-area-inset-top),14px)] px-4 flex items-start justify-between">
        <div className="rounded-xl bg-black/55 backdrop-blur px-3 py-2 border border-white/15">
          <div className="text-[10px] uppercase tracking-wider text-white/60">Caddie</div>
          <div className="text-xl font-extrabold text-white">{clubShort} · {playsLike}</div>
          <div className="text-[10px] text-white/60">plays-like</div>
        </div>
        <button onClick={onClose} className="rounded-xl bg-black/55 border border-white/15 px-4 py-2.5 text-white text-sm font-semibold">
          Close
        </button>
      </div>

      {/* guidance / distances */}
      <div className="absolute bottom-0 left-0 right-0 pb-[max(env(safe-area-inset-bottom),18px)] px-4">
        {heading == null ? (
          <div className="rounded-2xl bg-black/60 backdrop-blur border border-white/15 p-4 text-center">
            {needsPermission ? (
              <>
                <p className="text-white/80 text-sm mb-3">AR aiming uses your phone&apos;s compass.</p>
                <button onClick={enableCompass} className="rounded-xl bg-accent text-[#04130d] font-semibold px-5 py-2.5">
                  Enable compass
                </button>
              </>
            ) : (
              <p className="text-white/70 text-sm">Waiting for compass… move your phone in a figure-8 to calibrate.</p>
            )}
          </div>
        ) : (
          <>
            <div className="text-center mb-2">
              {aligned ? (
                <span className="inline-block rounded-full bg-accent text-[#04130d] text-sm font-bold px-4 py-1.5 animate-pop">
                  🎯 On target — commit to the line
                </span>
              ) : (
                <span className="inline-block rounded-full bg-black/60 border border-gold/40 text-gold text-sm font-semibold px-4 py-1.5">
                  {delta! > 0 ? `Turn right ${Math.round(Math.abs(delta!))}°  →` : `←  Turn left ${Math.round(Math.abs(delta!))}°`}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([['FRONT', distances.f], ['CENTER', distances.c], ['BACK', distances.b]] as const).map(([l, v]) => (
                <div key={l} className="rounded-xl bg-black/60 backdrop-blur border border-white/15 py-2 text-center">
                  <div className="text-[9px] tracking-widest text-white/50">{l}</div>
                  <div className={`text-2xl font-extrabold tabular-nums ${l === 'CENTER' ? 'text-accent-bright' : 'text-white'}`}>{v}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
