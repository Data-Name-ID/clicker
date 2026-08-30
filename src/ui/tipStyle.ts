import type { CSSProperties } from 'react'

const TIP_WIDTH = 280
const TIP_MARGIN = 12

export function tipStyle(anchor: HTMLElement | null): CSSProperties {
  if (!anchor) return {}
  const r = anchor.getBoundingClientRect()
  const width = Math.min(TIP_WIDTH, window.innerWidth - TIP_MARGIN * 2)
  const left = Math.min(Math.max(TIP_MARGIN, r.left + r.width / 2 - width / 2), window.innerWidth - TIP_MARGIN - width)
  const above = r.top > 180
  return above ? { left, width, bottom: window.innerHeight - r.top + 8 } : { left, width, top: r.bottom + 8 }
}
