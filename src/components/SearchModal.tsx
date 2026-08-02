import { useState } from 'react'

interface Props {
  standalone?: boolean
  onClose?: () => void
  onSelect?: (id: string) => void
}

const pathways = [
  {
    id: 'R-HSA-70171',
    name: 'Glycolysis',
    desc: 'Cytosolic breakdown of glucose to pyruvate, yielding 2 ATP and 2 NADH per molecule.',
  },
  {
    id: 'R-HSA-71403',
    name: 'Citric Acid Cycle',
    desc: 'Mitochondrial oxidation of acetyl-CoA; primary source of reducing equivalents for oxidative phosphorylation.',
  },
  {
    id: 'R-HSA-70263',
    name: 'Gluconeogenesis',
    desc: 'Hepatic synthesis of glucose from non-carbohydrate precursors; reverse of glycolysis at regulated steps.',
  },
]

export default function SearchModal({ standalone, onClose, onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const content = (
    <div style={{
      width: 480, backgroundColor: '#1A232D',
      border: '1px solid #1E2732', borderRadius: 4,
      boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1E2732' }}>
        <h3 style={{
          margin: 0, fontSize: 16, fontWeight: 600, color: '#E8EEF4',
        }}>
          Which pathway did you mean?
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#7D8B9C' }}>
          Your query matched multiple entries.
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {pathways.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setSelected(p.id); onSelect?.(p.id) }}
            style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '14px 24px', textAlign: 'left', cursor: 'pointer',
              backgroundColor: selected === p.id ? '#131A22' : 'transparent',
              border: 'none',
              borderBottom: i < pathways.length - 1 ? '1px solid #1E2732' : 'none',
              transition: 'background-color 0.12s',
            }}
            onMouseEnter={e => {
              if (selected !== p.id)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#131A22'
            }}
            onMouseLeave={e => {
              if (selected !== p.id)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#E8EEF4' }}>
                {p.name}
              </span>
              <span style={{
                fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#5C6B85', flexShrink: 0,
              }}>
                {p.id}
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#7D8B9C', lineHeight: 1.5 }}>
              {p.desc}
            </span>
            {selected === p.id && (
              <div style={{
                marginTop: 2,
                fontFamily: "'IBM Plex Sans Condensed'",
                fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#48C9D9',
              }}>
                Selected
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid #1E2732',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'IBM Plex Sans'", fontSize: 12, color: '#7D8B9C',
            padding: '4px 0', textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >
          None of these
        </button>
      </div>
    </div>
  )

  if (standalone) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(9, 13, 18, 0.6)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>
        {content}
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(9,13,18,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {content}
    </div>
  )
}
