import { useState } from 'react'

const ENZYME = '#F2A93B'

const enzymes = [
  'Hexokinase', 'PGI', 'PFK-1', 'Aldolase',
  'TPI', 'GAPDH', 'PGK', 'Enolase',
]

const slots = [
  { id: 's1', x: 185, y: 130, label: 'Hexokinase', answer: 'Hexokinase' },
  { id: 's2', x: 185, y: 280, label: 'PGI', answer: 'PGI' },
  { id: 's3', x: 185, y: 420, label: 'PFK-1', answer: 'PFK-1' },
  { id: 's4', x: 185, y: 565, label: 'Aldolase', answer: 'Aldolase' },
  { id: 's5', x: 115, y: 710, label: 'TPI', answer: 'TPI' },
  { id: 's6', x: 255, y: 710, label: 'GAPDH', answer: 'GAPDH' },
  { id: 's7', x: 255, y: 850, label: 'PGK', answer: 'PGK' },
  { id: 's8', x: 255, y: 990, label: 'Enolase', answer: 'Enolase' },
]

type ChipState = 'resting' | 'dragging' | 'placed-correct'

export default function QuizMode() {
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [score] = useState({ correct: 4, total: 8 })

  const handleDrop = (slotId: string) => {
    if (!dragging) return
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return
    if (dragging === slot.answer) {
      setPlaced(p => ({ ...p, [slotId]: dragging }))
    }
    setDragging(null)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#090D12' }}>
      {/* Top bar */}
      <div style={{
        height: 56, backgroundColor: '#131A22', borderBottom: '1px solid #1E2732',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        <div style={{
          fontFamily: "'IBM Plex Sans Condensed'", fontWeight: 600,
          fontSize: 16, color: '#E8EEF4', letterSpacing: '0.04em',
        }}>
          <span style={{ color: '#48C9D9' }}>Meta</span>boMap
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          fontFamily: "'IBM Plex Sans Condensed'",
          fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#F2A93B', border: '1px solid rgba(242,169,59,0.3)',
          padding: '3px 10px', borderRadius: 2,
        }}>
          Quiz Mode Active
        </div>
        <div style={{ width: 1, height: 24, backgroundColor: '#1E2732' }} />
        {/* Score */}
        <div style={{
          fontFamily: "'IBM Plex Mono'", fontSize: 16, fontWeight: 500,
          color: '#FFD166',
        }}>
          {score.correct} / {score.total}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{
          flex: 1, position: 'relative', backgroundColor: '#090D12',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '40px 40px', overflowY: 'auto', height: '100%' }}>
            <svg width="400" height="1060" style={{ overflow: 'visible' }}>
              {/* Compartment bands */}
              <rect x={60} y={50} width={320} height={600} rx={0}
                fill="rgba(72,201,217,0.04)" stroke="#1E2732" strokeWidth={1} />
              <text x={70} y={72} fill="#7D8B9C"
                style={{ fontFamily: "'IBM Plex Sans Condensed'", fontSize: 10, letterSpacing: '0.08em' }}>
                CYTOSOL
              </text>

              {/* Metabolite nodes */}
              {[
                { x: 200, y: 60, label: 'Glucose' },
                { x: 200, y: 205, label: 'Glucose-6-P' },
                { x: 200, y: 350, label: 'Fructose-6-P' },
                { x: 200, y: 495, label: 'Fructose-1,6-BP' },
                { x: 120, y: 640, label: 'DHAP' },
                { x: 280, y: 640, label: 'G3P' },
                { x: 280, y: 785, label: '1,3-BPG' },
                { x: 280, y: 930, label: '3-PG' },
              ].map(m => (
                <g key={m.label}>
                  <circle cx={m.x} cy={m.y} r={12} fill="#48C9D9" opacity={0.9} />
                  <text x={m.x} y={m.y + 26} textAnchor="middle" fill="#7D8B9C"
                    style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11 }}>
                    {m.label}
                  </text>
                </g>
              ))}

              {/* Edge lines */}
              {[
                [200, 72, 200, 118], [200, 147, 200, 193], [200, 218, 200, 268],
                [200, 297, 200, 343], [200, 368, 200, 418], [200, 447, 200, 483],
                [200, 507, 200, 553], [185, 567, 128, 628], [215, 567, 272, 628],
                [120, 655, 120, 698], [280, 655, 280, 698], [280, 727, 280, 773],
                [280, 797, 280, 843], [280, 867, 280, 918],
              ].map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#3a4d63" strokeWidth={1.5} />
              ))}

              {/* Enzyme slots */}
              {slots.map(slot => {
                const isPlaced = placed[slot.id]
                const w = Math.max(slot.label.length * 7, 70)
                const h = 22

                return (
                  <g key={slot.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(slot.id)}>
                    <rect
                      x={slot.x - w / 2} y={slot.y - h / 2}
                      width={w} height={h} rx={2}
                      fill={isPlaced ? ENZYME : `rgba(242,169,59,0.15)`}
                      stroke={isPlaced ? ENZYME : `rgba(242,169,59,0.4)`}
                      strokeWidth={1}
                      strokeDasharray={isPlaced ? 'none' : '4,3'}
                    />
                    {isPlaced && (
                      <text x={slot.x} y={slot.y + 4} textAnchor="middle"
                        fill="#090D12"
                        style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600 }}>
                        {isPlaced}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Quiz panel */}
        <div style={{
          width: 280, backgroundColor: '#131A22', borderLeft: '1px solid #1E2732',
          display: 'flex', flexDirection: 'column', padding: 20, gap: 16,
        }}>
          <div>
            <div style={{
              fontFamily: "'IBM Plex Sans Condensed'",
              fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#7D8B9C', marginBottom: 12,
            }}>
              Enzyme Bank
            </div>
            <p style={{ fontSize: 12, color: '#5C6B85', margin: '0 0 16px', lineHeight: 1.5 }}>
              Drag each enzyme to its correct position on the pathway diagram.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {enzymes.map(enzyme => {
              const isPlaced = Object.values(placed).includes(enzyme)
              const isDragging = dragging === enzyme
              let state: ChipState = isPlaced ? 'placed-correct' : isDragging ? 'dragging' : 'resting'

              return (
                <div
                  key={enzyme}
                  draggable={!isPlaced}
                  onDragStart={() => setDragging(enzyme)}
                  onDragEnd={() => setDragging(null)}
                  style={{
                    padding: '8px 12px', borderRadius: 2, cursor: isPlaced ? 'default' : 'grab',
                    fontFamily: "'IBM Plex Sans'", fontSize: 13, fontWeight: 500,
                    userSelect: 'none', transition: 'all 0.15s',
                    backgroundColor:
                      state === 'placed-correct' ? 'rgba(242,169,59,0.15)' :
                      state === 'dragging' ? '#1A232D' : '#1A232D',
                    border:
                      state === 'placed-correct' ? '1px solid rgba(242,169,59,0.4)' :
                      state === 'dragging' ? '1px solid #48C9D9' : '1px solid #1E2732',
                    color:
                      state === 'placed-correct' ? '#F2A93B' :
                      state === 'dragging' ? '#48C9D9' : '#E8EEF4',
                    opacity: state === 'placed-correct' ? 0.5 : state === 'dragging' ? 0.6 : 1,
                    transform: state === 'dragging' ? 'scale(0.97)' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {state === 'placed-correct' && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#F2A93B" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    {enzyme}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: 'auto', padding: '12px', backgroundColor: '#090D12',
            border: '1px solid #1E2732', borderRadius: 2,
          }}>
            <div style={{ fontFamily: "'IBM Plex Sans Condensed'", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C6B85', marginBottom: 6 }}>
              Progress
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 22, color: '#FFD166' }}>
              {Object.keys(placed).length} / {slots.length}
            </div>
            <div style={{ height: 2, backgroundColor: '#1E2732', marginTop: 8, borderRadius: 1 }}>
              <div style={{
                height: '100%', borderRadius: 1, backgroundColor: '#FFD166',
                width: `${(Object.keys(placed).length / slots.length) * 100}%`,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
