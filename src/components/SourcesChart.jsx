import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
      <p className="text-text-primary font-semibold">{payload[0].name}</p>
      <p className="text-sm text-text-secondary">{payload[0].value}% do tráfego</p>
    </div>
  )
}

export default function SourcesChart({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Fontes de Tráfego</h3>
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
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          {data.map((source) => (
            <div key={source.fonte} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.cor }} />
                <span className="text-sm text-text-secondary">{source.fonte}</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">{source.valor}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
