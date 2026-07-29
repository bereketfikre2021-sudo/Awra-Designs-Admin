/**
 * Pure SVG bar chart — no dependencies.
 * Props:
 *   data    — [{ label: string, count: number }]
 *   color   — bar fill color (default '#ffffff')
 *   height  — chart height in px (default 120)
 */
export default function BarChart({ data = [], color = '#ffffff', height = 120 }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-24 text-xs text-neutral-700">No data yet</div>
  )

  const max = Math.max(...data.map(d => d.count), 1)
  const barW = 100 / data.length
  const padX = 0.6  // % padding each side of bar
  const chartH = height - 28  // leave 28px for labels

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
        aria-hidden="true"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(t => {
          const y = chartH * (1 - t)
          return (
            <line
              key={t}
              x1="0" y1={y} x2="100" y2={y}
              stroke="#262626" strokeWidth="0.3"
            />
          )
        })}

        {data.map((d, i) => {
          const barH = max === 0 ? 0 : (d.count / max) * chartH
          const x = i * barW + padX
          const w = barW - padX * 2
          const y = chartH - barH

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x} y={y} width={w} height={barH}
                fill={color}
                opacity={barH === 0 ? 0.15 : 0.85}
                rx="0.3"
              />
              {/* Count on top of bar */}
              {d.count > 0 && (
                <text
                  x={x + w / 2} y={y - 1.5}
                  textAnchor="middle"
                  fontSize="3.5"
                  fill={color}
                  opacity="0.7"
                >
                  {d.count}
                </text>
              )}
              {/* Label below */}
              <text
                x={x + w / 2}
                y={chartH + 9}
                textAnchor="middle"
                fontSize="3"
                fill="#525252"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
