import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-dark-card/95 backdrop-blur-md border border-purple-500/20 rounded-xl p-3 shadow-2xl">
      <p className="text-text-primary font-semibold mb-2 text-sm">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>{entry.value.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrafficChart({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60 hover:border-purple-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-text-primary">Performance Geral</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-purple-500" />
            <span className="text-text-secondary">Visitantes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-cyan-400" />
            <span className="text-text-secondary">Sessoes</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} barCategoryGap="25%">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" vertical={false} />
          <XAxis dataKey="mes" stroke="#8b8ba3" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#8b8ba3" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} />
          <Bar dataKey="visitantes" name="Visitantes" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="sessoes" name="Sessoes" stroke="#22d3ee" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#22d3ee', stroke: '#0a0a1a', strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
