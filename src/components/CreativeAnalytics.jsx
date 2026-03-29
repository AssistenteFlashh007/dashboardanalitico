import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchCreativeAnalytics, fetchAccounts } from '../services/api'
import { Palette, Trophy, Medal, Award } from 'lucide-react'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-dark-card/95 backdrop-blur-md border border-purple-500/20 rounded-xl p-3 shadow-2xl">
      <p className="text-text-primary font-semibold text-sm mb-1">{d.nome}</p>
      <p className="text-sm text-purple-400">{d.vendas} vendas ({d.pctVendas}%)</p>
      <p className="text-sm text-success">R$ {d.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p className="text-xs text-text-secondary">Ticket: R$ {d.ticketMedio} | OB: {d.taxaOB}%</p>
    </div>
  )
}

const rankIcons = [
  { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '1' },
  { bg: 'bg-gray-400/20', text: 'text-gray-300', label: '2' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '3' },
]

export default function CreativeAnalytics({ period, platform }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [conta, setConta] = useState('todas')
  const [contas, setContas] = useState(['todas'])
  const [sortBy, setSortBy] = useState('vendas')

  useEffect(() => { fetchAccounts().then(acc => { if (acc) setContas(acc) }) }, [])

  useEffect(() => {
    setLoading(true)
    fetchCreativeAnalytics(period, platform, conta).then(d => { setData(d); setLoading(false) })
  }, [period?.preset, period?.since, period?.until, platform, conta])

  if (loading || !data) return <div className="text-text-secondary text-center py-12">Carregando...</div>
  if (!data.criativos?.length) return <div className="text-text-secondary text-center py-12">Nenhum criativo encontrado. Os criativos vem do campo utm_content.</div>

  const sorted = [...data.criativos].sort((a, b) => b[sortBy] - a[sortBy])
  const top10 = sorted.slice(0, 10)
  const chartData = top10.map(c => ({ ...c, nomeShort: c.nome.length > 25 ? c.nome.substring(0, 22) + '...' : c.nome }))

  return (
    <div className="space-y-6">
      {/* Header + Filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Performance de Criativos</h2>
            <p className="text-xs text-text-secondary">{data.criativos.length} criativos encontrados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contas.length > 1 && (
            <div className="flex bg-dark/60 rounded-xl border border-dark-border/40 p-0.5">
              {contas.map(c => (
                <button key={c} onClick={() => setConta(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${conta === c ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20' : 'text-text-secondary hover:text-text-primary'}`}>
                  {c === 'todas' ? 'Todas' : c}
                </button>
              ))}
            </div>
          )}
          <div className="flex bg-dark/60 rounded-xl border border-dark-border/40 p-0.5">
            {[{ value: 'vendas', label: 'Vendas' }, { value: 'receita', label: 'Receita' }, { value: 'ticketMedio', label: 'Ticket' }, { value: 'taxaOB', label: 'OB%' }].map(s => (
              <button key={s.value} onClick={() => setSortBy(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sortBy === s.value ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'text-text-secondary hover:text-text-primary'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-600/15 to-purple-900/5 rounded-2xl p-4 border border-purple-500/20">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Criativos</p>
          <p className="text-2xl font-extrabold text-purple-400 mt-1">{data.criativos.length}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-600/15 to-cyan-900/5 rounded-2xl p-4 border border-cyan-500/20">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Vendas</p>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1">{data.totalVendas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/15 to-emerald-900/5 rounded-2xl p-4 border border-emerald-500/20">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Receita</p>
          <p className="text-2xl font-extrabold text-success mt-1">R$ {(data.totalReceita / 1000).toFixed(1)}k</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {sorted.slice(0, 3).map((c, i) => (
            <div key={c.nome} className={`bg-dark-card rounded-2xl p-5 border ${i === 0 ? 'border-amber-500/30 ring-1 ring-amber-500/10' : i === 1 ? 'border-gray-400/30' : 'border-orange-500/30'} hover:border-purple-500/30 transition-all`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankIcons[i].bg} ${rankIcons[i].text}`}>
                  {i === 0 ? <Trophy className="w-4 h-4" /> : i === 1 ? <Medal className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                </div>
                <span className="text-xs text-text-secondary font-semibold uppercase">{i === 0 ? 'Ouro' : i === 1 ? 'Prata' : 'Bronze'}</span>
              </div>
              <p className="text-sm font-bold text-text-primary truncate mb-3">{c.nome}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-xs text-text-secondary">Vendas</span><span className="text-xs font-bold text-text-primary">{c.vendas}</span></div>
                <div className="flex justify-between"><span className="text-xs text-text-secondary">Receita</span><span className="text-xs font-bold text-success">R$ {c.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-xs text-text-secondary">Ticket</span><span className="text-xs font-bold text-cyan-400">R$ {c.ticketMedio.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-xs text-text-secondary">OB</span><span className="text-xs font-bold text-purple-400">{c.taxaOB}%</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <h3 className="text-sm font-bold text-text-primary mb-4">Top 10 Criativos</h3>
        <ResponsiveContainer width="100%" height={Math.max(280, top10.length * 36)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <defs>
              <linearGradient id="creativeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" horizontal={false} />
            <XAxis type="number" stroke="#8b8ba3" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="nomeShort" stroke="#8b8ba3" fontSize={11} width={180} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} />
            <Bar dataKey={sortBy} radius={[0, 6, 6, 0]} barSize={22} fill="url(#creativeGradient)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full Table */}
      <div className="bg-dark-card rounded-2xl border border-dark-border/60 overflow-hidden">
        <div className="px-5 py-4"><h3 className="text-sm font-bold text-text-primary">Todos os Criativos</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600/20 to-purple-800/10">
                <th className="py-2.5 px-3 text-left font-semibold text-purple-200 uppercase tracking-wider">#</th>
                <th className="py-2.5 px-3 text-left font-semibold text-purple-200 uppercase tracking-wider">Criativo</th>
                <th className="py-2.5 px-3 text-right font-semibold text-purple-200 uppercase tracking-wider cursor-pointer" onClick={() => setSortBy('vendas')}>Vendas</th>
                <th className="py-2.5 px-3 text-right font-semibold text-purple-200 uppercase tracking-wider cursor-pointer" onClick={() => setSortBy('receita')}>Receita</th>
                <th className="py-2.5 px-3 text-right font-semibold text-purple-200 uppercase tracking-wider">%</th>
                <th className="py-2.5 px-3 text-right font-semibold text-purple-200 uppercase tracking-wider cursor-pointer" onClick={() => setSortBy('ticketMedio')}>Ticket</th>
                <th className="py-2.5 px-3 text-right font-semibold text-purple-200 uppercase tracking-wider cursor-pointer" onClick={() => setSortBy('taxaOB')}>OB%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.nome} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                  <td className="py-2.5 px-3">
                    {i < 3 ? (
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankIcons[i].bg} ${rankIcons[i].text}`}>{i + 1}</span>
                    ) : (
                      <span className="text-text-secondary text-xs ml-1.5">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-text-primary max-w-[300px] truncate">{c.nome}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-text-primary">{c.vendas}</td>
                  <td className="py-2.5 px-3 text-right text-success">R$ {c.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">{c.pctVendas}%</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">R$ {c.ticketMedio.toFixed(2)}</td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${c.taxaOB > 30 ? 'text-success' : c.taxaOB > 15 ? 'text-warning' : 'text-text-secondary'}`}>{c.taxaOB}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
