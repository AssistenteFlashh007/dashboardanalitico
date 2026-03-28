import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KpiCard({ titulo, valor, variacao, icone: Icone, prefixo = '', sufixo = '' }) {
  const positivo = variacao >= 0

  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border hover:border-primary/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-sm font-medium">{titulo}</span>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icone className="w-5 h-5 text-primary-light" />
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-2">
        {prefixo}{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}{sufixo}
      </div>
      <div className={`flex items-center gap-1 text-sm ${positivo ? 'text-success' : 'text-danger'}`}>
        {positivo ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>{positivo ? '+' : ''}{variacao}%</span>
        <span className="text-text-secondary ml-1">vs mês anterior</span>
      </div>
    </div>
  )
}
