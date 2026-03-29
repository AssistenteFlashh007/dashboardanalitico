import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
      <p className="text-text-primary font-semibold">{label}</p>
      <p className="text-sm text-primary-light">{payload[0].value.toLocaleString('pt-BR')}</p>
    </div>
  )
}

export default function FunnelChart({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Funil de Conversão</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="etapa" stroke="#94a3b8" fontSize={12} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="valor" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
