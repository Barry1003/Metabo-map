import { useState } from 'react'
import PathwayCanvas from './PathwayCanvas'
import EnergyLedger from './EnergyLedger'

export default function TabletLayout() {
  const [sheetHeight, setSheetHeight] = useState(55) // percent
  const [dragging, setDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    const startY = e.clientY
    const startH = sheetHeight

    const onMove = (ev: MouseEvent) => {
      const totalH = window.innerHeight - 36 - 56
      const delta = ((startY - ev.clientY) / totalH) * 100
      setSheetHeight(Math.max(30, Math.min(90, startH + delta)))
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#090D12' }}>
      {/* Top bar — collapsed toggles */}
      <div style={{
        height: 56, backgroundColor: '#131A22', borderBottom: '1px solid #1E2732',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
      }}>
        <div style={{
          fontFamily: "'IBM Plex Sans Condensed'", fontWeight: 600,
          fontSize: 16, color: '#E8EEF4', letterSpacing: '0.04em',
        }}>
          <span style={{ color: '#48C9D9' }}>Meta</span>boMap
        </div>

        {/* Search - shorter on tablet */}
        <div style={{ flex: 1, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
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
              fontFamily: "'IBM Plex Sans'", padding: '0 12px 0 34px',
              outline: 'none',
            }}
          />
        </div>

        {/* Overflow menu button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: menuOpen ? '#1A232D' : 'transparent',
              border: menuOpen ? '1px solid #1E2732' : '1px solid transparent',
              borderRadius: 4, cursor: 'pointer', color: menuOpen ? '#48C9D9' : '#7D8B9C',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="4" r="1.5" fill="currentColor" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 38, width: 160,
              backgroundColor: '#1A232D', border: '1px solid #1E2732',
              borderRadius: 4, zIndex: 100, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {['Cofactors', 'Compartments', 'Quiz Mode', 'Help'].map(item => (
                <button key={item} onClick={() => setMenuOpen(false)} style={{
                  display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left',
                  backgroundColor: 'transparent', border: 'none',
                  borderBottom: '1px solid #1E2732', cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans'", fontSize: 13, color: '#E8EEF4',
                }}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div style={{
        flex: 1, position: 'relative', backgroundColor: '#090D12',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        overflow: 'hidden',
        height: `${100 - sheetHeight}%`,
      }}>
        <div style={{
          padding: '20px', overflowY: 'auto',
          height: 'calc(100% - 64px)',
          transform: 'scale(0.75)', transformOrigin: 'top left',
          width: '133%',
        }}>
          <PathwayCanvas />
        </div>

        {/* Energy ledger - stays above sheet */}
        <EnergyLedger />
      </div>

      {/* Bottom sheet */}
      <div style={{
        height: `${sheetHeight}%`,
        backgroundColor: '#131A22',
        borderTop: '1px solid #1E2732',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        transition: dragging ? 'none' : 'height 0.2s',
      }}>
        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          style={{
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'ns-resize', flexShrink: 0, borderBottom: '1px solid #1E2732',
          }}
        >
          <div style={{
            width: 40, height: 3, backgroundColor: '#2d3f53', borderRadius: 2,
          }} />
        </div>

        {/* Sheet content - inspector */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#E8EEF4' }}>
                Fructose-1,6-bisphosphate
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Metabolite', 'Cytosol'].map((badge, i) => (
                  <span key={badge} style={{
                    fontFamily: "'IBM Plex Sans Condensed'", fontSize: 10, letterSpacing: '0.08em',
                    textTransform: 'uppercase', padding: '2px 6px',
                    border: `1px solid ${i === 0 ? '#48C9D9' : '#5C6B85'}`,
                    color: i === 0 ? '#48C9D9' : '#5C6B85', borderRadius: 2,
                  }}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1E2732', paddingTop: 14 }}>
            <div style={{
              fontFamily: "'IBM Plex Sans Condensed'", fontSize: 11, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#7D8B9C', marginBottom: 10,
            }}>
              Summary
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#E8EEF4', lineHeight: 1.6 }}>
              Fructose-1,6-bisphosphate is the committed intermediate of glycolysis, produced by PFK-1 at the cost of one ATP. Its cleavage by aldolase yields two triose phosphates that feed the energy-recovering lower half of the pathway. It also acts as a feedforward activator of pyruvate kinase.
            </p>
          </div>

          <div style={{ borderTop: '1px solid #1E2732', marginTop: 14, paddingTop: 14 }}>
            <div style={{
              fontFamily: "'IBM Plex Sans Condensed'", fontSize: 11, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#7D8B9C', marginBottom: 10,
            }}>
              Energy
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {['−1 ATP', '+2 ATP', '+1 NADH'].map((e, i) => (
                <span key={e} style={{
                  fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 500,
                  color: i === 0 ? '#E2564B' : '#FFD166',
                }}>
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
