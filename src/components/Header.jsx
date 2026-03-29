import { BarChart3, Bell, RefreshCw } from 'lucide-react'
import StatusBadge from './StatusBadge'

const periods = [
  { value: 'last_7d', label: '7 dias' },
  { value: 'last_30d', label: '30 dias' },
  { value: 'last_90d', label: '90 dias' },
  { value: 'this_month', label: 'Este mês' },
]

export default function Header({ period, onPeriodChange, onRefresh, sources, loading }) {
  return (
    <header className="bg-dark-card border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Dashboard Analítico</h1>
            <StatusBadge sources={sources} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtro de período */}
          <div className="flex bg-dark rounded-lg border border-dark-border p-0.5">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.value
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-dark border border-dark-border flex items-center justify-center hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button className="relative w-9 h-9 rounded-xl bg-dark border border-dark-border flex items-center justify-center hover:border-primary/40 transition-colors">
            <Bell className="w-4 h-4 text-text-secondary" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-light">LC</span>
          </div>
        </div>
      </div>
    </header>
  )
}
