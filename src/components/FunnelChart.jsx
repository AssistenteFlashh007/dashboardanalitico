import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-dark-card/95 backdrop-blur-md border border-purple-500/20 rounded-xl p-3 shadow-2xl">
      <p className="text-text-primary font-semibold text-sm">{label}</p>
      <p className="text-sm text-purple-400 font-bold">{payload[0].value.toLocaleString('pt-BR')}</p>
    </div>
  )
}

export default function FunnelChart({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60 hover:border-purple-500/20 transition-all duration-300">
      <h3 className="text-base font-bold text-text-primary mb-4">Funil de Conversao</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <defs>
            <linearGradient id="funnelGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" horizontal={false} />
          <XAxis type="number" stroke="#8b8ba3" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="etapa" stroke="#8b8ba3" fontSize={12} width={80} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} />
          <Bar dataKey="valor" fill="url(#funnelGradient)" radius={[0, 8, 8, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
