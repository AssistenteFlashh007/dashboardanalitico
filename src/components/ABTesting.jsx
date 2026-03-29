import { useState, useEffect } from 'react'
import { FlaskConical, Plus, Trophy, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const API_BASE = '/api'

export default function ABTesting({ period, platform }) {
  const [tests, setTests] = useState([])
  const [salesData, setSalesData] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTest, setNewTest] = useState({ name: '', type: 'checkout', variantA: '', variantB: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period, platform])

  async function loadData() {
    setLoading(true)
    try {
      const [testsRes, salesRes] = await Promise.all([
        fetch(`${API_BASE}/abtests`).then(r => r.ok ? r.json() : { data: [] }),
        fetch(`${API_BASE}/attribution/sales`).then(r => r.ok ? r.json() : { data: [] })
      ])
      setTests(testsRes.data || testsRes || [])
      setSalesData(salesRes.data || salesRes || [])
    } catch { }
    setLoading(false)
  }

  function getVariantStats(fieldName, variantValue) {
    const sales = salesData.filter(s => {
      const val = s[fieldName] || s.utm?.[fieldName] || ''
      return val.toLowerCase().includes(variantValue.toLowerCase())
    })
    const revenue = sales.reduce((sum, s) => sum + (s.valor || 0), 0)
    const orderbumps = sales.filter(s => s.orderbump).length
    return {
      vendas: sales.length,
      receita: revenue,
      ticketMedio: sales.length > 0 ? revenue / sales.length : 0,
      taxaOB: sales.length > 0 ? ((orderbumps / sales.length) * 100).toFixed(1) : 0,
    }
  }

  async function createTest() {
    if (!newTest.name || !newTest.variantA || !newTest.variantB) return
    const test = {
      id: Date.now().toString(),
      ...newTest,
      createdAt: new Date().toISOString(),
      status: 'running'
    }
    try {
      await fetch(`${API_BASE}/abtests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test)
      })
    } catch { }
    setTests(prev => [...prev, test])
    setNewTest({ name: '', type: 'checkout', variantA: '', variantB: '' })
    setShowCreate(false)
  }

  async function deleteTest(id) {
    try {
      await fetch(`${API_BASE}/abtests/${id}`, { method: 'DELETE' })
    } catch { }
    setTests(prev => prev.filter(t => t.id !== id))
  }

  const typeLabels = { checkout: 'Checkout', oferta: 'Oferta', funil: 'Funil', utm_content: 'Criativo' }
  const fieldMap = { checkout: 'checkout', oferta: 'oferta', funil: 'funil', utm_content: 'utm_content' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Testes A/B</h2>
            <p className="text-xs text-text-secondary">Compare paginas, checkouts, ofertas e criativos</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Novo Teste
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-dark-card rounded-2xl p-5 border border-purple-500/30 space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Criar Novo Teste</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={newTest.name}
              onChange={e => setNewTest(p => ({ ...p, name: e.target.value }))}
              placeholder="Nome do teste"
              className="bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
            />
            <select
              value={newTest.type}
              onChange={e => setNewTest(p => ({ ...p, type: e.target.value }))}
              className="bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
            >
              <option value="checkout">Checkout</option>
              <option value="oferta">Oferta</option>
              <option value="funil">Funil</option>
              <option value="utm_content">Criativo</option>
            </select>
            <input
              value={newTest.variantA}
              onChange={e => setNewTest(p => ({ ...p, variantA: e.target.value }))}
              placeholder="Variante A"
              className="bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
            />
            <input
              value={newTest.variantB}
              onChange={e => setNewTest(p => ({ ...p, variantB: e.target.value }))}
              placeholder="Variante B"
              className="bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            onClick={createTest}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Criar Teste
          </button>
        </div>
      )}

      {/* Tests List */}
      {tests.length === 0 && !loading && (
        <div className="bg-dark-card rounded-2xl p-12 border border-dark-border/60 text-center">
          <FlaskConical className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-30" />
          <p className="text-text-secondary text-sm">Nenhum teste criado ainda</p>
          <p className="text-text-secondary text-xs mt-1">Clique em "Novo Teste" para comecar</p>
        </div>
      )}

      {tests.map(test => {
        const field = fieldMap[test.type]
        const statsA = getVariantStats(field, test.variantA)
        const statsB = getVariantStats(field, test.variantB)
        const winnerRevenue = statsA.receita > statsB.receita ? 'A' : statsB.receita > statsA.receita ? 'B' : 'tie'
        const winnerSales = statsA.vendas > statsB.vendas ? 'A' : statsB.vendas > statsA.vendas ? 'B' : 'tie'

        const chartData = [
          { metric: 'Vendas', 'Variante A': statsA.vendas, 'Variante B': statsB.vendas },
          { metric: 'Receita', 'Variante A': statsA.receita, 'Variante B': statsB.receita },
          { metric: 'Ticket', 'Variante A': statsA.ticketMedio, 'Variante B': statsB.ticketMedio },
        ]

        return (
          <div key={test.id} className="bg-dark-card rounded-2xl border border-dark-border/60 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-dark-border/30">
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 bg-purple-500/15 rounded-lg text-purple-400 text-xs font-semibold">
                  {typeLabels[test.type]}
                </div>
                <h3 className="text-sm font-bold text-text-primary">{test.name}</h3>
              </div>
              <button onClick={() => deleteTest(test.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Variant A */}
                <div className={`rounded-xl p-4 border ${winnerRevenue === 'A' ? 'border-success/40 bg-success/5' : 'border-dark-border/40 bg-dark/30'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-text-secondary uppercase">Variante A</span>
                    {winnerRevenue === 'A' && <Trophy className="w-4 h-4 text-success" />}
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-3 truncate">{test.variantA}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Vendas</span><span className="text-xs font-bold text-text-primary">{statsA.vendas}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Receita</span><span className="text-xs font-bold text-success">R$ {statsA.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Ticket</span><span className="text-xs font-bold text-text-primary">R$ {statsA.ticketMedio.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Taxa OB</span><span className="text-xs font-bold text-purple-400">{statsA.taxaOB}%</span></div>
                  </div>
                </div>

                {/* Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" vertical={false} />
                      <XAxis dataKey="metric" stroke="#8b8ba3" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8b8ba3" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#12122a', border: '1px solid #2a2a4a', borderRadius: 12 }} />
                      <Bar dataKey="Variante A" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Variante B" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Variant B */}
                <div className={`rounded-xl p-4 border ${winnerRevenue === 'B' ? 'border-success/40 bg-success/5' : 'border-dark-border/40 bg-dark/30'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-text-secondary uppercase">Variante B</span>
                    {winnerRevenue === 'B' && <Trophy className="w-4 h-4 text-success" />}
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-3 truncate">{test.variantB}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Vendas</span><span className="text-xs font-bold text-text-primary">{statsB.vendas}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Receita</span><span className="text-xs font-bold text-success">R$ {statsB.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Ticket</span><span className="text-xs font-bold text-text-primary">R$ {statsB.ticketMedio.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-secondary">Taxa OB</span><span className="text-xs font-bold text-purple-400">{statsB.taxaOB}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
