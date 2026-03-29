import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchFunnelAnalytics, fetchAccounts } from '../services/api'
import { GitBranch, ShoppingCart, ArrowUpRight, DollarSign, Target, Percent } from 'lucide-react'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-dark-card/95 backdrop-blur-md border border-purple-500/20 rounded-xl p-3 shadow-2xl">
      <p className="text-text-primary font-semibold text-sm">{d.nome || d.metodo || d.oferta}</p>
      {d.vendas != null && <p className="text-sm text-purple-400">{d.vendas} vendas</p>}
      {d.receita != null && <p className="text-sm text-success">R$ {d.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
    </div>
  )
}

function FunnelCard({ icon: Icon, label, value, sub, color, gradient }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-4 border border-dark-border/30`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  )
}

function Metric({ label, value, sub, color = 'text-purple-400' }) {
  return (
    <div className="bg-dark/40 rounded-xl p-3 border border-dark-border/30">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  )
}

const thClass = "py-2.5 px-3 font-semibold text-purple-200 text-xs uppercase tracking-wider"

export default function FunnelAnalytics({ period, platform }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [conta, setConta] = useState('todas')
  const [contas, setContas] = useState(['todas'])

  useEffect(() => { fetchAccounts().then(acc => { if (acc) setContas(acc) }) }, [])

  useEffect(() => {
    setLoading(true)
    fetchFunnelAnalytics(period, platform, conta).then(d => { setData(d); setLoading(false) })
  }, [period?.preset, period?.since, period?.until, platform, conta])

  if (loading || !data) return <div className="text-text-secondary text-center py-12">Carregando...</div>
  if (data.total === 0) return <div className="text-text-secondary text-center py-12">Nenhuma venda no periodo. Importe as planilhas primeiro.</div>

  const tc = data.taxaConversao || {}

  return (
    <div className="space-y-6">
      {/* Header + Filtro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Funil & Conversao</h2>
            <p className="text-xs text-text-secondary">Produto, Order Bump e Upsell</p>
          </div>
        </div>
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
      </div>

      {/* Top Cards - Funil Visual */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <FunnelCard icon={ShoppingCart} label="Vendas" value={data.total.toLocaleString('pt-BR')} color="text-purple-400" gradient="from-purple-600/15 to-purple-900/5" />
        <FunnelCard icon={DollarSign} label="Receita" value={`R$ ${(data.receitaTotal / 1000).toFixed(1)}k`} color="text-success" gradient="from-emerald-600/15 to-emerald-900/5" />
        <FunnelCard icon={Target} label="Ticket Medio" value={`R$ ${data.ticketMedio}`} color="text-cyan-400" gradient="from-cyan-600/15 to-cyan-900/5" />
        <FunnelCard icon={ArrowUpRight} label="Order Bump" value={`${data.orderbump.taxa}%`} sub={`${data.orderbump.total} com OB • R$ ${(data.orderbump.receitaOB / 1000).toFixed(1)}k`} color="text-amber-400" gradient="from-amber-600/15 to-amber-900/5" />
        <FunnelCard icon={ArrowUpRight} label="Upsell" value={`${data.upsell.taxa}%`} sub={`${data.upsell.total} upsells`} color="text-rose-400" gradient="from-rose-600/15 to-rose-900/5" />
        <FunnelCard icon={Percent} label="Click → Venda" value={`${tc.clickToSale}%`} sub={`CPA: R$ ${tc.cpa?.toFixed(2)}`} color={tc.clickToSale > 3 ? 'text-success' : 'text-warning'} gradient="from-blue-600/15 to-blue-900/5" />
      </div>

      {/* Taxas de Conversao */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <h3 className="text-sm font-bold text-text-primary mb-4">Metricas de Conversao</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Metric label="CPC" value={`R$ ${tc.cpc?.toFixed(2)}`} color="text-text-primary" />
          <Metric label="CPM" value={`R$ ${tc.cpm?.toFixed(2)}`} color="text-text-primary" />
          <Metric label="CPA Real" value={`R$ ${tc.cpa?.toFixed(2)}`} color="text-warning" />
          <Metric label="Alcance → Venda" value={`${tc.alcanceToSale}%`} color="text-cyan-400" />
          <Metric label="Ticket c/ OB" value={`R$ ${data.orderbump.ticketComOB.toFixed(2)}`} sub={`Sem: R$ ${data.orderbump.ticketSemOB.toFixed(2)}`} />
          <Metric label="Investido" value={`R$ ${(tc.totalInvestido / 1000).toFixed(1)}k`} color="text-text-secondary" />
        </div>
      </div>

      {/* Tipos de Funil + Estrategias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card rounded-2xl border border-dark-border/60 overflow-hidden">
          <div className="px-5 py-4"><h3 className="text-sm font-bold text-text-primary">Por Tipo de Funil</h3></div>
          {data.tiposFunil?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-gradient-to-r from-purple-600/20 to-purple-800/10">
                  <th className={`${thClass} text-left`}>Funil</th>
                  <th className={`${thClass} text-right`}>Vendas</th>
                  <th className={`${thClass} text-right`}>Receita</th>
                  <th className={`${thClass} text-right`}>Connect</th>
                  <th className={`${thClass} text-right`}>CPA</th>
                  <th className={`${thClass} text-right`}>ROAS</th>
                  <th className={`${thClass} text-right`}>OB%</th>
                </tr></thead>
                <tbody>
                  {data.tiposFunil.map((f, i) => (
                    <tr key={f.tipo} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                      <td className="py-2.5 px-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-text-primary font-medium">{f.tipo}</span></div></td>
                      <td className="py-2.5 px-3 text-right font-semibold text-text-primary">{f.vendas}</td>
                      <td className="py-2.5 px-3 text-right text-success">R$ {(f.receita / 1000).toFixed(1)}k</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${f.connectRate > 3 ? 'text-success' : f.connectRate > 1.5 ? 'text-warning' : 'text-danger'}`}>{f.connectRate != null ? `${f.connectRate}%` : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-warning">{f.cpa != null ? `R$ ${f.cpa.toFixed(0)}` : '-'}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${f.roas >= 1 ? 'text-success' : 'text-danger'}`}>{f.roas != null ? `${f.roas}x` : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-purple-400">{f.taxaOB}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="px-5 pb-5 text-text-secondary text-sm">Sem dados</p>}
        </div>

        <div className="bg-dark-card rounded-2xl border border-dark-border/60 overflow-hidden">
          <div className="px-5 py-4"><h3 className="text-sm font-bold text-text-primary">Por Estrategia</h3></div>
          {data.estrategias?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-gradient-to-r from-purple-600/20 to-purple-800/10">
                  <th className={`${thClass} text-left`}>Estrategia</th>
                  <th className={`${thClass} text-right`}>Vendas</th>
                  <th className={`${thClass} text-right`}>Receita</th>
                  <th className={`${thClass} text-right`}>Connect</th>
                  <th className={`${thClass} text-right`}>CPA</th>
                  <th className={`${thClass} text-right`}>ROAS</th>
                </tr></thead>
                <tbody>
                  {data.estrategias.map((e, i) => (
                    <tr key={e.estrategia} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                      <td className="py-2.5 px-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-text-primary font-medium">{e.estrategia}</span></div></td>
                      <td className="py-2.5 px-3 text-right font-semibold text-text-primary">{e.vendas}</td>
                      <td className="py-2.5 px-3 text-right text-success">R$ {(e.receita / 1000).toFixed(1)}k</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${e.connectRate > 3 ? 'text-success' : e.connectRate > 1.5 ? 'text-warning' : 'text-danger'}`}>{e.connectRate != null ? `${e.connectRate}%` : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-warning">{e.cpa != null ? `R$ ${e.cpa.toFixed(0)}` : '-'}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${e.roas >= 1 ? 'text-success' : 'text-danger'}`}>{e.roas != null ? `${e.roas}x` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="px-5 pb-5 text-text-secondary text-sm">Sem dados</p>}
        </div>
      </div>

      {/* Checkouts + Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
          <h3 className="text-sm font-bold text-text-primary mb-4">Metodos de Pagamento</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="45%" height={180}>
              <PieChart>
                <Pie data={data.metodosPagamento} dataKey="vendas" nameKey="metodo" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                  {data.metodosPagamento.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {data.metodosPagamento.map((m, i) => (
                <div key={m.metodo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-text-secondary">{m.metodo}</span>
                  </div>
                  <span className="text-xs font-bold text-text-primary">{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-dark-card rounded-2xl border border-dark-border/60 overflow-hidden">
          <div className="px-5 py-4"><h3 className="text-sm font-bold text-text-primary">Conversao por Oferta</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gradient-to-r from-purple-600/20 to-purple-800/10">
                <th className={`${thClass} text-left`}>Oferta</th>
                <th className={`${thClass} text-right`}>Vendas</th>
                <th className={`${thClass} text-right`}>Receita</th>
                <th className={`${thClass} text-right`}>Ticket</th>
                <th className={`${thClass} text-right`}>OB%</th>
              </tr></thead>
              <tbody>
                {data.ofertaConversao.map((o, i) => (
                  <tr key={o.oferta} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                    <td className="py-2.5 px-3 text-text-primary truncate max-w-[180px]">{o.oferta}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-text-primary">{o.vendas}</td>
                    <td className="py-2.5 px-3 text-right text-success">R$ {o.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-400">R$ {o.ticketMedio}</td>
                    <td className="py-2.5 px-3 text-right text-purple-400">{o.taxaOB}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
