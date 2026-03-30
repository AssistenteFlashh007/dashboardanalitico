import { useState, useEffect } from 'react'
import { Radio, Users, MessageSquare, UserPlus, Eye, Megaphone, ShoppingCart, DollarSign, ArrowDown, Percent, Edit3, Save, X } from 'lucide-react'

const API_BASE = '/api'

const metricasConfig = [
  { id: 'adquiridos', label: 'Adquiridos', icon: UserPlus, color: 'purple' },
  { id: 'mensagens', label: 'Mensagens Disparadas', icon: MessageSquare, color: 'blue' },
  { id: 'grupo', label: 'Entrou no Grupo', icon: Users, color: 'cyan' },
  { id: 'iniciaram', label: 'Participantes que Iniciaram', icon: Eye, color: 'emerald' },
  { id: 'pico', label: 'Pico ao Vivo', icon: Radio, color: 'amber' },
  { id: 'pitch', label: 'Total ao Vivo no Pitch', icon: Megaphone, color: 'rose' },
  { id: 'clicaram', label: 'Clicaram em Comprar', icon: ShoppingCart, color: 'indigo' },
  { id: 'vendas', label: 'Vendas', icon: DollarSign, color: 'green' },
]

const colorMap = {
  purple: { bg: 'from-purple-600/15 to-purple-900/5', border: 'border-purple-500/20', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
  blue: { bg: 'from-blue-600/15 to-blue-900/5', border: 'border-blue-500/20', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
  cyan: { bg: 'from-cyan-600/15 to-cyan-900/5', border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/20' },
  emerald: { bg: 'from-emerald-600/15 to-emerald-900/5', border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
  amber: { bg: 'from-amber-600/15 to-amber-900/5', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/20' },
  rose: { bg: 'from-rose-600/15 to-rose-900/5', border: 'border-rose-500/20', text: 'text-rose-400', iconBg: 'bg-rose-500/20' },
  indigo: { bg: 'from-indigo-600/15 to-indigo-900/5', border: 'border-indigo-500/20', text: 'text-indigo-400', iconBg: 'bg-indigo-500/20' },
  green: { bg: 'from-green-600/15 to-green-900/5', border: 'border-green-500/20', text: 'text-green-400', iconBg: 'bg-green-500/20' },
}

const defaultData = () => ({
  alunos: { adquiridos: 0, mensagens: 0, grupo: 0, iniciaram: 0, pico: 0, pitch: 0, clicaram: 0, vendas: 0 },
  naoAlunos: { adquiridos: 0, mensagens: 0, grupo: 0, iniciaram: 0, pico: 0, pitch: 0, clicaram: 0, vendas: 0 },
})

function calcRate(a, b) {
  if (!b || b === 0) return '-'
  return ((a / b) * 100).toFixed(1) + '%'
}

function MetricCard({ metric, value, prevValue, color, editing, onChange, stepIndex }) {
  const c = colorMap[color]
  const Icon = metric.icon
  const rate = prevValue > 0 ? ((value / prevValue) * 100).toFixed(1) : null
  const rateNum = rate ? parseFloat(rate) : 0
  const rateColor = rateNum >= 70 ? 'text-success bg-success/10' : rateNum >= 40 ? 'text-amber-400 bg-amber-500/10' : 'text-danger bg-danger/10'

  return (
    <div>
      {/* Seta de passagem entre etapas */}
      {stepIndex > 0 && (
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[1px] bg-dark-border/40" />
            <ArrowDown className="w-3.5 h-3.5 text-text-secondary/50" />
            {rate !== null ? (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rateColor}`}>{rate}%</span>
            ) : (
              <span className="text-xs text-text-secondary/40 px-2 py-0.5">-%</span>
            )}
            <div className="w-8 h-[1px] bg-dark-border/40" />
          </div>
        </div>
      )}
      <div className={`relative overflow-hidden bg-gradient-to-br ${c.bg} rounded-xl p-4 border ${c.border} transition-all duration-200 hover:shadow-lg`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{metric.label}</span>
          <div className="flex items-center gap-2">
            {rate !== null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rateColor}`}>{rate}%</span>
            )}
            <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${c.text}`} />
            </div>
          </div>
        </div>
        {editing ? (
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(parseInt(e.target.value) || 0)}
            className={`text-2xl font-extrabold ${c.text} bg-transparent border-b border-dark-border/30 w-full focus:outline-none`}
          />
        ) : (
          <p className={`text-2xl font-extrabold ${c.text}`}>{(value || 0).toLocaleString('pt-BR')}</p>
        )}
      </div>
    </div>
  )
}

function FunnelColumn({ title, subtitle, data, editing, onChange, sourceLabel }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary">{subtitle}</p>
        </div>
        {sourceLabel && (
          <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg font-semibold">{sourceLabel}</span>
        )}
      </div>
      {metricasConfig.map((metric, i) => {
        const prevMetric = i > 0 ? metricasConfig[i - 1] : null
        const prevValue = prevMetric ? data[prevMetric.id] : null
        return (
          <MetricCard
            key={metric.id}
            metric={metric}
            value={data[metric.id]}
            prevValue={prevValue}
            color={metric.color}
            editing={editing}
            onChange={val => onChange(metric.id, val)}
            stepIndex={i}
          />
        )
      })}
    </div>
  )
}

export default function Webinario() {
  const [data, setData] = useState(defaultData())
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [webinarName, setWebinarName] = useState('Lancamento Atual')
  const [editingName, setEditingName] = useState(false)
  const [hotwebinarConnected, setHotwebinarConnected] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Carregar dados salvos manualmente
      const res = await fetch(`${API_BASE}/webinario`)
      let manualData = defaultData()
      let name = 'Lancamento Atual'
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          manualData = json.data.metrics || defaultData()
          name = json.data.name || 'Lancamento Atual'
        }
      }

      // Carregar dados do HotWebinar automaticamente
      try {
        const hwRes = await fetch(`${API_BASE}/hotwebinar/stats?type=ambos`)
        if (hwRes.ok) {
          const hwJson = await hwRes.json()
          if (hwJson.success && hwJson.data) {
            const hw = hwJson.data
            // Mesclar dados do HotWebinar com dados manuais (HotWebinar tem prioridade)
            if (hw.alunos) {
              manualData.alunos = {
                ...manualData.alunos,
                adquiridos: hw.alunos.visitantes || manualData.alunos.adquiridos,
                iniciaram: hw.alunos.acessaram || manualData.alunos.iniciaram,
                pico: hw.alunos.peakAudience || manualData.alunos.pico,
                pitch: hw.alunos.pitch || manualData.alunos.pitch,
                clicaram: hw.alunos.clicouOferta || manualData.alunos.clicaram,
              }
            }
            if (hw.naoAlunos) {
              manualData.naoAlunos = {
                ...manualData.naoAlunos,
                adquiridos: hw.naoAlunos.visitantes || manualData.naoAlunos.adquiridos,
                iniciaram: hw.naoAlunos.acessaram || manualData.naoAlunos.iniciaram,
                pico: hw.naoAlunos.peakAudience || manualData.naoAlunos.pico,
                pitch: hw.naoAlunos.pitch || manualData.naoAlunos.pitch,
                clicaram: hw.naoAlunos.clicouOferta || manualData.naoAlunos.clicaram,
              }
            }
            setHotwebinarConnected(true)
          }
        }
      } catch { }

      setData(manualData)
      setWebinarName(name)
    } catch { }
    setLoading(false)
  }

  async function saveData() {
    try {
      await fetch(`${API_BASE}/webinario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: webinarName, metrics: data })
      })
    } catch { }
    setEditing(false)
  }

  function updateAlunos(field, value) {
    setData(prev => ({ ...prev, alunos: { ...prev.alunos, [field]: value } }))
  }

  function updateNaoAlunos(field, value) {
    setData(prev => ({ ...prev, naoAlunos: { ...prev.naoAlunos, [field]: value } }))
  }

  // Totais
  const totalAdquiridos = (data.alunos.adquiridos || 0) + (data.naoAlunos.adquiridos || 0)
  const totalVendas = (data.alunos.vendas || 0) + (data.naoAlunos.vendas || 0)
  const totalPico = (data.alunos.pico || 0) + (data.naoAlunos.pico || 0)
  const taxaGeralConversao = totalAdquiridos > 0 ? ((totalVendas / totalAdquiridos) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Radio className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={webinarName}
                  onChange={e => setWebinarName(e.target.value)}
                  className="text-lg font-bold text-text-primary bg-transparent border-b border-purple-500/30 focus:outline-none"
                />
                <button onClick={() => setEditingName(false)} className="text-text-secondary hover:text-text-primary"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">{webinarName}</h2>
                <button onClick={() => setEditingName(true)} className="text-text-secondary hover:text-purple-400"><Edit3 className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <p className="text-xs text-text-secondary">Metricas do Webnario - Alunos vs Nao Alunos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); loadData() }} className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary border border-dark-border/40 rounded-lg">Cancelar</button>
              <button onClick={saveData} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-purple-500/20">
                <Save className="w-4 h-4" /> Salvar
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-dark/60 border border-dark-border/60 text-text-secondary text-sm font-semibold rounded-xl hover:border-purple-500/40">
              <Edit3 className="w-4 h-4" /> Editar Dados
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600/15 to-purple-900/5 rounded-2xl p-4 border border-purple-500/20">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-extrabold text-purple-400 mt-1">{totalAdquiridos.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600/15 to-amber-900/5 rounded-2xl p-4 border border-amber-500/20">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Pico Total</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{totalPico.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/15 to-green-900/5 rounded-2xl p-4 border border-green-500/20">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Total Vendas</p>
          <p className="text-2xl font-extrabold text-green-400 mt-1">{totalVendas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-600/15 to-cyan-900/5 rounded-2xl p-4 border border-cyan-500/20">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Taxa Conversao</p>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1">{taxaGeralConversao}%</p>
        </div>
      </div>

      {/* Two Columns: Alunos vs Nao Alunos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
          <FunnelColumn
            title="Webnario Alunos"
            subtitle="Base de alunos existentes"
            data={data.alunos}
            editing={editing}
            onChange={updateAlunos}
            sourceLabel="ManyChat / DataCrazy"
          />
        </div>
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
          <FunnelColumn
            title="Webnario Nao Alunos"
            subtitle="Leads novos (captacao)"
            data={data.naoAlunos}
            editing={editing}
            onChange={updateNaoAlunos}
            sourceLabel="InLead"
          />
        </div>
      </div>

      {/* Funnel Comparison */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <h3 className="text-sm font-bold text-text-primary mb-4">Comparativo do Funil</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600/20 to-purple-800/10">
                <th className="py-2.5 px-4 text-left font-semibold text-purple-200 uppercase tracking-wider">Etapa</th>
                <th className="py-2.5 px-4 text-right font-semibold text-purple-200 uppercase tracking-wider">Alunos</th>
                <th className="py-2.5 px-4 text-right font-semibold text-purple-200 uppercase tracking-wider">Taxa</th>
                <th className="py-2.5 px-4 text-right font-semibold text-purple-200 uppercase tracking-wider">Nao Alunos</th>
                <th className="py-2.5 px-4 text-right font-semibold text-purple-200 uppercase tracking-wider">Taxa</th>
                <th className="py-2.5 px-4 text-right font-semibold text-purple-200 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {metricasConfig.map((metric, i) => {
                const prev = i > 0 ? metricasConfig[i - 1] : null
                const aVal = data.alunos[metric.id] || 0
                const nVal = data.naoAlunos[metric.id] || 0
                const aRate = prev ? calcRate(aVal, data.alunos[prev.id]) : '-'
                const nRate = prev ? calcRate(nVal, data.naoAlunos[prev.id]) : '-'
                return (
                  <tr key={metric.id} className={`border-b border-dark-border/20 hover:bg-purple-500/5 ${i % 2 ? 'bg-dark/20' : ''}`}>
                    <td className="py-2.5 px-4 text-text-primary font-medium">{metric.label}</td>
                    <td className="py-2.5 px-4 text-right text-text-primary font-semibold">{aVal.toLocaleString('pt-BR')}</td>
                    <td className="py-2.5 px-4 text-right text-purple-400">{aRate}</td>
                    <td className="py-2.5 px-4 text-right text-text-primary font-semibold">{nVal.toLocaleString('pt-BR')}</td>
                    <td className="py-2.5 px-4 text-right text-cyan-400">{nRate}</td>
                    <td className="py-2.5 px-4 text-right text-text-primary font-bold">{(aVal + nVal).toLocaleString('pt-BR')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <h3 className="text-sm font-bold text-text-primary mb-3">Fontes de Dados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'ManyChat', desc: 'Mensagens + Grupo (Alunos)', status: 'pendente' },
            { name: 'SendFlow', desc: 'Grupo WhatsApp', status: 'pendente' },
            { name: 'InLead', desc: 'Leads Nao Alunos', status: 'pendente' },
            { name: 'HotWebnar', desc: 'Participantes + Pico ao Vivo', status: hotwebinarConnected ? 'conectado' : 'pendente' },
          ].map(src => (
            <div key={src.name} className="bg-dark/40 rounded-xl p-3 border border-dark-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-text-primary">{src.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${src.status === 'conectado' ? 'bg-success/15 text-success' : 'bg-amber-500/15 text-amber-400'}`}>
                  {src.status}
                </span>
              </div>
              <p className="text-xs text-text-secondary">{src.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
