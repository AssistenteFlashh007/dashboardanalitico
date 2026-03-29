import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-dark-card/95 backdrop-blur-md border border-purple-500/20 rounded-xl p-3 shadow-2xl">
      <p className="text-text-primary font-semibold text-sm">{label}</p>
      <p className="text-sm text-cyan-400 font-bold">{payload[0].value.toLocaleString('pt-BR')} visitas</p>
    </div>
  )
}

export default function WeeklyChart({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60 hover:border-purple-500/20 transition-all duration-300">
      <h3 className="text-base font-bold text-text-primary mb-4">Trafego Semanal</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <defs>
            <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" vertical={false} />
          <XAxis dataKey="dia" stroke="#8b8ba3" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#8b8ba3" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }} />
          <Bar dataKey="visitas" fill="url(#weeklyGradient)" radius={[6, 6, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
