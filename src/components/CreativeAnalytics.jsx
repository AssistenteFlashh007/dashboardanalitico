import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchCreativeAnalytics, fetchAccounts } from '../services/api'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
      <p className="text-text-primary font-semibold text-sm mb-1">{d.nome}</p>
      <p className="text-sm text-primary-light">{d.vendas} vendas ({d.pctVendas}%)</p>
      <p className="text-sm text-success">R$ {d.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p className="text-xs text-text-secondary">Ticket: R$ {d.ticketMedio} | OB: {d.taxaOB}%</p>
    </div>
  )
}

export default function CreativeAnalytics({ period, platform }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [conta, setConta] = useState('todas')
  const [contas, setContas] = useState(['todas'])
  const [sortBy, setSortBy] = useState('vendas')

  useEffect(() => {
    fetchAccounts().then(acc => { if (acc) setContas(acc) })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchCreativeAnalytics(period, platform, conta).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [period?.preset, period?.since, period?.until, platform, conta])

  if (loading || !data) return <div className="text-text-secondary text-center py-12">Carregando análise de criativos...</div>
  if (!data.criativos?.length) return <div className="text-text-secondary text-center py-12">Nenhum criativo encontrado no período. Os criativos vêm do campo utm_content.</div>

  const sorted = [...data.criativos].sort((a, b) => b[sortBy] - a[sortBy])
  const top10 = sorted.slice(0, 10)

  // Dados para gráfico
  const chartData = top10.map(c => ({
    ...c,
    nomeShort: c.nome.length > 25 ? c.nome.substring(0, 22) + '...' : c.nome,
  }))

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Conta:</span>
          <div className="flex bg-dark rounded-lg border border-dark-border p-0.5">
            {contas.map(c => (
              <button
                key={c}
                onClick={() => setConta(c)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  conta === c ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {c === 'todas' ? 'Todas' : c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Ordenar:</span>
          <div className="flex bg-dark rounded-lg border border-dark-border p-0.5">
            {[
              { value: 'vendas', label: 'Vendas' },
              { value: 'receita', label: 'Receita' },
              { value: 'ticketMedio', label: 'Ticket' },
              { value: 'taxaOB', label: 'OB%' },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sortBy === s.value ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <p className="text-xs text-text-secondary">Total Criativos</p>
          <p className="text-2xl font-bold text-primary-light">{data.criativos.length}</p>
        </div>
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <p className="text-xs text-text-secondary">Total Vendas</p>
          <p className="text-2xl font-bold text-text-primary">{data.totalVendas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <p className="text-xs text-text-secondary">Receita Total</p>
          <p className="text-2xl font-bold text-success">R$ {data.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Gráfico top 10 */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Top 10 Criativos por {sortBy === 'vendas' ? 'Vendas' : sortBy === 'receita' ? 'Receita' : sortBy === 'ticketMedio' ? 'Ticket' : 'Order Bump'}</h3>
        <ResponsiveContainer width="100%" height={Math.max(300, top10.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
            <YAxis type="category" dataKey="nomeShort" stroke="#94a3b8" fontSize={11} width={180} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={sortBy} radius={[0, 6, 6, 0]} barSize={24} fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela completa */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Todos os Criativos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary border-b border-dark-border">
                <th className="text-left py-3 pr-4 font-medium">#</th>
                <th className="text-left py-3 pr-4 font-medium">Criativo</th>
                <th className="text-right py-3 pr-4 font-medium cursor-pointer hover:text-text-primary" onClick={() => setSortBy('vendas')}>Vendas</th>
                <th className="text-right py-3 pr-4 font-medium cursor-pointer hover:text-text-primary" onClick={() => setSortBy('receita')}>Receita</th>
                <th className="text-right py-3 pr-4 font-medium">% Vendas</th>
                <th className="text-right py-3 pr-4 font-medium cursor-pointer hover:text-text-primary" onClick={() => setSortBy('ticketMedio')}>Ticket</th>
                <th className="text-right py-3 font-medium cursor-pointer hover:text-text-primary" onClick={() => setSortBy('taxaOB')}>OB%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.nome} className="border-b border-dark-border/50 hover:bg-dark-border/20 transition-colors">
                  <td className="py-2.5 pr-4 text-text-secondary text-xs">{i + 1}</td>
                  <td className="py-2.5 pr-4 font-medium text-text-primary max-w-[300px] truncate">{c.nome}</td>
                  <td className="py-2.5 pr-4 text-right text-text-primary font-semibold">{c.vendas}</td>
                  <td className="py-2.5 pr-4 text-right text-success">R$ {c.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 pr-4 text-right text-text-secondary">{c.pctVendas}%</td>
                  <td className="py-2.5 pr-4 text-right text-accent">R$ {c.ticketMedio.toFixed(2)}</td>
                  <td className={`py-2.5 text-right font-medium ${c.taxaOB > 30 ? 'text-success' : c.taxaOB > 15 ? 'text-warning' : 'text-text-secondary'}`}>{c.taxaOB}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
