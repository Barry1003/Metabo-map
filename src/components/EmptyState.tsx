import { useState } from 'react'

const suggested = [
  { id: 'R-HSA-70171', name: 'Glycolysis', nodes: 22 },
  { id: 'R-HSA-71403', name: 'Citric Acid Cycle', nodes: 31 },
  { id: 'R-HSA-70263', name: 'Gluconeogenesis', nodes: 28 },
  { id: 'R-HSA-70635', name: 'Urea Cycle', nodes: 16 },
  { id: 'R-HSA-71291', name: 'Fatty Acid β-Oxidation', nodes: 24 },
  { id: 'R-HSA-75105', name: 'Pentose Phosphate Pathway', nodes: 19 },
]

export default function EmptyState() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#090D12',
    }}>
      {/* Top bar */}
      <div style={{
        height: 56, backgroundColor: '#131A22', borderBottom: '1px solid #1E2732',
        display: 'flex', alignItems: 'center', padding: '0 20px',
      }}>
        <div style={{
          fontFamily: "'IBM Plex Sans Condensed'", fontWeight: 600,
          fontSize: 16, color: '#E8EEF4', letterSpacing: '0.04em',
        }}>
          <span style={{ color: '#48C9D9' }}>Meta</span>boMap
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 480, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#5C6B85" strokeWidth="1.5" />
              <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#5C6B85" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search a pathway"
              style={{
                width: '100%', height: 34,
                backgroundColor: '#090D12', border: '1px solid #1E2732',
                borderRadius: 4, color: '#E8EEF4', fontSize: 13,
                fontFamily: "'IBM Plex Sans'", padding: '0 12px 0 36px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        flex: 1,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          {/* Decorative icon */}
          <div style={{ marginBottom: 24 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="16" r="8" stroke="#48C9D9" strokeWidth="1.5" opacity="0.6" />
              <rect x="8" y="32" width="14" height="10" rx="1" stroke="#F2A93B" strokeWidth="1.5" opacity="0.6" />
              <rect x="26" y="32" width="14" height="10" rx="1" stroke="#F2A93B" strokeWidth="1.5" opacity="0.6" />
              <line x1="24" y1="24" x2="15" y2="32" stroke="#3a4d63" strokeWidth="1.5" />
              <line x1="24" y1="24" x2="33" y2="32" stroke="#3a4d63" strokeWidth="1.5" />
            </svg>
          </div>

          <h1 style={{
            margin: '0 0 10px', fontSize: 22, fontWeight: 600, color: '#E8EEF4',
          }}>
            Choose a pathway to explore
          </h1>
          <p style={{ margin: '0 0 32px', fontSize: 14, color: '#7D8B9C', lineHeight: 1.6 }}>
            Click any pathway below or search by name, enzyme, or Reactome ID.
          </p>

          {/* Suggested chips */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          }}>
            {suggested.map(p => (
              <button
                key={p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  padding: '12px 14px', textAlign: 'left',
                  backgroundColor: hoveredId === p.id ? '#1A232D' : '#131A22',
                  border: hoveredId === p.id ? '1px solid #48C9D9' : '1px solid #1E2732',
                  borderRadius: 4, cursor: 'pointer',
                  transition: 'background-color 0.15s, border-color 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: '#E8EEF4' }}>
                  {p.name}
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#5C6B85',
                  }}>
                    {p.id}
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#7D8B9C',
                  }}>
                    {p.nodes} nodes
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
