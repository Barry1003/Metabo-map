import { useState } from 'react'
import PathwayCanvas from './PathwayCanvas'
import InspectorPanel from './InspectorPanel'
import EnergyLedger from './EnergyLedger'

interface Props {
  inspectorVariant?: 'structure' | 'no-structure'
}

function TopBar() {
  const [query, setQuery] = useState('')
  const [cofactors, setCofactors] = useState(true)
  const [compartments, setCompartments] = useState(true)
  const [quizMode, setQuizMode] = useState(false)

  return (
    <div style={{
      height: 56, backgroundColor: '#131A22',
      borderBottom: '1px solid #1E2732',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      flexShrink: 0,
    }}>
      {/* Wordmark */}
      <div style={{
        fontFamily: "'IBM Plex Sans Condensed'", fontWeight: 600,
        fontSize: 16, color: '#E8EEF4', letterSpacing: '0.04em',
        userSelect: 'none', flexShrink: 0,
      }}>
        <span style={{ color: '#48C9D9' }}>Meta</span>boMap
      </div>

      {/* Search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 480, position: 'relative',
        }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#5C6B85" strokeWidth="1.5" />
            <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#5C6B85" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a pathway"
            style={{
              width: '100%', height: 34,
              backgroundColor: '#090D12', border: '1px solid #1E2732',
              borderRadius: 4, color: '#E8EEF4', fontSize: 13,
              fontFamily: "'IBM Plex Sans'", padding: '0 12px 0 36px',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#48C9D9' }}
            onBlur={e => { e.target.style.borderColor = '#1E2732' }}
          />
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {[
          {
            label: 'Cofactors', active: cofactors, toggle: () => setCofactors(v => !v),
            icon: <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />,
          },
          {
            label: 'Compartments', active: compartments, toggle: () => setCompartments(v => !v),
            icon: <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />,
          },
          {
            label: 'Quiz', active: quizMode, toggle: () => setQuizMode(v => !v),
            icon: <>
              <path d="M8 4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
            </>,
          },
        ].map(item => (
          <button
            key={item.label}
            title={item.label}
            onClick={item.toggle}
            style={{
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: item.active ? '#1A232D' : 'transparent',
              border: item.active ? '1px solid #1E2732' : '1px solid transparent',
              borderRadius: 4, cursor: 'pointer',
              color: item.active ? '#48C9D9' : '#5C6B85',
              transition: 'color 0.15s, background-color 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {item.icon}
            </svg>
          </button>
        ))}

        <div style={{ width: 1, backgroundColor: '#1E2732', margin: '8px 4px' }} />

        {/* Help */}
        <button title="Help" style={{
          width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'transparent', border: '1px solid transparent', borderRadius: 4,
          cursor: 'pointer', color: '#5C6B85',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 6.5a2 2 0 1 1 2 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div style={{
      position: 'absolute', bottom: 80, left: 16,
      backgroundColor: '#131A22', border: '1px solid #1E2732',
      borderRadius: 4, padding: '10px 14px',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      {[
        { color: '#48C9D9', shape: 'circle', label: 'Metabolite' },
        { color: '#F2A93B', shape: 'rect', label: 'Enzyme' },
        { color: '#5C6B85', shape: 'circle-sm', label: 'Cofactor' },
        { color: 'rgba(72,201,217,0.06)', shape: 'band', label: 'Compartment' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.shape === 'circle' && (
            <svg width="12" height="12"><circle cx="6" cy="6" r="6" fill={item.color} /></svg>
          )}
          {item.shape === 'circle-sm' && (
            <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill={item.color} /></svg>
          )}
          {item.shape === 'rect' && (
            <svg width="14" height="10"><rect width="14" height="10" rx="1" fill={item.color} /></svg>
          )}
          {item.shape === 'band' && (
            <svg width="14" height="10">
              <rect width="14" height="10" fill={item.color} stroke="#1E2732" strokeWidth="1" />
            </svg>
          )}
          <span style={{
            fontFamily: "'IBM Plex Sans Condensed'",
            fontSize: 11, color: '#7D8B9C', letterSpacing: '0.02em',
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function ZoomControls() {
  return (
    <div style={{
      position: 'absolute', bottom: 80, right: 16,
      display: 'flex', flexDirection: 'column', gap: 1,
    }}>
      {[
        { icon: '+', title: 'Zoom in' },
        { icon: '−', title: 'Zoom out' },
        { icon: '⊡', title: 'Fit to view' },
        { icon: '↺', title: 'Reset' },
      ].map(btn => (
        <button
          key={btn.title}
          title={btn.title}
          style={{
            width: 32, height: 32,
            backgroundColor: '#131A22', border: '1px solid #1E2732',
            borderRadius: 2, cursor: 'pointer',
            color: '#7D8B9C', fontSize: 16, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s, background-color 0.15s',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#1A232D'
            ;(e.target as HTMLButtonElement).style.color = '#E8EEF4'
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#131A22'
            ;(e.target as HTMLButtonElement).style.color = '#7D8B9C'
          }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  )
}

export default function MainShell({ inspectorVariant = 'structure' }: Props) {
  const [inspectorOpen, setInspectorOpen] = useState(true)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{
          flex: 1, position: 'relative', backgroundColor: '#090D12',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '40px 40px', overflowY: 'auto', height: 'calc(100% - 64px)',
          }}>
            <PathwayCanvas onNodeClick={() => setInspectorOpen(true)} />
          </div>
          <Legend />
          <ZoomControls />
          <EnergyLedger />
        </div>

        {/* Inspector */}
        <div style={{
          width: inspectorOpen ? 380 : 0,
          overflow: 'hidden',
          transition: 'width 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          flexShrink: 0,
        }}>
          {inspectorOpen && (
            <InspectorPanel
              variant={inspectorVariant}
              onClose={() => setInspectorOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
