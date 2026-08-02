import { useState } from 'react'

interface Node {
  id: string
  type: 'metabolite' | 'enzyme' | 'cofactor'
  x: number
  y: number
  label: string
  selected?: boolean
}

interface Edge {
  x1: number; y1: number; x2: number; y2: number; curved?: boolean
}

const METABOLITE = '#48C9D9'
const ENZYME = '#F2A93B'
const COFACTOR = '#5C6B85'

const nodes: Node[] = [
  { id: 'm1', type: 'metabolite', x: 200, y: 80, label: 'Glucose' },
  { id: 'e1', type: 'enzyme', x: 200, y: 150, label: 'Hexokinase' },
  { id: 'c1', type: 'cofactor', x: 155, y: 150, label: 'ATP' },
  { id: 'c2', type: 'cofactor', x: 155, y: 168, label: 'ADP' },
  { id: 'm2', type: 'metabolite', x: 200, y: 225, label: 'Glucose-6-P' },
  { id: 'e2', type: 'enzyme', x: 200, y: 295, label: 'PGI' },
  { id: 'm3', type: 'metabolite', x: 200, y: 370, label: 'Fructose-6-P' },
  { id: 'e3', type: 'enzyme', x: 200, y: 440, label: 'PFK-1' },
  { id: 'c3', type: 'cofactor', x: 155, y: 440, label: 'ATP' },
  { id: 'm4', type: 'metabolite', x: 200, y: 515, label: 'Fructose-1,6-BP', selected: true },
  { id: 'e4', type: 'enzyme', x: 200, y: 585, label: 'Aldolase' },
  { id: 'm5', type: 'metabolite', x: 130, y: 660, label: 'DHAP' },
  { id: 'm6', type: 'metabolite', x: 270, y: 660, label: 'G3P' },
  { id: 'e5', type: 'enzyme', x: 130, y: 730, label: 'TPI' },
  { id: 'e6', type: 'enzyme', x: 270, y: 730, label: 'GAPDH' },
  { id: 'c4', type: 'cofactor', x: 315, y: 730, label: 'NAD⁺' },
  { id: 'm7', type: 'metabolite', x: 270, y: 805, label: '1,3-BPG' },
  { id: 'e7', type: 'enzyme', x: 270, y: 875, label: 'PGK' },
  { id: 'c5', type: 'cofactor', x: 225, y: 875, label: 'ADP' },
  { id: 'm8', type: 'metabolite', x: 270, y: 950, label: '3-Phosphoglycerate' },
]

const edges: Edge[] = [
  { x1: 200, y1: 92, x2: 200, y2: 138 },
  { x1: 200, y1: 162, x2: 200, y2: 213 },
  { x1: 200, y1: 237, x2: 200, y2: 283 },
  { x1: 200, y1: 307, x2: 200, y2: 358 },
  { x1: 200, y1: 382, x2: 200, y2: 428 },
  { x1: 200, y1: 452, x2: 200, y2: 503 },
  { x1: 200, y1: 527, x2: 200, y2: 573 },
  { x1: 185, y1: 597, x2: 138, y2: 648 },
  { x1: 215, y1: 597, x2: 262, y2: 648 },
  { x1: 130, y1: 672, x2: 130, y2: 718 },
  { x1: 270, y1: 672, x2: 270, y2: 718 },
  { x1: 270, y1: 742, x2: 270, y2: 793 },
  { x1: 270, y1: 817, x2: 270, y2: 863 },
  { x1: 270, y1: 887, x2: 270, y2: 938 },
  { x1: 138, y1: 742, x2: 262, y2: 718, curved: true },
]

function Arrowhead({ x, y, angle = 90 }: { x: number; y: number; angle?: number }) {
  const r = `rotate(${angle}, ${x}, ${y})`
  return (
    <polygon
      points={`${x},${y} ${x - 4},${y - 7} ${x + 4},${y - 7}`}
      fill="#3a4d63"
      transform={r}
    />
  )
}

export default function PathwayCanvas({ onNodeClick }: { onNodeClick?: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <svg
      width="400" height="1020"
      style={{ overflow: 'visible' }}
    >
      {/* Compartment bands */}
      <rect x={60} y={50} width={320} height={600} rx={0}
        fill="rgba(72,201,217,0.04)" stroke="#1E2732" strokeWidth={1} />
      <text x={70} y={72} fill="#7D8B9C"
        style={{ fontFamily: "'IBM Plex Sans Condensed'", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        CYTOSOL
      </text>

      <rect x={60} y={670} width={320} height={320} rx={0}
        fill="rgba(242,169,59,0.03)" stroke="#1E2732" strokeWidth={1} />
      <text x={70} y={692} fill="#7D8B9C"
        style={{ fontFamily: "'IBM Plex Sans Condensed'", fontSize: 10, letterSpacing: '0.08em' }}>
        MITOCHONDRIAL MATRIX
      </text>

      {/* Edges */}
      {edges.map((e, i) => (
        <g key={i}>
          {e.curved ? (
            <path
              d={`M ${e.x1} ${e.y1} Q ${(e.x1 + e.x2) / 2 + 20} ${(e.y1 + e.y2) / 2} ${e.x2} ${e.y2}`}
              stroke="#3a4d63" strokeWidth={1.5} fill="none"
            />
          ) : (
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="#3a4d63" strokeWidth={1.5} />
          )}
          <Arrowhead x={e.x2} y={e.y2} angle={e.x1 === e.x2 ? 0 : e.x2 > e.x1 ? 45 : -45} />
        </g>
      ))}

      {/* Nodes */}
      {nodes.map(node => {
        const isHovered = hovered === node.id
        const isSelected = node.selected

        if (node.type === 'metabolite') {
          const r = 12
          return (
            <g key={node.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick?.(node.id)}>
              <circle cx={node.x} cy={node.y} r={r}
                fill={isSelected ? '#6bd8e6' : isHovered ? '#5dd4e4' : METABOLITE}
                opacity={isHovered ? 1 : 0.92} />
              {isSelected && (
                <circle cx={node.x} cy={node.y} r={r + 4}
                  fill="none" stroke="#E8EEF4" strokeWidth={2} opacity={0.85} />
              )}
              {isHovered && !isSelected && (
                <circle cx={node.x} cy={node.y} r={r + 3}
                  fill="none" stroke={METABOLITE} strokeWidth={1} opacity={0.5} />
              )}
              <text x={node.x} y={node.y + r + 14} textAnchor="middle"
                fill={isSelected ? '#E8EEF4' : '#7D8B9C'}
                style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, fontWeight: isSelected ? 500 : 400 }}>
                {node.label}
              </text>
            </g>
          )
        }

        if (node.type === 'enzyme') {
          const w = Math.max(node.label.length * 6.5, 70)
          const h = 22
          return (
            <g key={node.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick?.(node.id)}>
              <rect x={node.x - w / 2} y={node.y - h / 2} width={w} height={h} rx={2}
                fill={isHovered ? '#f5b84a' : ENZYME}
                opacity={isHovered ? 1 : 0.9} />
              <text x={node.x} y={node.y + 4} textAnchor="middle"
                fill="#090D12"
                style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600 }}>
                {node.label}
              </text>
            </g>
          )
        }

        if (node.type === 'cofactor') {
          return (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={6}
                fill={COFACTOR} opacity={0.75} />
              <text x={node.x - 10} y={node.y + 4}
                fill="#5C6B85"
                style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9 }}>
                {node.label}
              </text>
            </g>
          )
        }
        return null
      })}
    </svg>
  )
}
