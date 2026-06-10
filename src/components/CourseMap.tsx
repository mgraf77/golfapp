import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoHole, LatLng } from '../types/geo'
import type { GpsFix } from '../lib/geo'
import { destinationYds, distYds } from '../lib/geo'

/**
 * Satellite hole view. Esri World Imagery tiles (keyless), full hole
 * geometry from the downloaded course file, draggable pin + target,
 * live GPS dot, and the caddie's dispersion ellipse.
 */

interface Props {
  hole: GeoHole
  pin: LatLng
  onPinChange?: (p: LatLng) => void
  target?: LatLng | null
  onTargetChange?: (p: LatLng | null) => void
  fix?: GpsFix | null
  /** Dispersion ellipse: center + 1σ axes (yards) oriented along shot bearing. */
  ellipse?: { center: LatLng; sigmaLong: number; sigmaLat: number; bearing: number } | null
  aim?: LatLng | null
  className?: string
}

const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const dotIcon = (cls: string, label?: string) =>
  L.divIcon({
    className: '',
    html: `<div class="${cls}">${label ?? ''}</div>`,
    iconSize: [0, 0],
  })

export function CourseMap({ hole, pin, onPinChange, target, onTargetChange, fix, ellipse, aim, className = '' }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup | null>(null)
  const dynamicRef = useRef<L.LayerGroup | null>(null)
  const cbRef = useRef({ onPinChange, onTargetChange })
  cbRef.current = { onPinChange, onTargetChange }

  // init once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, {
      zoomControl: false,
      attributionControl: false,
    })
    L.tileLayer(TILE_URL, { maxZoom: 21, maxNativeZoom: 19 }).addTo(map)
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('Esri, Maxar | © OSM')
      .addTo(map)
    layersRef.current = L.layerGroup().addTo(map)
    dynamicRef.current = L.layerGroup().addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      cbRef.current.onTargetChange?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // static hole geometry — redraw when the hole changes
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    layers.clearLayers()

    for (const hz of hole.hazards) {
      const ring = hz.ring.map((p) => [p.lat, p.lng]) as [number, number][]
      if (hz.type === 'water') {
        L.polygon(ring, { color: '#38bdf8', weight: 1.5, fillColor: '#0ea5e9', fillOpacity: 0.35 }).addTo(layers)
      } else if (hz.type === 'bunker') {
        L.polygon(ring, { color: '#fbe4b3', weight: 1, fillColor: '#f6d693', fillOpacity: 0.5 }).addTo(layers)
      } else if (hz.type === 'fairway') {
        L.polygon(ring, { color: '#34d399', weight: 1.2, opacity: 0.5, fill: false, dashArray: '4 5' }).addTo(layers)
      }
    }
    if (hole.greenRing) {
      L.polygon(hole.greenRing.map((p) => [p.lat, p.lng]) as [number, number][], {
        color: '#6ee7b7', weight: 2, fillColor: '#10b981', fillOpacity: 0.18,
      }).addTo(layers)
    }
    L.polyline(hole.line.map((p) => [p.lat, p.lng]) as [number, number][], {
      color: '#ffffff', weight: 1.5, opacity: 0.55, dashArray: '2 7',
    }).addTo(layers)
    L.marker([hole.tee.lat, hole.tee.lng], { icon: dotIcon('map-tee', 'T'), interactive: false }).addTo(layers)

    const pad = 0.15
    const bounds = L.latLngBounds(hole.line.map((p) => [p.lat, p.lng]) as [number, number][])
    if (hole.greenRing) for (const p of hole.greenRing) bounds.extend([p.lat, p.lng])
    map.fitBounds(bounds.pad(pad))
  }, [hole])

  // dynamic layer — pin, target, gps, lines, ellipse
  useEffect(() => {
    const map = mapRef.current
    const dyn = dynamicRef.current
    if (!map || !dyn) return
    dyn.clearLayers()

    // pin (draggable)
    const pinMarker = L.marker([pin.lat, pin.lng], {
      icon: dotIcon('map-pin', '⛳'),
      draggable: !!onPinChange,
    }).addTo(dyn)
    if (onPinChange) {
      pinMarker.on('dragend', () => {
        const p = pinMarker.getLatLng()
        cbRef.current.onPinChange?.({ lat: p.lat, lng: p.lng })
      })
    }

    // player position
    if (fix) {
      L.circle([fix.lat, fix.lng], {
        radius: Math.min(fix.accuracyM, 40),
        color: '#60a5fa', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.12,
      }).addTo(dyn)
      L.marker([fix.lat, fix.lng], { icon: dotIcon('map-me'), interactive: false }).addTo(dyn)
    }

    const from: LatLng | null = fix ?? hole.tee
    // target + measurement lines
    if (target) {
      const t = L.marker([target.lat, target.lng], { icon: dotIcon('map-target'), draggable: true }).addTo(dyn)
      t.on('dragend', () => {
        const p = t.getLatLng()
        cbRef.current.onTargetChange?.({ lat: p.lat, lng: p.lng })
      })
      if (from) {
        const l1 = L.polyline([[from.lat, from.lng], [target.lat, target.lng]], {
          color: '#fbbf24', weight: 2, opacity: 0.9,
        }).addTo(dyn)
        l1.bindTooltip(`${Math.round(distYds(from, target))}`, {
          permanent: true, direction: 'center', className: 'map-label',
        })
        const l2 = L.polyline([[target.lat, target.lng], [pin.lat, pin.lng]], {
          color: '#fbbf24', weight: 2, opacity: 0.55, dashArray: '5 6',
        }).addTo(dyn)
        l2.bindTooltip(`${Math.round(distYds(target, pin))}`, {
          permanent: true, direction: 'center', className: 'map-label map-label-dim',
        })
      }
    } else if (from) {
      const l = L.polyline([[from.lat, from.lng], [pin.lat, pin.lng]], {
        color: '#fbbf24', weight: 2, opacity: 0.75, dashArray: '1 8',
      }).addTo(dyn)
      l.bindTooltip(`${Math.round(distYds(from, pin))}`, {
        permanent: true, direction: 'center', className: 'map-label',
      })
    }

    // caddie aim point
    if (aim && (!target || distYds(aim, target) > 4)) {
      L.marker([aim.lat, aim.lng], { icon: dotIcon('map-aim', 'AI'), interactive: false }).addTo(dyn)
    }

    // dispersion ellipse (2σ ≈ 95% of shots)
    if (ellipse) {
      const pts: [number, number][] = []
      for (let a = 0; a < 360; a += 12) {
        const rad = (a * Math.PI) / 180
        const dLong = Math.cos(rad) * ellipse.sigmaLong * 2
        const dLat = Math.sin(rad) * ellipse.sigmaLat * 2
        const dist = Math.hypot(dLong, dLat)
        const ang = ellipse.bearing + (Math.atan2(dLat, dLong) * 180) / Math.PI
        const p = destinationYds(ellipse.center, ang, dist)
        pts.push([p.lat, p.lng])
      }
      L.polygon(pts, { color: '#fbbf24', weight: 1.2, opacity: 0.6, fillColor: '#fbbf24', fillOpacity: 0.08, dashArray: '3 4' }).addTo(dyn)
    }
  }, [hole, pin, target, fix, ellipse, aim, onPinChange])

  return <div ref={elRef} className={`leaflet-dark ${className}`} />
}
