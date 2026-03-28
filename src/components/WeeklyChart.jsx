import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { weeklyTraffic } from '../data/mockData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
      <p className="text-text-primary font-semibold">{label}</p>
      <p className="text-sm text-accent">{payload[0].value.toLocaleString('pt-BR')} visitas</p>
    </div>
  )
}

export default function WeeklyChart() {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Tráfego Semanal</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={weeklyTraffic}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="visitas" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
