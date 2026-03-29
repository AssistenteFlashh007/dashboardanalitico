export default function TopPages({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Páginas Mais Visitadas</h3>
      <div className="space-y-3">
        {data.map((page, i) => (
          <div key={page.pagina} className="flex items-center gap-3 p-3 rounded-xl bg-dark/50 border border-dark-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light font-bold text-sm">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{page.pagina}</p>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-text-secondary">{page.views.toLocaleString('pt-BR')} views</span>
                <span className="text-xs text-accent">{page.tempo} tempo médio</span>
                <span className="text-xs text-warning">{page.bounce}% bounce</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
