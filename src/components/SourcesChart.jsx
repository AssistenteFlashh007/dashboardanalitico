import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-card/95 backdrop-blur-md border border-purple-500/20 rounded-xl p-3 shadow-2xl">
      <p className="text-text-primary font-semibold text-sm">{payload[0].name}</p>
      <p className="text-xs text-text-secondary">{payload[0].value}% do trafego</p>
    </div>
  )
}

export default function SourcesChart({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60 hover:border-purple-500/20 transition-all duration-300">
      <h3 className="text-base font-bold text-text-primary mb-4">Fontes de Trafego</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="valor"
              nameKey="fonte"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          {data.map((source, i) => (
            <div key={source.fonte} className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-dark-card" style={{ backgroundColor: COLORS[i % COLORS.length], boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}40` }} />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{source.fonte}</span>
              </div>
              <span className="text-sm font-bold text-text-primary">{source.valor}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
