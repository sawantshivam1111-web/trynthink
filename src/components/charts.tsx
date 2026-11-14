export function ProgressRing({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent))
  return (
    <div
      style={{
        width: 132,
        height: 132,
        borderRadius: '50%',
        background: `conic-gradient(var(--primary) ${p}%, #e3efec 0)`,
        display: 'grid',
        placeItems: 'center',
        transition: 'background 0.4s ease',
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'var(--card)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'inset 0 0 0 1px var(--card-border)',
        }}
      >
        <strong style={{ fontSize: '1.2rem', color: 'var(--text)' }}>{p}%</strong>
      </div>
    </div>
  )
}

export function DependencyChart({ ind = 60, ast = 30, dep = 10 }: any) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="card-title">AI Dependency Meter</h3>
        <span className="tag">Live</span>
      </div>
      <div className="kpi">
        <div className="pill">
          <strong>{ind}%</strong>
          <span className="muted"><br />Independent</span>
        </div>
        <div className="pill">
          <strong>{ast}%</strong>
          <span className="muted"><br />Assisted</span>
        </div>
        <div className="pill">
          <strong>{dep}%</strong>
          <span className="muted"><br />Dependent</span>
        </div>
      </div>
      <div className="progress" style={{ display: 'flex', marginTop: 14, height: 12 }}>
        <span style={{ width: `${ind}%`, background: '#22c55e' }} />
        <span style={{ width: `${ast}%`, background: '#f59e0b' }} />
        <span style={{ width: `${dep}%`, background: '#ef4444' }} />
      </div>
    </div>
  )
}