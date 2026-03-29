import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchFunnelAnalytics, fetchAccounts } from '../services/api'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
      <p className="text-text-primary font-semibold text-sm">{d.nome || d.metodo || d.oferta}</p>
      {d.vendas != null && <p className="text-sm text-primary-light">{d.vendas} vendas</p>}
      {d.receita != null && <p className="text-sm text-success">R$ {d.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
    </div>
  )
}

function Metric({ label, value, sub, color = 'text-primary-light', size = 'normal' }) {
  return (
    <div className="bg-dark/50 rounded-xl p-4 border border-dark-border/50">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`${size === 'big' ? 'text-2xl' : 'text-xl'} font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  )
}

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
  if (data.total === 0) return <div className="text-text-secondary text-center py-12">Nenhuma venda no período. Importe as planilhas primeiro.</div>

  const tc = data.taxaConversao || {}

  return (
    <div className="space-y-6">
      {/* Filtro por conta */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">Conta:</span>
        <div className="flex bg-dark rounded-lg border border-dark-border p-0.5 flex-wrap">
          {contas.map(c => (
            <button key={c} onClick={() => setConta(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${conta === c ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
              {c === 'todas' ? 'Todas' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Taxas de Conversão do Funil */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Taxas de Conversão</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Metric label="Cliques → Venda" value={`${tc.clickToSale}%`}
            sub={`${tc.totalCliques?.toLocaleString('pt-BR')} cliques`}
            color={tc.clickToSale > 3 ? 'text-success' : tc.clickToSale > 1.5 ? 'text-warning' : 'text-danger'} />
          <Metric label="CPA Real" value={`R$ ${tc.cpa?.toFixed(2)}`}
            sub={`${data.total} vendas`} color="text-warning" />
          <Metric label="CPC" value={`R$ ${tc.cpc?.toFixed(2)}`} color="text-text-primary" />
          <Metric label="CPM" value={`R$ ${tc.cpm?.toFixed(2)}`} color="text-text-primary" />
          <Metric label="Alcance → Venda" value={`${tc.alcanceToSale}%`}
            sub={`${tc.totalAlcance?.toLocaleString('pt-BR')} alcance`} color="text-accent" />
          <Metric label="Investido" value={`R$ ${tc.totalInvestido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            color="text-text-secondary" />
        </div>
      </div>

      {/* KPIs OB + Upsell */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Metric label="Total Vendas" value={data.total.toLocaleString('pt-BR')} />
        <Metric label="Receita" value={`R$ ${data.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="text-success" />
        <Metric label="Ticket Médio" value={`R$ ${data.ticketMedio}`} color="text-accent" />
        <Metric label="Taxa Order Bump" value={`${data.orderbump.taxa}%`}
          sub={`${data.orderbump.total} com OB`}
          color={data.orderbump.taxa > 30 ? 'text-success' : data.orderbump.taxa > 15 ? 'text-warning' : 'text-danger'} />
        <Metric label="Taxa Upsell" value={`${data.upsell.taxa}%`}
          sub={`${data.upsell.total} upsells`}
          color={data.upsell.taxa > 20 ? 'text-success' : data.upsell.taxa > 10 ? 'text-warning' : 'text-danger'} />
        <Metric label="Ticket c/ OB" value={`R$ ${data.orderbump.ticketComOB.toFixed(2)}`}
          sub={`Sem: R$ ${data.orderbump.ticketSemOB.toFixed(2)}`} />
      </div>

      {/* Tipos de Funil (quizz, pv-minivsl, etc) + Estratégias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de Funil */}
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Performance por Tipo de Funil</h3>
          {data.tiposFunil?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-secondary border-b border-dark-border">
                    <th className="text-left py-2 pr-2 font-medium">Funil</th>
                    <th className="text-right py-2 pr-2 font-medium">Vendas</th>
                    <th className="text-right py-2 pr-2 font-medium">Receita</th>
                    <th className="text-right py-2 pr-2 font-medium">Connect Rate</th>
                    <th className="text-right py-2 pr-2 font-medium">CPA</th>
                    <th className="text-right py-2 pr-2 font-medium">ROAS</th>
                    <th className="text-right py-2 pr-2 font-medium">Ticket</th>
                    <th className="text-right py-2 font-medium">OB%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tiposFunil.map((f, i) => (
                    <tr key={f.tipo} className="border-b border-dark-border/30 hover:bg-dark-border/20">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-text-primary font-medium">{f.tipo}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 text-right text-text-primary font-semibold">{f.vendas}</td>
                      <td className="py-2.5 pr-2 text-right text-success">R$ {f.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                      <td className={`py-2.5 pr-2 text-right font-semibold ${f.connectRate > 3 ? 'text-success' : f.connectRate > 1.5 ? 'text-warning' : 'text-danger'}`}>
                        {f.connectRate != null ? `${f.connectRate}%` : '-'}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-warning">{f.cpa != null ? `R$ ${f.cpa.toFixed(0)}` : '-'}</td>
                      <td className={`py-2.5 pr-2 text-right font-semibold ${f.roas >= 1 ? 'text-success' : 'text-danger'}`}>
                        {f.roas != null ? `${f.roas}x` : '-'}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-accent">R$ {f.ticketMedio}</td>
                      <td className="py-2.5 text-right text-text-secondary">{f.taxaOB}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-text-secondary text-sm">Sem dados de funil</p>}
        </div>

        {/* Estratégias */}
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Performance por Estratégia</h3>
          {data.estrategias?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-secondary border-b border-dark-border">
                    <th className="text-left py-2 pr-2 font-medium">Estratégia</th>
                    <th className="text-right py-2 pr-2 font-medium">Vendas</th>
                    <th className="text-right py-2 pr-2 font-medium">Receita</th>
                    <th className="text-right py-2 pr-2 font-medium">Connect Rate</th>
                    <th className="text-right py-2 pr-2 font-medium">CPA</th>
                    <th className="text-right py-2 font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.estrategias.map((e, i) => (
                    <tr key={e.estrategia} className="border-b border-dark-border/30 hover:bg-dark-border/20">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-text-primary font-medium">{e.estrategia}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 text-right text-text-primary font-semibold">{e.vendas}</td>
                      <td className="py-2.5 pr-2 text-right text-success">R$ {e.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                      <td className={`py-2.5 pr-2 text-right font-semibold ${e.connectRate > 3 ? 'text-success' : e.connectRate > 1.5 ? 'text-warning' : 'text-danger'}`}>
                        {e.connectRate != null ? `${e.connectRate}%` : '-'}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-warning">{e.cpa != null ? `R$ ${e.cpa.toFixed(0)}` : '-'}</td>
                      <td className={`py-2.5 text-right font-semibold ${e.roas >= 1 ? 'text-success' : 'text-danger'}`}>
                        {e.roas != null ? `${e.roas}x` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-text-secondary text-sm">Sem dados</p>}
        </div>
      </div>

      {/* Funis de Checkout + Checkouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Funis de Checkout</h3>
          {data.funis?.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {data.funis.map((f, i) => (
                <div key={f.nome} className="p-3 rounded-xl bg-dark/50 border border-dark-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-primary truncate max-w-[250px]">{f.nome}</span>
                    <span className="text-sm font-bold text-primary-light">{f.vendas}</span>
                  </div>
                  <div className="w-full bg-dark-border/30 rounded-full h-1.5 mb-2">
                    <div className="h-1.5 rounded-full" style={{ width: `${(f.vendas / data.funis[0].vendas) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-success">R$ {f.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-text-secondary">Ticket: R$ {f.ticketMedio}</span>
                    <span className="text-warning">OB: {f.taxaOB}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-text-secondary text-sm">Sem dados de funil</p>}
        </div>

        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Páginas de Checkout</h3>
          {data.checkouts?.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {data.checkouts.map((c, i) => (
                <div key={c.nome} className="p-3 rounded-xl bg-dark/50 border border-dark-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-primary truncate max-w-[250px]">{c.nome}</span>
                    <span className="text-sm font-bold text-primary-light">{c.vendas}</span>
                  </div>
                  <div className="w-full bg-dark-border/30 rounded-full h-1.5 mb-2">
                    <div className="h-1.5 rounded-full" style={{ width: `${(c.vendas / data.checkouts[0].vendas) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-success">R$ {c.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-text-secondary">Ticket: R$ {c.ticketMedio}</span>
                    <span className="text-warning">OB: {c.taxaOB}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-text-secondary text-sm">Sem dados de checkout</p>}
        </div>
      </div>

      {/* Métodos de Pagamento + Oferta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Métodos de Pagamento</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="45%" height={200}>
              <PieChart>
                <Pie data={data.metodosPagamento} dataKey="vendas" nameKey="metodo" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} strokeWidth={0}>
                  {data.metodosPagamento.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {data.metodosPagamento.map((m, i) => (
                <div key={m.metodo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-text-secondary">{m.metodo}</span>
                  </div>
                  <span className="text-xs font-medium text-text-primary">{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Conversão por Oferta</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-secondary border-b border-dark-border">
                  <th className="text-left py-2 pr-3 font-medium">Oferta</th>
                  <th className="text-right py-2 pr-3 font-medium">Vendas</th>
                  <th className="text-right py-2 pr-3 font-medium">Receita</th>
                  <th className="text-right py-2 pr-3 font-medium">Ticket</th>
                  <th className="text-right py-2 font-medium">OB%</th>
                </tr>
              </thead>
              <tbody>
                {data.ofertaConversao.map(o => (
                  <tr key={o.oferta} className="border-b border-dark-border/30">
                    <td className="py-2 pr-3 text-text-primary truncate max-w-[150px]">{o.oferta}</td>
                    <td className="py-2 pr-3 text-right text-text-primary">{o.vendas}</td>
                    <td className="py-2 pr-3 text-right text-success">R$ {o.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 pr-3 text-right text-accent">R$ {o.ticketMedio}</td>
                    <td className="py-2 text-right text-warning">{o.taxaOB}%</td>
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
