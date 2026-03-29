import { TrendingUp, TrendingDown } from 'lucide-react'

const cardStyles = [
  { gradient: 'from-purple-600/20 to-purple-900/5', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', border: 'border-purple-500/20 hover:border-purple-500/40' },
  { gradient: 'from-blue-600/20 to-blue-900/5', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', border: 'border-blue-500/20 hover:border-blue-500/40' },
  { gradient: 'from-cyan-600/20 to-cyan-900/5', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', border: 'border-cyan-500/20 hover:border-cyan-500/40' },
  { gradient: 'from-emerald-600/20 to-emerald-900/5', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
  { gradient: 'from-amber-600/20 to-amber-900/5', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400', border: 'border-amber-500/20 hover:border-amber-500/40' },
  { gradient: 'from-rose-600/20 to-rose-900/5', iconBg: 'bg-rose-500/20', iconColor: 'text-rose-400', border: 'border-rose-500/20 hover:border-rose-500/40' },
]

export default function KpiCard({ titulo, valor, variacao, icone: Icone, prefixo = '', sufixo = '', index = 0 }) {
  const positivo = variacao >= 0
  const style = cardStyles[index % cardStyles.length]

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${style.gradient} bg-dark-card rounded-2xl p-5 border ${style.border} transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">{titulo}</span>
        <div className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center backdrop-blur-sm`}>
          <Icone className={`w-5 h-5 ${style.iconColor}`} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-text-primary mb-2 tracking-tight">
        {prefixo}{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}{sufixo}
      </div>
      <div className={`flex items-center gap-1.5 text-sm ${positivo ? 'text-success' : 'text-danger'}`}>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${positivo ? 'bg-success/10' : 'bg-danger/10'}`}>
          {positivo ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{positivo ? '+' : ''}{variacao}%</span>
        </div>
        <span className="text-text-secondary text-xs">vs mês anterior</span>
      </div>
    </div>
  )
}
