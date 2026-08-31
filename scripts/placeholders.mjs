import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'sprites')

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

class Canvas {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.pixels = Buffer.alloc(width * height * 4)
  }

  set(x, y, [r, g, b, a = 255]) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    const i = (y * this.width + x) * 4
    this.pixels[i] = r
    this.pixels[i + 1] = g
    this.pixels[i + 2] = b
    this.pixels[i + 3] = a
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return [0, 0, 0, 0]
    const i = (y * this.width + x) * 4
    return [this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], this.pixels[i + 3]]
  }

  fill(shape, color) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (shape(x, y)) this.set(x, y, color)
      }
    }
  }

  rect(x0, y0, w, h, color) {
    this.fill((x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h, color)
  }

  circle(cx, cy, r, color) {
    this.fill((x, y) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r, color)
  }

  outline(color) {
    const alpha = (x, y) => this.get(x, y)[3]
    const edges = []
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (alpha(x, y) === 0) continue
        if (!alpha(x - 1, y) || !alpha(x + 1, y) || !alpha(x, y - 1) || !alpha(x, y + 1)) edges.push([x, y])
      }
    }
    for (const [x, y] of edges) this.set(x, y, color)
  }

  save(name) {
    writeFileSync(join(OUT, `${name}.png`), encodePng(this.width, this.height, this.pixels))
  }
}

const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}

const shade = ([r, g, b], k) => [Math.round(r * k), Math.round(g * k), Math.round(b * k), 255]

const ORE = [232, 164, 74]
const ALLOY = [90, 209, 230]
const CHIP = [124, 240, 90]
const DARK = [192, 90, 240]
const STEEL = [150, 160, 180]

function asteroid(index, base) {
  const size = 96
  const c = new Canvas(size, size)
  const random = rng(7 + index * 101)
  const bumps = Array.from({ length: 12 }, () => 0.82 + random() * 0.18)
  const radiusAt = (angle) => {
    const t = ((angle / (Math.PI * 2)) * bumps.length + bumps.length) % bumps.length
    const i = Math.floor(t)
    const f = t - i
    return 40 * (bumps[i] * (1 - f) + bumps[(i + 1) % bumps.length] * f)
  }
  c.fill((x, y) => {
    const dx = x + 0.5 - size / 2
    const dy = y + 0.5 - size / 2
    return Math.hypot(dx, dy) <= radiusAt(Math.atan2(dy, dx))
  }, shade(base, 1))
  c.fill((x, y) => {
    const dx = x + 0.5 - size / 2
    const dy = y + 0.5 - size / 2
    const r = Math.hypot(dx, dy)
    return r <= radiusAt(Math.atan2(dy, dx)) && dx + dy > 30
  }, shade(base, 0.75))
  c.fill((x, y) => {
    const dx = x + 0.5 - size / 2
    const dy = y + 0.5 - size / 2
    const r = Math.hypot(dx, dy)
    return r <= radiusAt(Math.atan2(dy, dx)) && dx + dy < -30
  }, shade(base, 1.2))
  for (let i = 0; i < 6; i += 1) {
    const cx = 24 + random() * 48
    const cy = 24 + random() * 48
    const r = 3 + random() * 5
    c.circle(cx, cy, r, shade(base, 0.6))
    c.circle(cx - 1, cy - 1, r - 1.5, shade(base, 0.85))
  }
  c.outline(shade(base, 0.4))
  c.save(`asteroid-${index}`)
}

function shard() {
  const c = new Canvas(8, 8)
  c.fill((x, y) => Math.abs(x - 3.5) + Math.abs(y - 3.5) <= 3.5, shade(ORE, 1))
  c.outline(shade(ORE, 0.5))
  c.save('shard')
}

function meteor() {
  const c = new Canvas(16, 16)
  c.fill((x, y) => x + y >= 10 && x + y <= 22 && Math.abs(x - y) <= 5 && x + y >= 14, [255, 200, 90, 160])
  c.circle(5, 11, 4.5, [255, 140, 40, 255])
  c.circle(4, 12, 2.5, [255, 230, 120, 255])
  c.outline([120, 50, 20, 255])
  c.save('meteor')
}

function building(name, draw) {
  const c = new Canvas(32, 32)
  draw(c)
  c.outline([20, 24, 40, 255])
  c.save(`building-${name}`)
}

building('drone', (c) => {
  c.rect(12, 12, 8, 8, shade(STEEL, 1))
  c.rect(4, 6, 6, 3, shade(STEEL, 0.8))
  c.rect(22, 6, 6, 3, shade(STEEL, 0.8))
  c.rect(4, 23, 6, 3, shade(STEEL, 0.8))
  c.rect(22, 23, 6, 3, shade(STEEL, 0.8))
  c.rect(9, 9, 3, 3, shade(STEEL, 0.6))
  c.rect(20, 9, 3, 3, shade(STEEL, 0.6))
  c.rect(9, 20, 3, 3, shade(STEEL, 0.6))
  c.rect(20, 20, 3, 3, shade(STEEL, 0.6))
  c.rect(14, 20, 4, 6, shade(ORE, 1))
})

building('excavator', (c) => {
  c.rect(4, 22, 18, 6, shade([70, 70, 80], 1))
  c.rect(6, 14, 12, 8, shade(ORE, 0.9))
  c.rect(8, 16, 4, 4, shade(ALLOY, 0.9))
  c.rect(17, 8, 3, 10, shade(ORE, 0.7))
  c.rect(19, 4, 8, 3, shade(ORE, 0.7))
  c.rect(25, 7, 4, 6, shade(STEEL, 0.7))
})

building('smelter', (c) => {
  c.rect(6, 12, 20, 16, shade([120, 90, 80], 1))
  c.rect(10, 4, 4, 8, shade([90, 70, 60], 1))
  c.rect(18, 6, 4, 6, shade([90, 70, 60], 1))
  c.rect(10, 18, 12, 6, shade([255, 110, 40], 1))
  c.rect(13, 20, 6, 3, shade([255, 220, 120], 1))
})

building('factory', (c) => {
  c.rect(4, 14, 24, 14, shade([80, 100, 130], 1))
  c.rect(6, 8, 4, 6, shade([60, 75, 100], 1))
  c.rect(12, 10, 4, 4, shade([60, 75, 100], 1))
  c.rect(8, 18, 4, 4, shade(CHIP, 1))
  c.rect(14, 18, 4, 4, shade(CHIP, 1))
  c.rect(20, 18, 4, 4, shade(CHIP, 1))
})

building('laser', (c) => {
  c.rect(6, 20, 20, 6, shade(STEEL, 0.9))
  c.rect(12, 14, 8, 6, shade(STEEL, 0.7))
  c.rect(14, 4, 4, 10, shade([255, 80, 120], 1))
  c.rect(15, 2, 2, 3, shade([255, 200, 220], 1))
  c.rect(8, 26, 4, 3, shade(STEEL, 0.5))
  c.rect(20, 26, 4, 3, shade(STEEL, 0.5))
})

function resource(name, draw) {
  const c = new Canvas(16, 16)
  draw(c)
  c.outline([20, 24, 40, 255])
  c.save(`res-${name}`)
}

resource('ore', (c) => {
  c.fill((x, y) => Math.abs(x - 7.5) + Math.abs(y - 8) <= 6, shade(ORE, 1))
  c.rect(5, 5, 3, 3, shade(ORE, 1.25))
})

resource('alloy', (c) => {
  c.fill((x, y) => y >= 5 && y <= 12 && x >= 2 + (12 - y) * 0.3 && x <= 13 - (12 - y) * 0.3, shade(ALLOY, 1))
  c.rect(5, 6, 6, 2, shade(ALLOY, 1.3))
})

resource('chip', (c) => {
  c.rect(4, 4, 8, 8, shade(CHIP, 0.8))
  c.rect(6, 6, 4, 4, shade(CHIP, 1.2))
  for (let i = 0; i < 4; i += 1) {
    c.rect(5 + i * 2, 2, 1, 2, shade(STEEL, 1))
    c.rect(5 + i * 2, 12, 1, 2, shade(STEEL, 1))
    c.rect(2, 5 + i * 2, 2, 1, shade(STEEL, 1))
    c.rect(12, 5 + i * 2, 2, 1, shade(STEEL, 1))
  }
})

resource('darkmatter', (c) => {
  c.circle(8, 8, 6.5, shade(DARK, 1))
  c.circle(8, 8, 4, shade(DARK, 0.5))
  c.circle(8, 8, 2, [20, 10, 40, 255])
  c.rect(4, 4, 2, 2, shade(DARK, 1.3))
})

mkdirSync(OUT, { recursive: true })

const MUTED = [139, 146, 184]

const TAB_ICONS = {
  buildings: [
    '................',
    '................',
    '..##......##....',
    '..##......##....',
    '..##..##..##....',
    '..##..##..##....',
    '..############..',
    '..############..',
    '..#..#..#..#.#..',
    '..############..',
    '..#..##..##..#..',
    '..#..##..##..#..',
    '..############..',
    '..############..',
    '................',
    '................',
  ],
  upgrades: [
    '................',
    '.......##.......',
    '......####......',
    '.....######.....',
    '....########....',
    '...##########...',
    '..############..',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '................',
    '................',
    '................',
  ],
  achievements: [
    '................',
    '.......##.......',
    '......####......',
    '......####......',
    '.....######.....',
    '.##############.',
    '..############..',
    '...##########...',
    '....########....',
    '....########....',
    '...####..####...',
    '...###....###...',
    '..##........##..',
    '................',
    '................',
    '................',
  ],
  prestige: [
    '.......##.......',
    '......####......',
    '......####......',
    '.....######.....',
    '.....##..##.....',
    '.....##..##.....',
    '.....######.....',
    '.....######.....',
    '...##.####.##...',
    '..###.####.###..',
    '..############..',
    '..############..',
    '.....#.##.#.....',
    '......####......',
    '.......##.......',
    '................',
  ],
  settings: [
    '................',
    '......####......',
    '...#..####..#...',
    '..###.####.###..',
    '..############..',
    '...##########...',
    '.####..##..####.',
    '.####......####.',
    '.####......####.',
    '.####..##..####.',
    '...##########...',
    '..############..',
    '..###.####.###..',
    '...#..####..#...',
    '......####......',
    '................',
  ],
}

function bitmap(name, rows, color, palette = {}) {
  const c = new Canvas(16, 16)
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x]
      if (ch === '#') c.set(x, y, [...color, 255])
      else if (palette[ch]) c.set(x, y, [...palette[ch], 255])
    }
  })
  c.save(name)
}

const AD_MARK = [
  '....#......#....',
  '.....#....#.....',
  '......#..#......',
  '.......##.......',
  '..############..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..#oooooooooo#..',
  '..############..',
  '.....#....#.....',
  '................',
  '................',
]

bitmap('ad-mark', AD_MARK, [217, 199, 255], { o: DARK })

const CORE = [240, 90, 140]

const CAT = [
  '................',
  '...#......#.....',
  '...##....##.....',
  '...#o####o#.....',
  '...#oooooo#.....',
  '...#o#oo#o#.....',
  '...#oooooo#.....',
  '....#o##o#......',
  '.....####.......',
  '...##oooo##..#..',
  '...#oooooo#..#..',
  '...#oooooo#.#...',
  '...#oo##oo###...',
  '....##..##......',
  '....#....#......',
  '................',
]

const COMET = [
  '..........##....',
  '.........####...',
  '.......#######..',
  '......########..',
  '....##########..',
  '...####oooo###..',
  '..####oooooo##..',
  '..###oooooooo#..',
  '..###oooooooo#..',
  '..####oooooo##..',
  '...####oooo###..',
  '....##########..',
  '......########..',
  '.......#######..',
  '.........####...',
  '..........##....',
]

bitmap('cat', CAT, [40, 44, 66], { o: [210, 214, 235] })
bitmap('comet', COMET, [140, 220, 255], { o: [235, 250, 255] })

function resCore() {
  const c = new Canvas(16, 16)
  c.circle(8, 8, 6.5, shade(CORE, 1))
  c.circle(8, 8, 4, shade(CORE, 1.25))
  c.rect(7, 3, 2, 10, shade(CORE, 0.7))
  c.rect(3, 7, 10, 2, shade(CORE, 0.7))
  c.rect(7, 7, 2, 2, [255, 255, 255, 255])
  c.outline([20, 24, 40, 255])
  c.save('res-core')
}

resCore()

function cracks(stage) {
  const c = new Canvas(96, 96)
  const random = rng(300 + stage * 97)
  const lines = 2 + stage * 2
  for (let l = 0; l < lines; l += 1) {
    let x = 30 + random() * 36
    let y = 30 + random() * 36
    let dx = random() < 0.5 ? 1 : -1
    let dy = random() < 0.5 ? 1 : -1
    const len = 14 + random() * 20
    for (let i = 0; i < len; i += 1) {
      const cx = x + 0.5 - 48
      const cy = y + 0.5 - 48
      if (Math.hypot(cx, cy) < 36) {
        c.set(Math.round(x), Math.round(y), [30, 24, 20, 200])
        if (random() < 0.4) c.set(Math.round(x) + 1, Math.round(y), [30, 24, 20, 140])
      }
      x += dx * (random() < 0.7 ? 1 : 0)
      y += dy * (random() < 0.7 ? 1 : 0)
      if (random() < 0.15) dx = -dx
      if (random() < 0.15) dy = -dy
    }
  }
  c.save(`cracks-${stage}`)
}

cracks(1)
cracks(2)
cracks(3)

building('neurolab', (c) => {
  c.rect(5, 18, 22, 10, shade(STEEL, 0.8))
  c.circle(16, 14, 9, shade([90, 70, 120], 1))
  c.circle(16, 14, 6, shade(CORE, 0.9))
  c.rect(12, 12, 3, 3, shade(CORE, 1.3))
  c.rect(17, 14, 3, 3, shade(CORE, 1.3))
  c.rect(8, 22, 4, 3, shade(CORE, 1.1))
  c.rect(20, 22, 4, 3, shade(CORE, 1.1))
})

TAB_ICONS.skills = [
  '................',
  '....#...........',
  '...###......#...',
  '....#......###..',
  '.....o......#...',
  '......o.....o...',
  '.......o...o....',
  '........#.o.....',
  '.......###......',
  '........#o......',
  '..........o.....',
  '...........o....',
  '....#.......#...',
  '...###.....###..',
  '....#.......#...',
  '................',
]

for (const [id, rows] of Object.entries(TAB_ICONS)) {
  bitmap(`tab-${id}`, rows, MUTED, { o: [90, 96, 130] })
  bitmap(`tab-${id}-on`, rows, ORE, { o: [150, 110, 60] })
}

asteroid(0, [130, 120, 110])
asteroid(1, [150, 95, 80])
asteroid(2, [95, 110, 140])
asteroid(3, [110, 140, 105])
asteroid(4, [140, 120, 150])
asteroid(5, [160, 140, 90])
shard()
meteor()
console.log(`sprites written to ${OUT}`)
