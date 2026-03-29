import { useState } from 'react'
import { BarChart3, Bell, RefreshCw, Calendar } from 'lucide-react'
import StatusBadge from './StatusBadge'

const presets = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_90d', label: 'Total' },
]

export default function Header({ period, onPeriodChange, onRefresh, sources, loading }) {
  const [showCustom, setShowCustom] = useState(false)
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')

  const currentPreset = period?.preset || period

  function handlePreset(value) {
    setShowCustom(false)
    onPeriodChange({ preset: value })
  }

  function handleCustomApply() {
    if (since && until) {
      onPeriodChange({ preset: 'custom', since, until })
      setShowCustom(false)
    }
  }

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
          {/* Filtros de período */}
          <div className="flex bg-dark rounded-lg border border-dark-border p-0.5">
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => handlePreset(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentPreset === p.value
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPreset === 'custom'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Personalizado
            </button>
          </div>

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

      {/* Date picker personalizado */}
      {showCustom && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dark-border">
          <span className="text-xs text-text-secondary">De:</span>
          <input
            type="date"
            value={since}
            onChange={e => setSince(e.target.value)}
            className="bg-dark border border-dark-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
          />
          <span className="text-xs text-text-secondary">Até:</span>
          <input
            type="date"
            value={until}
            onChange={e => setUntil(e.target.value)}
            className="bg-dark border border-dark-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleCustomApply}
            disabled={!since || !until}
            className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      )}
    </header>
  )
}
