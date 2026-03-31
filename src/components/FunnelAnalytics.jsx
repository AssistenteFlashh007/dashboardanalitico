import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchFunnelAnalytics, fetchAccounts } from '../services/api'
import { GitBranch, ShoppingCart, ArrowUpRight, ArrowDownRight, DollarSign, Target, Percent, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

function calcVar(curr, prev, invert = false) {
  if (prev == null || curr == null) return null
  if (prev === 0 && curr === 0) return null
  if (prev === 0) return { pct: 100, label: 'Novo' }
  const pct = Math.round(((curr - prev) / prev) * 100)
  return { pct, positive: invert ? pct <= 0 : pct >= 0 }
}

function VarBadge({ curr, prev, invert = false, className = '' }) {
  const v = calcVar(curr, prev, invert)
  if (!v) return null
  if (v.label) return <span className={`text-xs font-bold text-cyan-400 ${className}`}>{v.label}</span>
  const isPos = v.positive
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'} ${className}`}>
      {v.pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {v.pct >= 0 ? '+' : ''}{v.pct}%
    </span>
  )
}

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

function FunnelCard({ icon: Icon, label, value, sub, color, gradient, varBadge }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-4 border border-dark-border/30`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex items-center gap-2">
        <p className={`text-xl font-extrabold ${color}`}>{value}</p>
        {varBadge}
      </div>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  )
}

function Metric({ label, value, sub, color = 'text-purple-400', varBadge }) {
  return (
    <div className="bg-dark/40 rounded-xl p-3 border border-dark-border/30">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {varBadge}
      </div>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  )
}

const thClass = "py-2.5 px-3 font-semibold text-purple-200 text-xs uppercase tracking-wider"

export default function FunnelAnalytics({ period, platform }) {
  const [data, setData] = useState(null)
  const [prev, setPrev] = useState(null)
  const [loading, setLoading] = useState(true)
  const [conta, setConta] = useState('todas')
  const [contas, setContas] = useState(['todas'])
  const [compare, setCompare] = useState(false)

  useEffect(() => { fetchAccounts().then(acc => { if (acc) setContas(acc) }) }, [])

  useEffect(() => {
    setLoading(true)
    if (compare) {
      fetchFunnelAnalytics(period, platform, conta, true).then(r => {
        setData(r.data); setPrev(r.prev); setLoading(false)
      })
    } else {
      fetchFunnelAnalytics(period, platform, conta, false).then(d => {
        setData(d); setPrev(null); setLoading(false)
      })
    }
  }, [period?.preset, period?.since, period?.until, platform, conta, compare])

  if (loading || !data) return <div className="text-text-secondary text-center py-12">Carregando...</div>
  if (data.total === 0) return <div className="text-text-secondary text-center py-12">Nenhuma venda no periodo. Importe as planilhas primeiro.</div>

  const tc = data.taxaConversao || {}
  const ptc = prev?.taxaConversao || {}
  const V = compare && prev ? (curr, p, inv) => <VarBadge curr={curr} prev={p} invert={inv} /> : () => null

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCompare(!compare)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              compare
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-500/50 shadow-md shadow-purple-500/20'
                : 'bg-dark/60 text-text-secondary border-dark-border/40 hover:border-purple-500/40 hover:text-text-primary'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Comparar
          </button>
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
      </div>

      {/* Top Cards - Funil Visual */}
      {compare && prev && (
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-purple-300">Comparando com o periodo anterior ({prev.total} vendas • R$ {(prev.receitaTotal / 1000).toFixed(1)}k)</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <FunnelCard icon={ShoppingCart} label="Vendas" value={data.total.toLocaleString('pt-BR')} color="text-purple-400" gradient="from-purple-600/15 to-purple-900/5" varBadge={V(data.total, prev?.total)} />
        <FunnelCard icon={DollarSign} label="Receita" value={`R$ ${(data.receitaTotal / 1000).toFixed(1)}k`} color="text-success" gradient="from-emerald-600/15 to-emerald-900/5" varBadge={V(data.receitaTotal, prev?.receitaTotal)} />
        <FunnelCard icon={Target} label="Ticket Medio" value={`R$ ${data.ticketMedio}`} color="text-cyan-400" gradient="from-cyan-600/15 to-cyan-900/5" varBadge={V(data.ticketMedio, prev?.ticketMedio)} />
        <FunnelCard icon={ArrowUpRight} label="Order Bump" value={`${data.orderbump.taxa}%`} sub={`${data.orderbump.total} com OB • R$ ${(data.orderbump.receitaOB / 1000).toFixed(1)}k`} color="text-amber-400" gradient="from-amber-600/15 to-amber-900/5" varBadge={V(data.orderbump.taxa, prev?.orderbump?.taxa)} />
        <FunnelCard icon={ArrowUpRight} label="Upsell" value={`${data.upsell.taxa}%`} sub={`${data.upsell.total} upsells`} color="text-rose-400" gradient="from-rose-600/15 to-rose-900/5" varBadge={V(data.upsell.taxa, prev?.upsell?.taxa)} />
        <FunnelCard icon={Percent} label="Click → Venda" value={`${tc.clickToSale}%`} sub={`CPA: R$ ${tc.cpa?.toFixed(2)}`} color={tc.clickToSale > 3 ? 'text-success' : 'text-warning'} gradient="from-blue-600/15 to-blue-900/5" varBadge={V(tc.clickToSale, ptc.clickToSale)} />
      </div>

      {/* Taxas de Conversao */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <h3 className="text-sm font-bold text-text-primary mb-4">Metricas de Conversao</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Metric label="CPC" value={`R$ ${tc.cpc?.toFixed(2)}`} color="text-text-primary" varBadge={V(tc.cpc, ptc.cpc, true)} />
          <Metric label="CPM" value={`R$ ${tc.cpm?.toFixed(2)}`} color="text-text-primary" varBadge={V(tc.cpm, ptc.cpm, true)} />
          <Metric label="CPA Real" value={`R$ ${tc.cpa?.toFixed(2)}`} color="text-warning" varBadge={V(tc.cpa, ptc.cpa, true)} />
          <Metric label="Alcance → Venda" value={`${tc.alcanceToSale}%`} color="text-cyan-400" varBadge={V(tc.alcanceToSale, ptc.alcanceToSale)} />
          <Metric label="Ticket c/ OB" value={`R$ ${data.orderbump.ticketComOB.toFixed(2)}`} sub={`Sem: R$ ${data.orderbump.ticketSemOB.toFixed(2)}`} varBadge={V(data.orderbump.ticketComOB, prev?.orderbump?.ticketComOB)} />
          <Metric label="Investido" value={`R$ ${(tc.totalInvestido / 1000).toFixed(1)}k`} color="text-text-secondary" varBadge={V(tc.totalInvestido, ptc.totalInvestido, true)} />
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
                  {compare && prev && <th className={`${thClass} text-right`}>Var</th>}
                  <th className={`${thClass} text-right`}>Receita</th>
                  <th className={`${thClass} text-right`}>Connect</th>
                  <th className={`${thClass} text-right`}>CPA</th>
                  <th className={`${thClass} text-right`}>ROAS</th>
                  <th className={`${thClass} text-right`}>OB%</th>
                </tr></thead>
                <tbody>
                  {data.tiposFunil.map((f, i) => {
                    const pf = prev?.tiposFunil?.find(p => p.tipo === f.tipo)
                    return (
                    <tr key={f.tipo} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                      <td className="py-2.5 px-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-text-primary font-medium">{f.tipo}</span></div></td>
                      <td className="py-2.5 px-3 text-right font-semibold text-text-primary">{f.vendas}</td>
                      {compare && prev && <td className="py-2.5 px-3 text-right">{V(f.vendas, pf?.vendas)}</td>}
                      <td className="py-2.5 px-3 text-right text-success">R$ {(f.receita / 1000).toFixed(1)}k</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${f.connectRate > 3 ? 'text-success' : f.connectRate > 1.5 ? 'text-warning' : 'text-danger'}`}>{f.connectRate != null ? `${f.connectRate}%` : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-warning">{f.cpa != null ? `R$ ${f.cpa.toFixed(0)}` : '-'}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${f.roas >= 1 ? 'text-success' : 'text-danger'}`}>{f.roas != null ? `${f.roas}x` : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-purple-400">{f.taxaOB}%</td>
                    </tr>
                    )
                  })}
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
                  {compare && prev && <th className={`${thClass} text-right`}>Var</th>}
                  <th className={`${thClass} text-right`}>Receita</th>
                  <th className={`${thClass} text-right`}>Connect</th>
                  <th className={`${thClass} text-right`}>CPA</th>
                  <th className={`${thClass} text-right`}>ROAS</th>
                </tr></thead>
                <tbody>
                  {data.estrategias.map((e, i) => {
                    const pe = prev?.estrategias?.find(p => p.estrategia === e.estrategia)
                    return (
                    <tr key={e.estrategia} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                      <td className="py-2.5 px-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-text-primary font-medium">{e.estrategia}</span></div></td>
                      <td className="py-2.5 px-3 text-right font-semibold text-text-primary">{e.vendas}</td>
                      {compare && prev && <td className="py-2.5 px-3 text-right">{V(e.vendas, pe?.vendas)}</td>}
                      <td className="py-2.5 px-3 text-right text-success">R$ {(e.receita / 1000).toFixed(1)}k</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${e.connectRate > 3 ? 'text-success' : e.connectRate > 1.5 ? 'text-warning' : 'text-danger'}`}>{e.connectRate != null ? `${e.connectRate}%` : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-warning">{e.cpa != null ? `R$ ${e.cpa.toFixed(0)}` : '-'}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${e.roas >= 1 ? 'text-success' : 'text-danger'}`}>{e.roas != null ? `${e.roas}x` : '-'}</td>
                    </tr>
                    )
                  })}
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
                {compare && prev && <th className={`${thClass} text-right`}>Var</th>}
                <th className={`${thClass} text-right`}>Receita</th>
                <th className={`${thClass} text-right`}>Ticket</th>
                <th className={`${thClass} text-right`}>OB%</th>
              </tr></thead>
              <tbody>
                {data.ofertaConversao.map((o, i) => {
                  const po = prev?.ofertaConversao?.find(p => p.oferta === o.oferta)
                  return (
                  <tr key={o.oferta} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                    <td className="py-2.5 px-3 text-text-primary truncate max-w-[180px]">{o.oferta}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-text-primary">{o.vendas}</td>
                    {compare && prev && <td className="py-2.5 px-3 text-right">{V(o.vendas, po?.vendas)}</td>}
                    <td className="py-2.5 px-3 text-right text-success">R$ {o.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-400">R$ {o.ticketMedio}</td>
                    <td className="py-2.5 px-3 text-right text-purple-400">{o.taxaOB}%</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
