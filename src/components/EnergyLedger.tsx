interface LedgerEntry {
  label: string
  value: number
  max: number
}

const entries: LedgerEntry[] = [
  { label: 'ATP', value: 2, max: 4 },
  { label: 'NADH', value: 2, max: 5 },
  { label: 'FADH₂', value: 0, max: 2 },
]

function Counter({ entry }: { entry: LedgerEntry }) {
  const pct = Math.max(0, Math.min(1, entry.value / entry.max))
  const positive = entry.value >= 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      flex: 1, maxWidth: 160, minWidth: 120,
    }}>
      <div style={{
        fontFamily: "'IBM Plex Sans Condensed'",
        fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#7D8B9C',
      }}>
        {entry.label}
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono'",
        fontSize: 28, fontWeight: 500, lineHeight: 1.2,
        color: positive ? '#FFD166' : '#E2564B',
        letterSpacing: '-0.02em',
      }}>
        {positive ? '+' : ''}{entry.value}
      </div>
      {/* Thin bar */}
      <div style={{
        height: 2, backgroundColor: '#1E2732', borderRadius: 1, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct * 100}%`,
          backgroundColor: positive ? '#FFD166' : '#E2564B',
          borderRadius: 1, transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#5C6B85' }}>
        {entry.value} / {entry.max} net
      </div>
    </div>
  )
}

export default function EnergyLedger() {
  return (
    <div style={{
      height: 64, backgroundColor: '#131A22',
      borderTop: '1px solid #1E2732',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 40,
    }}>
      <div style={{
        fontFamily: "'IBM Plex Sans Condensed'",
        fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#3a4d63', userSelect: 'none', marginRight: 8,
        writingMode: 'horizontal-tb',
      }}>
        ENERGY LEDGER
      </div>
      <div style={{
        width: 1, height: 32, backgroundColor: '#1E2732', flexShrink: 0,
      }} />
      {entries.map(e => (
        <Counter key={e.label} entry={e} />
      ))}
    </div>
  )
}
