import { useState } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'

const subTabs = [
  { id: 'campanhas', label: 'Campanhas' },
  { id: 'conjuntos', label: 'Conjuntos' },
  { id: 'anuncios', label: 'Anuncios' },
]

function extractParts(campaignName) {
  const parts = campaignName.match(/\[([^\]]+)\]/g)?.map(p => p.replace(/[\[\]]/g, '')) || []
  return {
    conta: parts[0] || '',
    produto: parts[1] || '',
    objetivo: parts[2] || '',
    funil: parts[3] || '',
    conjunto: parts[4] || '',
    estrategia: parts[5] || '',
    data: parts[6] || '',
  }
}

export default function CampaignTable({ data, attribution }) {
  const [activeSubTab, setActiveSubTab] = useState('campanhas')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('investido')
  const [sortDir, setSortDir] = useState('desc')
  const [contaFilter, setContaFilter] = useState('')

  const campaigns = data.map(camp => {
    const attr = attribution?.campaignAttribution?.find(a => a.campanha === camp.nome)
    const parts = extractParts(camp.nome)
    return {
      ...camp,
      vendasReais: attr?.vendasReais || 0,
      receitaReal: attr?.receitaReal || 0,
      roasReal: attr?.roasReal || null,
      cpaReal: attr?.cpaReal || null,
      parts,
    }
  })

  const contas = [...new Set(campaigns.map(c => c.conta || c.parts.conta).filter(Boolean))]

  // Group by conjunto or anuncio
  function getGroupedData() {
    let items = campaigns
    if (contaFilter) items = items.filter(c => (c.conta || c.parts.conta) === contaFilter)
    if (search) items = items.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()))

    if (activeSubTab === 'conjuntos') {
      const groups = {}
      items.forEach(c => {
        const key = c.parts.conjunto || c.parts.funil || c.nome.split(']')[3]?.replace('[', '') || 'Sem conjunto'
        if (!groups[key]) groups[key] = { nome: key, conta: c.conta || c.parts.conta, investido: 0, vendasReais: 0, receitaReal: 0, cliques: c.cliques || 0, impressoes: c.impressoes || 0, ctr: 0, count: 0 }
        groups[key].investido += c.investido
        groups[key].vendasReais += c.vendasReais
        groups[key].receitaReal += c.receitaReal
        groups[key].cliques += c.cliques || 0
        groups[key].impressoes += c.impressoes || 0
        groups[key].count++
      })
      return Object.values(groups).map(g => ({
        ...g,
        roasReal: g.investido > 0 ? parseFloat((g.receitaReal / g.investido).toFixed(2)) : null,
        cpaReal: g.vendasReais > 0 ? parseFloat((g.investido / g.vendasReais).toFixed(2)) : null,
        ctr: g.impressoes > 0 ? parseFloat(((g.cliques / g.impressoes) * 100).toFixed(2)) : 0,
      }))
    }

    if (activeSubTab === 'anuncios') {
      const groups = {}
      items.forEach(c => {
        const key = c.parts.funil || c.nome.split(']')[3]?.replace('[', '') || 'Sem funil'
        const estrategia = c.parts.estrategia || ''
        const fullKey = `${key} | ${estrategia}`
        if (!groups[fullKey]) groups[fullKey] = { nome: fullKey, conta: c.conta || c.parts.conta, investido: 0, vendasReais: 0, receitaReal: 0, cliques: c.cliques || 0, impressoes: c.impressoes || 0, count: 0 }
        groups[fullKey].investido += c.investido
        groups[fullKey].vendasReais += c.vendasReais
        groups[fullKey].receitaReal += c.receitaReal
        groups[fullKey].cliques += c.cliques || 0
        groups[fullKey].impressoes += c.impressoes || 0
        groups[fullKey].count++
      })
      return Object.values(groups).map(g => ({
        ...g,
        roasReal: g.investido > 0 ? parseFloat((g.receitaReal / g.investido).toFixed(2)) : null,
        cpaReal: g.vendasReais > 0 ? parseFloat((g.investido / g.vendasReais).toFixed(2)) : null,
        ctr: g.impressoes > 0 ? parseFloat(((g.cliques / g.impressoes) * 100).toFixed(2)) : 0,
      }))
    }

    return items
  }

  const displayData = getGroupedData()

  const sorted = [...displayData].sort((a, b) => {
    const aVal = a[sortBy] ?? 0
    const bVal = b[sortBy] ?? 0
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const totalInvest = sorted.reduce((s, c) => s + c.investido, 0)
  const totalVendas = sorted.reduce((s, c) => s + c.vendasReais, 0)
  const totalReceita = sorted.reduce((s, c) => s + c.receitaReal, 0)

  const thClass = "text-right py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider cursor-pointer hover:text-purple-100 select-none"

  return (
    <div className="bg-dark-card rounded-2xl border border-dark-border/60 overflow-hidden">
      {/* Header + Sub-tabs + Filters */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">Performance de Campanhas</h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{sorted.length} itens</span>
            <span>|</span>
            <span>R$ {totalInvest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} invest.</span>
            <span>|</span>
            <span className="text-success">{totalVendas} vendas</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Sub-tabs */}
          <div className="flex bg-dark/60 rounded-xl border border-dark-border/40 p-0.5">
            {subTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Conta filter */}
            {contas.length > 1 && (
              <select
                value={contaFilter}
                onChange={e => setContaFilter(e.target.value)}
                className="bg-dark/60 border border-dark-border/40 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Todas contas</option>
                {contas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="bg-dark/60 border border-dark-border/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary w-48 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-purple-600/20 to-purple-800/10">
              <th className="text-left py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">
                {activeSubTab === 'campanhas' ? 'Campanha' : activeSubTab === 'conjuntos' ? 'Conjunto' : 'Anuncio'}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-purple-200 text-xs uppercase tracking-wider">Conta</th>
              <th className={thClass} onClick={() => toggleSort('investido')}>
                <span className="flex items-center justify-end gap-1">Investido <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className={thClass} onClick={() => toggleSort('vendasReais')}>
                <span className="flex items-center justify-end gap-1">Vendas <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className={thClass} onClick={() => toggleSort('receitaReal')}>
                <span className="flex items-center justify-end gap-1">Receita <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className={thClass} onClick={() => toggleSort('roasReal')}>
                <span className="flex items-center justify-end gap-1">ROAS <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className={thClass} onClick={() => toggleSort('cpaReal')}>
                <span className="flex items-center justify-end gap-1">CPA <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className={thClass} onClick={() => toggleSort('ctr')}>
                <span className="flex items-center justify-end gap-1">CTR <ArrowUpDown className="w-3 h-3" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((camp, i) => (
              <tr key={`${camp.nome}-${i}`} className={`border-b border-dark-border/20 hover:bg-purple-500/5 transition-colors ${i % 2 === 0 ? '' : 'bg-dark/20'}`}>
                <td className="py-2.5 px-4 font-medium text-text-primary max-w-[280px] truncate text-xs">{camp.nome}</td>
                <td className="py-2.5 px-4 text-text-secondary text-xs">{camp.conta || camp.parts?.conta || camp.plataforma}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary text-xs">R$ {camp.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="py-2.5 px-4 text-right text-text-primary font-semibold text-xs">{camp.vendasReais > 0 ? camp.vendasReais : '-'}</td>
                <td className="py-2.5 px-4 text-right text-success font-medium text-xs">{camp.receitaReal > 0 ? `R$ ${camp.receitaReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</td>
                <td className="py-2.5 px-4 text-right">
                  {camp.roasReal != null ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${camp.roasReal >= 2 ? 'bg-success/15 text-success' : camp.roasReal >= 1 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'}`}>
                      {camp.roasReal}x
                    </span>
                  ) : <span className="text-text-secondary text-xs">-</span>}
                </td>
                <td className="py-2.5 px-4 text-right text-warning text-xs">{camp.cpaReal != null ? `R$ ${camp.cpaReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary text-xs">{camp.ctr}%</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-text-secondary text-sm">Nenhuma campanha encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
