import { useState } from 'react'
import { FileText, Download, Loader2, Trophy, AlertTriangle, TrendingUp, Target } from 'lucide-react'

const API_BASE = '/api'

export default function Debriefing({ period, platform, mode = 'full' }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generateReport() {
    setLoading(true)
    try {
      const periodParam = period?.preset ? `period=${period.preset}` : period?.since ? `since=${period.since}&until=${period.until}` : 'period=this_month'
      const platParam = platform !== 'todas' ? `&platform=${platform}` : ''

      const [attrRes, funnelRes, creativeRes] = await Promise.all([
        fetch(`${API_BASE}/attribution?${periodParam}${platParam}`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/analytics/funnel?${periodParam}${platParam}`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/analytics/creatives?${periodParam}${platParam}`).then(r => r.ok ? r.json() : null),
      ])

      const attr = attrRes?.data || attrRes || {}
      const funnel = funnelRes?.data || funnelRes || {}
      const creative = creativeRes?.data || creativeRes || {}

      const campaigns = (attr.campaignAttribution || []).filter(c => c.investido > 0)
      const topCampaigns = [...campaigns].sort((a, b) => (b.roasReal || 0) - (a.roasReal || 0)).slice(0, 5)
      const worstCampaigns = [...campaigns].sort((a, b) => (a.roasReal || 0) - (b.roasReal || 0)).slice(0, 3)
      const totalInvest = campaigns.reduce((s, c) => s + c.investido, 0)
      const totalRevenue = attr.totalReceita || 0
      const roasGeral = totalInvest > 0 ? (totalRevenue / totalInvest).toFixed(2) : 0

      setReport({
        totalVendas: attr.totalVendas || 0,
        totalReceita: totalRevenue,
        totalInvestido: totalInvest,
        roasGeral,
        lucro: totalRevenue - totalInvest,
        ticketMedio: funnel.ticketMedio || 0,
        taxaOB: funnel.orderbump?.taxa || 0,
        taxaUpsell: funnel.upsell?.taxa || 0,
        topCampaigns,
        worstCampaigns,
        topCreatives: (creative.criativos || []).slice(0, 5),
        funnelTypes: (funnel.tiposFunil || []).slice(0, 5),
      })
    } catch (err) {
      console.error('Debriefing error:', err)
    }
    setLoading(false)
  }

  // Button mode (for dashboard)
  if (mode === 'button') {
    return (
      <button
        onClick={generateReport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600/20 to-purple-800/10 border border-purple-500/30 text-purple-400 text-sm font-semibold rounded-xl hover:border-purple-500/50 transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Gerar Debriefing
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Debriefing Automatico</h2>
            <p className="text-xs text-text-secondary">Relatorio completo do periodo</p>
          </div>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Gerar Relatorio
        </button>
      </div>

      {!report && !loading && (
        <div className="bg-dark-card rounded-2xl p-12 border border-dark-border/60 text-center">
          <FileText className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-30" />
          <p className="text-text-secondary text-sm">Clique em "Gerar Relatorio" para criar o debriefing</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" /> Resumo Geral
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Vendas', value: report.totalVendas, color: 'text-text-primary' },
                { label: 'Receita', value: `R$ ${report.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-success' },
                { label: 'Investido', value: `R$ ${report.totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-cyan-400' },
                { label: 'ROAS', value: `${report.roasGeral}x`, color: report.roasGeral >= 2 ? 'text-success' : report.roasGeral >= 1 ? 'text-warning' : 'text-danger' },
                { label: 'Lucro', value: `R$ ${report.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: report.lucro >= 0 ? 'text-success' : 'text-danger' },
                { label: 'Taxa OB', value: `${report.taxaOB}%`, color: 'text-purple-400' },
                { label: 'Taxa Upsell', value: `${report.taxaUpsell}%`, color: 'text-amber-400' },
              ].map(item => (
                <div key={item.label} className="bg-dark/40 rounded-xl p-3 border border-dark-border/30">
                  <p className="text-xs text-text-secondary mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Campanhas */}
          <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-success" /> Melhores Campanhas (por ROAS)
            </h3>
            <div className="space-y-2">
              {report.topCampaigns.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-dark/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-border/30 text-text-secondary'}`}>{i + 1}</span>
                    <span className="text-sm text-text-primary truncate max-w-[300px]">{c.campanha}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-text-secondary">{c.vendasReais} vendas</span>
                    <span className="text-success font-bold">R$ {(c.receitaReal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-lg ${c.roasReal >= 2 ? 'bg-success/15 text-success' : c.roasReal >= 1 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'}`}>{c.roasReal || 0}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Piores Campanhas */}
          {report.worstCampaigns.length > 0 && (
            <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
              <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" /> Campanhas para Revisar
              </h3>
              <div className="space-y-2">
                {report.worstCampaigns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-danger/5 rounded-lg border border-danger/10">
                    <span className="text-sm text-text-primary truncate max-w-[300px]">{c.campanha}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-secondary">Invest: R$ {c.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-danger font-bold">{c.roasReal || 0}x ROAS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Criativos */}
          {report.topCreatives.length > 0 && (
            <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
              <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Top Criativos
              </h3>
              <div className="space-y-2">
                {report.topCreatives.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-dark/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-border/30 text-text-secondary'}`}>{i + 1}</span>
                      <span className="text-sm text-text-primary truncate max-w-[300px]">{c.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-secondary">{c.vendas} vendas</span>
                      <span className="text-success font-bold">R$ {c.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
