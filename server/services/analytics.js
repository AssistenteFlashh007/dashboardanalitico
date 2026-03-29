import { getAllSalesWithUtm } from './attribution.js'

// Converter data para YYYY-MM-DD em fuso BR (UTC-3)
function toDateBR(date) {
  const d = new Date(date)
  d.setHours(d.getHours() - 3)
  return d.toISOString().split('T')[0]
}

function resolveDates(opts) {
  const { period, since, until } = typeof opts === 'string' ? { period: opts } : opts
  if (since && until) return { since, until }
  const now = new Date()
  now.setHours(now.getHours() - 3)
  const fmt = d => d.toISOString().split('T')[0]
  switch (period) {
    case 'today': return { since: fmt(now), until: fmt(now) }
    case 'yesterday': { const y = new Date(now); y.setDate(y.getDate() - 1); return { since: fmt(y), until: fmt(y) } }
    case 'this_month': { const f = new Date(now.getFullYear(), now.getMonth(), 1); return { since: fmt(f), until: fmt(now) } }
    case 'last_7d': { const d = new Date(now); d.setDate(d.getDate() - 7); return { since: fmt(d), until: fmt(now) } }
    case 'last_30d': { const d = new Date(now); d.setDate(d.getDate() - 30); return { since: fmt(d), until: fmt(now) } }
    default: return { since: null, until: null }
  }
}

function filterSales(sales, { dateOpts, platform, conta }) {
  let filtered = sales

  // Filtrar por data
  const { since, until } = resolveDates(dateOpts)
  if (since || until) {
    filtered = filtered.filter(s => {
      const dateBR = toDateBR(s.data)
      if (since && dateBR < since) return false
      if (until && dateBR > until) return false
      return true
    })
  }

  // Filtrar por plataforma
  if (platform && platform !== 'todas') {
    filtered = filtered.filter(s => s.plataforma?.toLowerCase() === platform.toLowerCase())
  }

  // Filtrar por conta de anúncio
  if (conta && conta !== 'todas') {
    filtered = filtered.filter(s => s.conta === conta)
  }

  return filtered
}

export function getFunnelAnalytics(opts = {}) {
  const sales = filterSales(getAllSalesWithUtm(), opts)
  const total = sales.length
  if (total === 0) return { total: 0, orderbump: {}, upsell: {}, funis: [], checkouts: [], metodosPagamento: [], ofertaConversao: [] }

  // Order Bump
  const comOB = sales.filter(s => s.orderbump)
  const semOB = sales.filter(s => !s.orderbump)
  const orderbump = {
    total: comOB.length,
    taxa: total > 0 ? Math.round((comOB.length / total) * 10000) / 100 : 0,
    receitaOB: comOB.reduce((s, v) => s + v.valor, 0),
    ticketComOB: comOB.length > 0 ? Math.round(comOB.reduce((s, v) => s + v.valor, 0) / comOB.length * 100) / 100 : 0,
    ticketSemOB: semOB.length > 0 ? Math.round(semOB.reduce((s, v) => s + v.valor, 0) / semOB.length * 100) / 100 : 0,
  }

  // Upsell
  const comUpsell = sales.filter(s => s.upsell)
  const upsell = {
    total: comUpsell.length,
    taxa: total > 0 ? Math.round((comUpsell.length / total) * 10000) / 100 : 0,
    receitaUpsell: comUpsell.reduce((s, v) => s + v.valor, 0),
    ticketComUpsell: comUpsell.length > 0 ? Math.round(comUpsell.reduce((s, v) => s + v.valor, 0) / comUpsell.length * 100) / 100 : 0,
  }

  // Análise por funil
  const funilMap = {}
  sales.forEach(s => {
    const f = s.funil || 'Sem funil'
    if (!funilMap[f]) funilMap[f] = { vendas: 0, receita: 0, orderbumps: 0, upsells: 0 }
    funilMap[f].vendas++
    funilMap[f].receita += s.valor
    if (s.orderbump) funilMap[f].orderbumps++
    if (s.upsell) funilMap[f].upsells++
  })
  const funis = Object.entries(funilMap)
    .map(([nome, data]) => ({
      nome,
      ...data,
      ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
      taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
      taxaUpsell: Math.round((data.upsells / data.vendas) * 10000) / 100,
    }))
    .sort((a, b) => b.vendas - a.vendas)

  // Análise por checkout
  const checkoutMap = {}
  sales.forEach(s => {
    const c = s.checkout || 'Sem checkout'
    if (!checkoutMap[c]) checkoutMap[c] = { vendas: 0, receita: 0, orderbumps: 0 }
    checkoutMap[c].vendas++
    checkoutMap[c].receita += s.valor
    if (s.orderbump) checkoutMap[c].orderbumps++
  })
  const checkouts = Object.entries(checkoutMap)
    .map(([nome, data]) => ({
      nome,
      ...data,
      ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
      taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
    }))
    .sort((a, b) => b.vendas - a.vendas)

  // Métodos de pagamento
  const metodoMap = {}
  sales.forEach(s => {
    const m = s.metodo_pagamento || 'Desconhecido'
    if (!metodoMap[m]) metodoMap[m] = { vendas: 0, receita: 0 }
    metodoMap[m].vendas++
    metodoMap[m].receita += s.valor
  })
  const metodosPagamento = Object.entries(metodoMap)
    .map(([metodo, data]) => ({ metodo, ...data, pct: Math.round((data.vendas / total) * 10000) / 100 }))
    .sort((a, b) => b.vendas - a.vendas)

  // Conversão por oferta
  const ofertaMap = {}
  sales.forEach(s => {
    const o = s.oferta || s.produto || 'Sem oferta'
    if (!ofertaMap[o]) ofertaMap[o] = { vendas: 0, receita: 0, orderbumps: 0, upsells: 0 }
    ofertaMap[o].vendas++
    ofertaMap[o].receita += s.valor
    if (s.orderbump) ofertaMap[o].orderbumps++
    if (s.upsell) ofertaMap[o].upsells++
  })
  const ofertaConversao = Object.entries(ofertaMap)
    .map(([oferta, data]) => ({
      oferta,
      ...data,
      ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
      taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
    }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 15)

  return {
    total,
    receitaTotal: sales.reduce((s, v) => s + v.valor, 0),
    ticketMedio: Math.round(sales.reduce((s, v) => s + v.valor, 0) / total * 100) / 100,
    orderbump,
    upsell,
    funis: funis.slice(0, 10),
    checkouts: checkouts.slice(0, 10),
    metodosPagamento,
    ofertaConversao,
  }
}

export function getCreativeAnalytics(opts = {}) {
  const sales = filterSales(getAllSalesWithUtm(), opts)
  if (sales.length === 0) return { criativos: [], contas: [] }

  // Agrupar por criativo (utm_content)
  const criativoMap = {}
  sales.forEach(s => {
    const creative = s.utm?.utm_content || 'Sem criativo'
    if (!criativoMap[creative]) criativoMap[creative] = { vendas: 0, receita: 0, orderbumps: 0 }
    criativoMap[creative].vendas++
    criativoMap[creative].receita += s.valor
    if (s.orderbump) criativoMap[creative].orderbumps++
  })

  const totalVendas = sales.length
  const totalReceita = sales.reduce((s, v) => s + v.valor, 0)

  const criativos = Object.entries(criativoMap)
    .map(([nome, data]) => ({
      nome,
      ...data,
      ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
      pctVendas: Math.round((data.vendas / totalVendas) * 10000) / 100,
      pctReceita: Math.round((data.receita / totalReceita) * 10000) / 100,
      taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
    }))
    .sort((a, b) => b.vendas - a.vendas)

  // Contas disponíveis para filtro
  const contaSet = new Set()
  getAllSalesWithUtm().forEach(s => { if (s.conta) contaSet.add(s.conta) })
  const contas = ['todas', ...Array.from(contaSet).sort()]

  return {
    criativos: criativos.slice(0, 30),
    totalVendas,
    totalReceita,
    contas,
  }
}

export function getAvailableAccounts() {
  const contaSet = new Set()
  getAllSalesWithUtm().forEach(s => { if (s.conta) contaSet.add(s.conta) })
  return ['todas', ...Array.from(contaSet).sort()]
}
