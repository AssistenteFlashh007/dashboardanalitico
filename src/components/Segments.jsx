import { useState, useEffect } from 'react'
import { Users, Download, Filter, Search } from 'lucide-react'

const API_BASE = '/api'

export default function Segments({ period }) {
  const [sales, setSales] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    produto: '',
    valorMin: '',
    valorMax: '',
    utmSource: '',
    orderbump: 'todos',
    upsell: 'todos',
    search: '',
  })
  const [products, setProducts] = useState([])
  const [sources, setSources] = useState([])

  useEffect(() => {
    loadSales()
  }, [period])

  async function loadSales() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/attribution/sales`)
      if (res.ok) {
        const json = await res.json()
        const data = json.data || json || []
        setSales(data)
        setFiltered(data)
        setProducts([...new Set(data.map(s => s.produto).filter(Boolean))])
        setSources([...new Set(data.map(s => s.utm?.utm_source).filter(Boolean))])
      }
    } catch { }
    setLoading(false)
  }

  useEffect(() => {
    let result = [...sales]

    if (filters.produto) {
      result = result.filter(s => s.produto === filters.produto)
    }
    if (filters.valorMin) {
      result = result.filter(s => s.valor >= parseFloat(filters.valorMin))
    }
    if (filters.valorMax) {
      result = result.filter(s => s.valor <= parseFloat(filters.valorMax))
    }
    if (filters.utmSource) {
      result = result.filter(s => s.utm?.utm_source === filters.utmSource)
    }
    if (filters.orderbump !== 'todos') {
      result = result.filter(s => filters.orderbump === 'sim' ? s.orderbump : !s.orderbump)
    }
    if (filters.upsell !== 'todos') {
      result = result.filter(s => filters.upsell === 'sim' ? s.upsell : !s.upsell)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(s =>
        (s.comprador || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [filters, sales])

  function exportCSV() {
    const headers = ['Nome', 'Email', 'Produto', 'Valor', 'Data', 'UTM Source', 'UTM Campaign', 'Order Bump', 'Upsell']
    const rows = filtered.map(s => [
      s.comprador || '', s.email || '', s.produto || '', s.valor || 0,
      s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '',
      s.utm?.utm_source || '', s.utm?.utm_campaign || '',
      s.orderbump ? 'Sim' : 'Nao', s.upsell ? 'Sim' : 'Nao'
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `segmento_${Date.now()}.csv`
    link.click()
  }

  const selectClass = "bg-dark/60 border border-dark-border/60 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
  const inputClass = selectClass

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Listas Segmentadas</h2>
            <p className="text-xs text-text-secondary">Segmente compradores por criterios e exporte</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">{filtered.length} de {sales.length} registros</span>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-text-primary">Filtros</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Produto</label>
            <select value={filters.produto} onChange={e => setFilters(p => ({ ...p, produto: e.target.value }))} className={selectClass + ' w-full'}>
              <option value="">Todos</option>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Valor Min</label>
            <input type="number" value={filters.valorMin} onChange={e => setFilters(p => ({ ...p, valorMin: e.target.value }))} placeholder="0" className={inputClass + ' w-full'} />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Valor Max</label>
            <input type="number" value={filters.valorMax} onChange={e => setFilters(p => ({ ...p, valorMax: e.target.value }))} placeholder="9999" className={inputClass + ' w-full'} />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">UTM Source</label>
            <select value={filters.utmSource} onChange={e => setFilters(p => ({ ...p, utmSource: e.target.value }))} className={selectClass + ' w-full'}>
              <option value="">Todos</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Order Bump</label>
            <select value={filters.orderbump} onChange={e => setFilters(p => ({ ...p, orderbump: e.target.value }))} className={selectClass + ' w-full'}>
              <option value="todos">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">Nao</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Upsell</label>
            <select value={filters.upsell} onChange={e => setFilters(p => ({ ...p, upsell: e.target.value }))} className={selectClass + ' w-full'}>
              <option value="todos">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">Nao</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} placeholder="Nome ou email" className={inputClass + ' w-full pl-8'} />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-dark-card rounded-2xl border border-dark-border/60 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-gradient-to-r from-purple-600/20 to-purple-800/10">
                <th className="text-left py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">Produto</th>
                <th className="text-right py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">Valor</th>
                <th className="text-left py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">Source</th>
                <th className="text-center py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">OB</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((s, i) => (
                <tr key={s.id || i} className={`border-b border-dark-border/20 hover:bg-purple-500/5 transition-colors ${i % 2 === 0 ? '' : 'bg-dark/20'}`}>
                  <td className="py-2.5 px-4 text-text-primary text-xs">{s.comprador || '-'}</td>
                  <td className="py-2.5 px-4 text-text-secondary text-xs">{s.email || '-'}</td>
                  <td className="py-2.5 px-4 text-text-primary text-xs truncate max-w-[200px]">{s.produto || '-'}</td>
                  <td className="py-2.5 px-4 text-right text-success text-xs font-semibold">R$ {(s.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-4 text-text-secondary text-xs">{s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="py-2.5 px-4 text-text-secondary text-xs">{s.utm?.utm_source || '-'}</td>
                  <td className="py-2.5 px-4 text-center">
                    {s.orderbump && <span className="text-xs bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded">OB</span>}
                    {s.upsell && <span className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded ml-1">UP</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-text-secondary text-sm">Nenhum resultado encontrado</div>
          )}
        </div>
      </div>
    </div>
  )
}
