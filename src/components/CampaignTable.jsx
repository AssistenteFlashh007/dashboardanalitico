const statusStyles = {
  ativa: 'bg-success/15 text-success',
  pausada: 'bg-warning/15 text-warning',
  concluída: 'bg-text-secondary/15 text-text-secondary',
}

export default function CampaignTable({ data }) {
  const hasAccount = data.some(c => c.conta)

  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Performance de Campanhas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-dark-border">
              <th className="text-left py-3 pr-4 font-medium">Campanha</th>
              {hasAccount && <th className="text-left py-3 pr-4 font-medium">Conta</th>}
              <th className="text-right py-3 pr-4 font-medium">Investido</th>
              <th className="text-right py-3 pr-4 font-medium">Receita</th>
              <th className="text-right py-3 pr-4 font-medium">ROAS</th>
              <th className="text-right py-3 pr-4 font-medium">CTR</th>
              <th className="text-right py-3 pr-4 font-medium">Conv.</th>
              <th className="text-right py-3 pr-4 font-medium">CPA</th>
              <th className="text-center py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((camp, i) => {
              const roas = camp.investido > 0 ? (camp.receita / camp.investido).toFixed(2) : '0.00'
              return (
                <tr key={`${camp.id || camp.nome}-${i}`} className="border-b border-dark-border/50 hover:bg-dark-border/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-text-primary max-w-[200px] truncate">{camp.nome}</td>
                  {hasAccount && (
                    <td className="py-3 pr-4 text-text-secondary text-xs">{camp.conta || camp.plataforma}</td>
                  )}
                  <td className="py-3 pr-4 text-right text-text-secondary">
                    R$ {camp.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 pr-4 text-right text-success font-medium">
                    R$ {camp.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 pr-4 text-right text-primary-light font-medium">{roas}x</td>
                  <td className="py-3 pr-4 text-right text-text-secondary">{camp.ctr}%</td>
                  <td className="py-3 pr-4 text-right text-text-primary">{camp.conversoes}</td>
                  <td className="py-3 pr-4 text-right text-warning">
                    {camp.cpa > 0 ? `R$ ${camp.cpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[camp.status] || 'bg-text-secondary/15 text-text-secondary'}`}>
                      {camp.status ? camp.status.charAt(0).toUpperCase() + camp.status.slice(1) : '-'}
                    </span>
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
