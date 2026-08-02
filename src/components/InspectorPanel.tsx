interface Props {
  variant: 'structure' | 'no-structure'
  onClose: () => void
}

function Badge({ children, color }: { children: string; color: string }) {
  return (
    <span style={{
      fontFamily: "'IBM Plex Sans Condensed'",
      fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '2px 6px', border: `1px solid ${color}`,
      color, borderRadius: 2,
    }}>
      {children}
    </span>
  )
}

function MolecularStructure() {
  return (
    <div style={{
      width: '100%', aspectRatio: '1', backgroundColor: '#090D12',
      border: '1px solid #1E2732', borderRadius: 2, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Fructose-1,6-bisphosphate line drawing */}
      <svg width="240" height="200" viewBox="0 0 240 200">
        {/* Phosphate group left */}
        <circle cx={30} cy={100} r={8} fill="none" stroke="#5C6B85" strokeWidth={1.5} />
        <text x={30} y={104} textAnchor="middle" fill="#5C6B85"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 8 }}>P</text>
        <line x1={38} y1={100} x2={55} y2={100} stroke="#3a4d63" strokeWidth={1.5} />

        {/* Carbon chain */}
        <line x1={55} y1={100} x2={70} y2={80} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={70} y1={80} x2={90} y2={80} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={90} y1={80} x2={105} y2={65} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={90} y1={80} x2={90} y2={105} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={90} y1={105} x2={110} y2={120} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={110} y1={120} x2={130} y2={120} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={130} y1={120} x2={145} y2={105} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={130} y1={120} x2={130} y2={145} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={145} y1={105} x2={165} y2={105} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={165} y1={105} x2={180} y2={90} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={165} y1={105} x2={165} y2={130} stroke="#48C9D9" strokeWidth={1.5} />

        {/* Phosphate group right */}
        <line x1={180} y1={90} x2={198} y2={90} stroke="#3a4d63" strokeWidth={1.5} />
        <circle cx={206} cy={90} r={8} fill="none" stroke="#5C6B85" strokeWidth={1.5} />
        <text x={206} y={94} textAnchor="middle" fill="#5C6B85"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 8 }}>P</text>

        {/* OH groups */}
        <text x={105} y={62} fill="#7D8B9C"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9 }}>OH</text>
        <text x={118} y={128} fill="#7D8B9C"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9 }}>OH</text>
        <text x={128} y={160} fill="#7D8B9C"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9 }}>OH</text>
        <text x={160} y={145} fill="#7D8B9C"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9 }}>OH</text>

        {/* Keto group */}
        <line x1={55} y1={100} x2={55} y2={120} stroke="#48C9D9" strokeWidth={1.5} />
        <line x1={53} y1={120} x2={57} y2={120} stroke="#48C9D9" strokeWidth={1} />
        <text x={42} y={130} fill="#48C9D9"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9 }}>O</text>
      </svg>
    </div>
  )
}

export default function InspectorPanel({ variant, onClose }: Props) {
  return (
    <div style={{
      width: 380, height: '100%', backgroundColor: '#131A22',
      borderLeft: '1px solid #1E2732', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1E2732' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{
              margin: '0 0 10px', fontSize: 20, fontWeight: 600,
              color: '#E8EEF4', lineHeight: 1.2,
            }}>
              Fructose-1,6-bisphosphate
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge color="#48C9D9">Metabolite</Badge>
              <Badge color="#5C6B85">Cytosol</Badge>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#5C6B85', fontSize: 18, lineHeight: 1, padding: 4,
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" />
              <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {/* Structure section */}
        {variant === 'structure' && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2732' }}>
            <div style={{
              fontFamily: "'IBM Plex Sans Condensed'",
              fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#7D8B9C', marginBottom: 12,
            }}>
              Chemical Structure
            </div>
            <MolecularStructure />
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: '#7D8B9C' }}>
                C₆H₁₄O₁₂P₂
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#5C6B85' }}>
                PubChem CID: 65523
              </span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2732' }}>
          <div style={{
            fontFamily: "'IBM Plex Sans Condensed'",
            fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#7D8B9C', marginBottom: 12,
          }}>
            Summary
          </div>
          <div style={{ lineHeight: 1.6, fontSize: 13, color: '#E8EEF4', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0 }}>
              Fructose-1,6-bisphosphate (F1,6BP) is a pivotal intermediate in glycolysis, produced by the ATP-dependent phosphorylation of fructose-6-phosphate. Its formation represents the major committed step of the pathway — energy is invested here, before any ATP is recovered.
            </p>
            <p style={{ margin: 0 }}>
              The molecule is subsequently cleaved by aldolase into two triose phosphates: dihydroxyacetone phosphate (DHAP) and glyceraldehyde-3-phosphate (G3P), which feed the energy-yielding lower half of glycolysis.
            </p>
            <p style={{ margin: 0 }}>
              F1,6BP also acts as a feedforward activator of pyruvate kinase and lactate dehydrogenase, coordinating glycolytic flux with downstream demand.
            </p>
            <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Molecular weight: 340.12 g/mol</li>
              <li>Standard ΔG°: −14.2 kJ/mol (PFK-1 reaction)</li>
              <li>Reactome ID: R-ALL-70563</li>
            </ul>
          </div>
        </div>

        {/* Energy contribution */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2732' }}>
          <div style={{
            fontFamily: "'IBM Plex Sans Condensed'",
            fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#7D8B9C', marginBottom: 10,
          }}>
            Energy Contribution
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: '−1 ATP', color: '#E2564B', note: 'consumed' },
              { label: '+2 ATP', color: '#FFD166', note: 'net lower' },
              { label: '+1 NADH', color: '#FFD166', note: 'via GAPDH' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono'", fontSize: 14, fontWeight: 500,
                  color: item.color,
                }}>
                  {item.label}
                </span>
                <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 10, color: '#5C6B85' }}>
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Literature */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{
            fontFamily: "'IBM Plex Sans Condensed'",
            fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#7D8B9C', marginBottom: 12,
          }}>
            Literature
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                pmid: 'PMID: 28974514',
                title: 'Fructose-1,6-bisphosphate recovers brain metabolism during hypoxia',
                journal: 'J Cereb Blood Flow Metab · 2018',
              },
              {
                pmid: 'PMID: 32109399',
                title: 'Allosteric regulation of phosphofructokinase-1 in human erythrocytes',
                journal: 'Biochemistry · 2020',
              },
              {
                pmid: 'PMID: 19783988',
                title: 'Structural basis of fructose-1,6-bisphosphate sensing by the Cdc25 phosphatase',
                journal: 'Science · 2009',
              },
            ].map(item => (
              <div key={item.pmid} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#5C6B85' }}>
                  {item.pmid}
                </span>
                <span style={{
                  fontSize: 12, color: '#E8EEF4', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {item.title}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#7D8B9C' }}>
                  {item.journal}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
