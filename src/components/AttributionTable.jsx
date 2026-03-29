export default function AttributionTable({ data }) {
  if (!data || !data.campaignAttribution?.length) return null

  const { campaignAttribution, salesBySource, totalVendas, totalReceita, vendasSemUtm } = data

  // Só campanhas que têm vendas reais OU investimento
  const relevantCampaigns = campaignAttribution.filter(c => c.vendasReais > 0 || c.investido > 0)

  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Atribuição UTM — ROAS Real</h3>
          <p className="text-xs text-text-secondary mt-1">
            Cruzamento Meta Ads x Vendas (Hubla + Pagtrust)
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-text-secondary">Total Vendas</p>
            <p className="text-lg font-bold text-text-primary">{totalVendas}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Receita Total</p>
            <p className="text-lg font-bold text-success">
              R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Fontes de venda */}
      {salesBySource?.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {salesBySource.map(s => (
            <span key={s.source} className="px-3 py-1.5 rounded-lg bg-dark border border-dark-border text-xs">
              <span className="text-text-secondary">{s.source}:</span>{' '}
              <span className="text-text-primary font-medium">{s.vendas} vendas</span>{' '}
              <span className="text-success">R$ {s.receita.toLocaleString('pt-BR')}</span>
            </span>
          ))}
          {vendasSemUtm > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-dark border border-dark-border text-xs">
              <span className="text-warning">{vendasSemUtm} sem UTM</span>
            </span>
          )}
        </div>
      )}

      {/* Tabela de atribuição */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-dark-border">
              <th className="text-left py-3 pr-4 font-medium">Campanha</th>
              <th className="text-left py-3 pr-4 font-medium">Conta</th>
              <th className="text-right py-3 pr-4 font-medium">Investido</th>
              <th className="text-right py-3 pr-4 font-medium">Vendas Reais</th>
              <th className="text-right py-3 pr-4 font-medium">Receita Real</th>
              <th className="text-right py-3 pr-4 font-medium">ROAS Real</th>
              <th className="text-right py-3 pr-4 font-medium">CPA Real</th>
              <th className="text-right py-3 font-medium">ROAS Pixel</th>
            </tr>
          </thead>
          <tbody>
            {relevantCampaigns.map((c, i) => {
              const roasColor = c.roasReal != null
                ? c.roasReal >= 2 ? 'text-success' : c.roasReal >= 1 ? 'text-warning' : 'text-danger'
                : 'text-text-secondary'

              return (
                <tr key={i} className="border-b border-dark-border/50 hover:bg-dark-border/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-text-primary max-w-[200px] truncate">
                    {c.campanha}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary text-xs">{c.conta}</td>
                  <td className="py-3 pr-4 text-right text-text-secondary">
                    R$ {c.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 pr-4 text-right text-text-primary font-medium">
                    {c.vendasReais || '-'}
                  </td>
                  <td className="py-3 pr-4 text-right text-success font-medium">
                    {c.receitaReal > 0
                      ? `R$ ${c.receitaReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className={`py-3 pr-4 text-right font-bold ${roasColor}`}>
                    {c.roasReal != null ? `${c.roasReal}x` : '-'}
                  </td>
                  <td className="py-3 pr-4 text-right text-warning">
                    {c.cpaReal != null
                      ? `R$ ${c.cpaReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="py-3 text-right text-text-secondary">
                    {c.roasMeta ? `${c.roasMeta.toFixed(2)}x` : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalVendas === 0 && (
        <p className="text-center text-text-secondary text-sm py-8">
          Nenhuma venda com UTM recebida ainda. Os dados aparecem conforme os webhooks da Hubla e Pagtrust enviam vendas.
        </p>
      )}
    </div>
  )
}
