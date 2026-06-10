// Generates simple PNG app icons (no native deps) — run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let c = -1
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4)
  const s = size / 512 // scale from 512 design space
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    // simple alpha-over
    const na = a / 255
    px[i] = Math.round(r * na + px[i] * (1 - na))
    px[i + 1] = Math.round(g * na + px[i + 1] * (1 - na))
    px[i + 2] = Math.round(b * na + px[i + 2] * (1 - na))
    px[i + 3] = Math.max(px[i + 3], a)
  }
  const cx = size / 2
  const cy = size / 2
  // background: rounded rect with radial-ish gradient
  const rad = 110 * s
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // rounded-rect mask
      const dx = Math.max(rad - x, x - (size - 1 - rad), 0)
      const dy = Math.max(rad - y, y - (size - 1 - rad), 0)
      if (dx * dx + dy * dy > rad * rad) continue
      const d = Math.hypot(x - size * 0.35, y - size * 0.3) / size
      const t = Math.min(1, d / 0.9)
      const r = Math.round(19 * (1 - t) + 11 * t)
      const g = Math.round(37 * (1 - t) + 18 * t)
      const b = Math.round(30 * (1 - t) + 16 * t)
      set(x, y, r, g, b, 255)
    }
  }
  // ring
  const ringR = 172 * s
  const ringW = 14 * s
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (Math.abs(d - ringR) <= ringW / 2) {
        const ang = Math.atan2(y - cy, x - cx) // -PI..PI, 0 = right
        let a = ang + Math.PI / 2 // start at top
        if (a < 0) a += Math.PI * 2
        const frac = a / (Math.PI * 2)
        if (frac <= 0.75) set(x, y, 16, 185, 129, 255)
        else set(x, y, 29, 58, 48, 255)
      }
    }
  }
  // flag pole
  const poleX = 232 * s
  const poleW = 14 * s
  for (let y = Math.round(138 * s); y <= Math.round(356 * s); y++) {
    for (let x = Math.round(poleX - poleW / 2); x <= Math.round(poleX + poleW / 2); x++) {
      set(x, y, 229, 231, 235, 255)
    }
  }
  // flag triangle: (232,138) (340,176) (232,214)
  const x1 = 232 * s, y1 = 138 * s, x2 = 340 * s, y2 = 176 * s, x3 = 232 * s, y3 = 214 * s
  const signFn = (ax, ay, bx, by, cx2, cy2) => (ax - cx2) * (by - cy2) - (bx - cx2) * (ay - cy2)
  for (let y = Math.floor(y1); y <= Math.ceil(y3); y++) {
    for (let x = Math.floor(x1); x <= Math.ceil(x2); x++) {
      const d1 = signFn(x, y, x1, y1, x2, y2)
      const d2 = signFn(x, y, x2, y2, x3, y3)
      const d3 = signFn(x, y, x3, y3, x1, y1)
      const neg = d1 < 0 || d2 < 0 || d3 < 0
      const pos = d1 > 0 || d2 > 0 || d3 > 0
      if (!(neg && pos)) set(x, y, 52, 211, 153, 255)
    }
  }
  return encodePNG(size, size, px)
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', drawIcon(192))
writeFileSync('public/icons/icon-512.png', drawIcon(512))
console.log('icons generated')
