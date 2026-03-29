import { useState } from 'react'
import { BarChart3, Bell, RefreshCw, Calendar, Sparkles } from 'lucide-react'
import StatusBadge from './StatusBadge'

const presets = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_90d', label: 'Total' },
]

const platforms = [
  { value: 'todas', label: 'Todas' },
  { value: 'hubla', label: 'Hubla' },
  { value: 'pagtrust', label: 'Pagtrust' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Header({ period, onPeriodChange, platform, onPlatformChange, onRefresh, sources, loading }) {
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
    <header className="bg-dark-card/80 backdrop-blur-xl border-b border-dark-border px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary">{getGreeting()}, Leonardo</h1>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <StatusBadge sources={sources} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro de plataforma */}
          <div className="flex bg-dark/60 rounded-xl border border-dark-border/60 p-1">
            {platforms.map(p => (
              <button
                key={p.value}
                onClick={() => onPlatformChange(p.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  platform === p.value
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-border/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Filtro de período */}
          <div className="flex bg-dark/60 rounded-xl border border-dark-border/60 p-1">
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => handlePreset(p.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  currentPreset === p.value
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-border/30'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                currentPreset === 'custom'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-dark-border/30'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Personalizado
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-dark/60 border border-dark-border/60 flex items-center justify-center hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button className="relative w-9 h-9 rounded-xl bg-dark/60 border border-dark-border/60 flex items-center justify-center hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-200">
            <Bell className="w-4 h-4 text-text-secondary" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md shadow-purple-500/20">
            <span className="text-xs font-bold text-white">LC</span>
          </div>
        </div>
      </div>

      {/* Date picker personalizado */}
      {showCustom && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dark-border/50">
          <span className="text-xs text-text-secondary">De:</span>
          <input
            type="date"
            value={since}
            onChange={e => setSince(e.target.value)}
            className="bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
          />
          <span className="text-xs text-text-secondary">Até:</span>
          <input
            type="date"
            value={until}
            onChange={e => setUntil(e.target.value)}
            className="bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleCustomApply}
            disabled={!since || !until}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 shadow-md shadow-purple-500/20"
          >
            Aplicar
          </button>
        </div>
      )}
    </header>
  )
}
