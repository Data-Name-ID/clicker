import { SKILLS, SKILL_TREES, skillsInTree } from '../../src/game/content/skills'
import { SKILL_LAYOUT } from '../../src/ui/skillLayout'

interface Seg { a: string; b: string; x1: number; y1: number; x2: number; y2: number }

const cross = (p: number[], q: number[], r: number[], s: number[]): boolean => {
  const d = (o: number[], a: number[], b: number[]) =>
    Math.sign((a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]))
  const d1 = d(p, q, r), d2 = d(p, q, s), d3 = d(r, s, p), d4 = d(r, s, q)
  return d1 !== d2 && d3 !== d4 && d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0
}

const distToSeg = (p: number[], a: number[], b: number[]): number => {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

for (const tree of SKILL_TREES) {
  const nodes = skillsInTree(tree.id)
  const segs: Seg[] = []
  for (const def of nodes) {
    for (const req of def.requires) {
      const f = SKILL_LAYOUT[req], t = SKILL_LAYOUT[def.id]
      segs.push({ a: req, b: def.id, x1: f.x, y1: f.y, x2: t.x, y2: t.y })
    }
  }
  const problems: string[] = []
  for (let i = 0; i < segs.length; i += 1) {
    for (let j = i + 1; j < segs.length; j += 1) {
      const s1 = segs[i], s2 = segs[j]
      if (s1.a === s2.a || s1.a === s2.b || s1.b === s2.a || s1.b === s2.b) continue
      if (cross([s1.x1, s1.y1], [s1.x2, s1.y2], [s2.x1, s2.y1], [s2.x2, s2.y2])) {
        problems.push(`пересечение: ${s1.a}→${s1.b} × ${s2.a}→${s2.b}`)
      }
    }
  }
  for (const node of nodes) {
    const p = [SKILL_LAYOUT[node.id].x, SKILL_LAYOUT[node.id].y]
    for (const s of segs) {
      if (s.a === node.id || s.b === node.id) continue
      const dist = distToSeg(p, [s.x1, s.y1], [s.x2, s.y2])
      if (dist < 7) problems.push(`звезда ${node.id} лежит на линии ${s.a}→${s.b} (${dist.toFixed(1)})`)
    }
  }
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = SKILL_LAYOUT[nodes[i].id], b = SKILL_LAYOUT[nodes[j].id]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d < 14) problems.push(`звёзды ${nodes[i].id}/${nodes[j].id} слишком близко (${d.toFixed(1)})`)
    }
  }
  console.log(`\n${tree.name} (${tree.id}): ${problems.length ? problems.length + ' проблем' : 'ок'}`)
  for (const p of problems) console.log('  -', p)
}

const sig = (id: string) =>
  skillsInTree(id as never)
    .map((n) => `${SKILL_LAYOUT[n.id].x},${SKILL_LAYOUT[n.id].y}`)
    .join(' ')
console.log('\nСигнатуры фигур:')
for (const t of SKILL_TREES) console.log(' ', t.id.padEnd(8), sig(t.id))
console.log('\nвсего навыков:', SKILLS.length)
