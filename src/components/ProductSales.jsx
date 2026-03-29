import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
      <p className="text-text-primary font-semibold text-sm mb-1">{d.produto}</p>
      <p className="text-sm text-primary-light">{d.vendas} vendas</p>
      <p className="text-sm text-success">R$ {d.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p className="text-xs text-text-secondary">Ticket: R$ {(d.receita / d.vendas).toFixed(2)}</p>
    </div>
  )
}

export default function ProductSales({ data }) {
  if (!data?.salesByProduct?.length) return null

  const products = data.salesByProduct.slice(0, 10)

  // Encurtar nomes longos
  const chartData = products.map((p, i) => ({
    ...p,
    nome: p.produto.length > 30 ? p.produto.substring(0, 27) + '...' : p.produto,
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Volume de Vendas por Produto</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico */}
        <ResponsiveContainer width="100%" height={Math.max(250, products.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
            <YAxis type="category" dataKey="nome" stroke="#94a3b8" fontSize={11} width={180} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="vendas" radius={[0, 6, 6, 0]} barSize={24}>
              {chartData.map((entry, i) => (
                <rect key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tabela */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {products.map((p, i) => {
            const ticket = p.vendas > 0 ? (p.receita / p.vendas) : 0
            const maxVendas = products[0]?.vendas || 1
            const pct = (p.vendas / maxVendas) * 100

            return (
              <div key={p.produto} className="p-3 rounded-xl bg-dark/50 border border-dark-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary truncate max-w-[250px]">
                    {p.produto}
                  </span>
                  <span className="text-sm font-bold text-primary-light ml-2">{p.vendas}</span>
                </div>
                <div className="w-full bg-dark-border/30 rounded-full h-1.5 mb-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-success">
                    R$ {p.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-text-secondary">
                    Ticket: R$ {ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
