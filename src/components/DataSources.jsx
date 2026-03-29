import { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, RefreshCw, Plug, ExternalLink } from 'lucide-react'

const API_BASE = '/api'

const sourceConfig = [
  { id: 'meta', name: 'Meta Ads', description: 'Facebook & Instagram Ads', color: 'blue', icon: '📘', envVars: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNTS'] },
  { id: 'hubla', name: 'Hubla', description: 'Gateway de pagamento Hubla', color: 'purple', icon: '💜', envVars: ['HUBLA_API_TOKEN'] },
  { id: 'pagtrust', name: 'Pagtrust', description: 'Gateway de pagamento Pagtrust', color: 'green', icon: '💚', envVars: ['PAGTRUST_WEBHOOK_TOKEN'] },
]

export default function DataSources({ sources }) {
  const [health, setHealth] = useState(null)
  const [checking, setChecking] = useState(false)

  async function checkHealth() {
    setChecking(true)
    try {
      const res = await fetch(`${API_BASE}/health`)
      if (res.ok) setHealth(await res.json())
    } catch { }
    setChecking(false)
  }

  useEffect(() => { checkHealth() }, [])

  function getStatus(sourceId) {
    if (sources) {
      return sources[sourceId] || false
    }
    if (health?.integrations) {
      return health.integrations[sourceId]?.configured || false
    }
    return false
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Conexao de Fontes de Dados</h2>
            <p className="text-xs text-text-secondary">Gerencie suas integracoes e fontes de trafego</p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-dark/60 border border-dark-border/60 text-text-secondary text-sm font-semibold rounded-xl hover:border-purple-500/40 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Verificar Conexoes
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sourceConfig.map(source => {
          const connected = getStatus(source.id)
          return (
            <div key={source.id} className={`bg-dark-card rounded-2xl p-5 border transition-all duration-300 ${connected ? 'border-success/30 hover:border-success/50' : 'border-dark-border/60 hover:border-purple-500/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{source.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{source.name}</h3>
                    <p className="text-xs text-text-secondary">{source.description}</p>
                  </div>
                </div>
                {connected ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                    <span className="text-xs font-semibold text-success">Conectado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-border/30 rounded-full">
                    <XCircle className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-xs font-semibold text-text-secondary">Desconectado</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Variaveis necessarias:</p>
                {source.envVars.map(v => (
                  <div key={v} className="flex items-center gap-2">
                    <code className="text-xs bg-dark/60 px-2 py-0.5 rounded text-purple-400 font-mono">{v}</code>
                    {connected && <CheckCircle className="w-3 h-3 text-success" />}
                  </div>
                ))}
              </div>

              {!connected && (
                <p className="text-xs text-text-secondary bg-dark/40 rounded-lg p-3 border border-dark-border/30">
                  Configure as variaveis de ambiente no arquivo <code className="text-purple-400">.env</code> do servidor e reinicie.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Import Section */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <div className="flex items-center gap-2 mb-4">
          <Plug className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-text-primary">Importacao Manual</h3>
        </div>
        <p className="text-xs text-text-secondary mb-3">
          Alem das integracoes automaticas, voce pode importar dados manualmente via CSV/XLSX na aba Dashboard.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-dark/40 rounded-xl p-4 border border-dark-border/30">
            <h4 className="text-xs font-bold text-text-primary mb-1">CSV (Pagtrust)</h4>
            <p className="text-xs text-text-secondary">Exporte o relatorio de vendas do Pagtrust em CSV e importe aqui.</p>
          </div>
          <div className="bg-dark/40 rounded-xl p-4 border border-dark-border/30">
            <h4 className="text-xs font-bold text-text-primary mb-1">XLSX (Hubla)</h4>
            <p className="text-xs text-text-secondary">Exporte o relatorio de vendas do Hubla em Excel e importe aqui.</p>
          </div>
        </div>
      </div>

      {/* Webhook URLs */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-text-primary">URLs de Webhook</h3>
        </div>
        <p className="text-xs text-text-secondary mb-3">Configure esses endpoints nas suas plataformas para receber vendas em tempo real:</p>
        <div className="space-y-2">
          {[
            { label: 'Hubla Webhook', url: '/api/hubla/webhook' },
            { label: 'Pagtrust Webhook', url: '/api/pagtrust/webhook' },
          ].map(wh => (
            <div key={wh.label} className="flex items-center justify-between bg-dark/40 rounded-lg p-3 border border-dark-border/30">
              <span className="text-xs text-text-secondary">{wh.label}</span>
              <code className="text-xs text-cyan-400 font-mono bg-dark/60 px-2 py-0.5 rounded">{wh.url}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
