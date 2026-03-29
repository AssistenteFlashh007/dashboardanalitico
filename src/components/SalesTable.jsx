export default function SalesTable({ salesData }) {
  if (!salesData) return null

  const { hubla, pagtrust, ultimasVendas } = salesData

  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Vendas - Plataformas</h3>

      {/* Resumo por plataforma */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-dark/50 rounded-xl p-4 border border-dark-border/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-text-primary">Hubla</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Vendas</span>
              <span className="text-xs font-medium text-text-primary">{hubla.vendas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Receita</span>
              <span className="text-xs font-medium text-success">
                R$ {hubla.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Reembolsos</span>
              <span className="text-xs font-medium text-danger">{hubla.reembolsos}</span>
            </div>
          </div>
        </div>

        <div className="bg-dark/50 rounded-xl p-4 border border-dark-border/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm font-semibold text-text-primary">Pagtrust</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Vendas</span>
              <span className="text-xs font-medium text-text-primary">{pagtrust.vendas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Receita</span>
              <span className="text-xs font-medium text-success">
                R$ {pagtrust.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Reembolsos</span>
              <span className="text-xs font-medium text-danger">{pagtrust.reembolsos}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas vendas */}
      {ultimasVendas.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-text-secondary mb-3">Últimas Vendas</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ultimasVendas.map((venda, i) => (
              <div key={venda.id || i} className="flex items-center justify-between p-2.5 rounded-lg bg-dark/50 border border-dark-border/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{venda.produto}</p>
                  <p className="text-xs text-text-secondary">{venda.comprador}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-sm font-medium text-success">
                    R$ {(venda.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-border/50 text-text-secondary">
                    {venda.plataforma}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
