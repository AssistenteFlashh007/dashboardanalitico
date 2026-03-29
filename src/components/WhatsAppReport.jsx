import { useState } from 'react'
import { MessageCircle, Copy, Check, ExternalLink, Loader2 } from 'lucide-react'

const API_BASE = '/api'

export default function WhatsAppReport({ period }) {
  const [reportText, setReportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [phone, setPhone] = useState('')

  async function generateReport() {
    setLoading(true)
    try {
      const periodParam = period?.preset ? `period=${period.preset}` : period?.since ? `since=${period.since}&until=${period.until}` : 'period=this_month'

      const [attrRes, funnelRes] = await Promise.all([
        fetch(`${API_BASE}/attribution?${periodParam}`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/analytics/funnel?${periodParam}`).then(r => r.ok ? r.json() : null),
      ])

      const attr = attrRes?.data || attrRes || {}
      const funnel = funnelRes?.data || funnelRes || {}
      const totalInvest = (attr.campaignAttribution || []).reduce((s, c) => s + c.investido, 0)
      const roas = totalInvest > 0 ? (attr.totalReceita / totalInvest).toFixed(2) : 0
      const lucro = (attr.totalReceita || 0) - totalInvest

      const hoje = new Date().toLocaleDateString('pt-BR')
      const text = `📊 *REPORT DIARIO - ${hoje}*

💰 *Faturamento:* R$ ${(attr.totalReceita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📦 *Vendas:* ${attr.totalVendas || 0}
💸 *Investido:* R$ ${totalInvest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📈 *ROAS:* ${roas}x
${lucro >= 0 ? '✅' : '🔴'} *Lucro:* R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
🎫 *Ticket Medio:* R$ ${(funnel.ticketMedio || 0).toFixed(2)}

📊 *Funil:*
• Order Bump: ${funnel.orderbump?.taxa || 0}%
• Upsell: ${funnel.upsell?.taxa || 0}%

🏆 *Top Campanhas:*
${(attr.campaignAttribution || [])
  .filter(c => c.vendasReais > 0)
  .sort((a, b) => b.receitaReal - a.receitaReal)
  .slice(0, 3)
  .map((c, i) => `${i + 1}. ${c.campanha} - ${c.vendasReais} vendas (${c.roasReal || 0}x)`)
  .join('\n') || 'Nenhuma campanha com vendas'}

_Gerado automaticamente pelo Dashboard Analitico_`

      setReportText(text)
    } catch (err) {
      console.error('Report error:', err)
    }
    setLoading(false)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openWhatsApp() {
    const cleanPhone = phone.replace(/\D/g, '')
    const encoded = encodeURIComponent(reportText)
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={generateReport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600/20 to-green-800/10 border border-green-500/30 text-green-400 text-sm font-semibold rounded-xl hover:border-green-500/50 transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
        Report WhatsApp
      </button>

      {reportText && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReportText('')}>
          <div className="bg-dark-card rounded-2xl border border-dark-border/60 w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-dark-border/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" /> Report WhatsApp
              </h3>
              <button onClick={() => setReportText('')} className="text-text-secondary hover:text-text-primary text-sm">Fechar</button>
            </div>
            <div className="p-5 space-y-4">
              <pre className="bg-dark/60 rounded-xl p-4 text-xs text-text-primary whitespace-pre-wrap max-h-[300px] overflow-y-auto border border-dark-border/30">
                {reportText}
              </pre>
              <div className="flex items-center gap-2">
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="5511999999999"
                  className="flex-1 bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-green-500/50"
                />
                <button onClick={openWhatsApp} disabled={!phone} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                  <ExternalLink className="w-4 h-4" /> Enviar
                </button>
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-dark border border-dark-border rounded-lg text-sm text-text-primary hover:border-purple-500/40 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
