const statusStyles = {
  ativa: 'bg-success/15 text-success',
  pausada: 'bg-warning/15 text-warning',
  concluída: 'bg-text-secondary/15 text-text-secondary',
}

export default function CampaignTable({ data, attribution }) {
  // Mesclar dados de campanhas Meta com vendas reais da atribuição
  const campaigns = data.map(camp => {
    const attr = attribution?.campaignAttribution?.find(a => a.campanha === camp.nome)
    return {
      ...camp,
      vendasReais: attr?.vendasReais || 0,
      receitaReal: attr?.receitaReal || 0,
      roasReal: attr?.roasReal || null,
      cpaReal: attr?.cpaReal || null,
    }
  })

  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Performance de Campanhas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-dark-border">
              <th className="text-left py-3 pr-4 font-medium">Campanha</th>
              <th className="text-left py-3 pr-4 font-medium">Conta</th>
              <th className="text-right py-3 pr-4 font-medium">Investido</th>
              <th className="text-right py-3 pr-4 font-medium">Vendas</th>
              <th className="text-right py-3 pr-4 font-medium">Receita</th>
              <th className="text-right py-3 pr-4 font-medium">ROAS Real</th>
              <th className="text-right py-3 pr-4 font-medium">CPA Real</th>
              <th className="text-right py-3 pr-4 font-medium">CTR</th>
              <th className="text-right py-3 pr-4 font-medium">ROAS Pixel</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((camp, i) => {
              const roasColor = camp.roasReal != null
                ? camp.roasReal >= 2 ? 'text-success' : camp.roasReal >= 1 ? 'text-warning' : 'text-danger'
                : 'text-text-secondary'

              return (
                <tr key={`${camp.id || camp.nome}-${i}`} className="border-b border-dark-border/50 hover:bg-dark-border/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-text-primary max-w-[220px] truncate">{camp.nome}</td>
                  <td className="py-3 pr-4 text-text-secondary text-xs">{camp.conta || camp.plataforma}</td>
                  <td className="py-3 pr-4 text-right text-text-secondary">
                    R$ {camp.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 pr-4 text-right text-text-primary font-semibold">
                    {camp.vendasReais > 0 ? camp.vendasReais : '-'}
                  </td>
                  <td className="py-3 pr-4 text-right text-success font-medium">
                    {camp.receitaReal > 0
                      ? `R$ ${camp.receitaReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className={`py-3 pr-4 text-right font-bold ${roasColor}`}>
                    {camp.roasReal != null ? `${camp.roasReal}x` : '-'}
                  </td>
                  <td className="py-3 pr-4 text-right text-warning">
                    {camp.cpaReal != null
                      ? `R$ ${camp.cpaReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="py-3 pr-4 text-right text-text-secondary">{camp.ctr}%</td>
                  <td className="py-3 pr-4 text-right text-text-secondary">
                    {camp.roas ? `${camp.roas.toFixed(2)}x` : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
