import { getAllSalesWithUtm } from './attribution.js'
import { getCampaignInsights, getAdCreatives } from './metaAds.js'

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
  const { since, until } = resolveDates(dateOpts)
  if (since || until) {
    filtered = filtered.filter(s => {
      const dateBR = toDateBR(s.data)
      if (since && dateBR < since) return false
      if (until && dateBR > until) return false
      return true
    })
  }
  if (platform && platform !== 'todas') {
    filtered = filtered.filter(s => s.plataforma?.toLowerCase() === platform.toLowerCase())
  }
  if (conta && conta !== 'todas') {
    filtered = filtered.filter(s => s.conta === conta)
  }
  return filtered
}

// Extrair tipo de funil do nome da campanha UTM
// Ex: [Masterclass04][IS][Vendas][quizz-01v1][1-1-X][BID][10.03.26]
//                                 ^^^^^^^^^^^  -> tipo de funil
function extractFunnelType(campaign) {
  if (!campaign) return 'Sem funil'
  // Pegar o 4º bloco entre colchetes (índice 3)
  const matches = campaign.match(/\[([^\]]+)\]/g)
  if (matches && matches.length >= 4) {
    const funnelBlock = matches[3].replace(/[\[\]]/g, '')
    return funnelBlock
  }
  // Tentar match direto nos padrões conhecidos
  const patterns = ['quizz-01v1', 'quizz-03', 'pv-01-minivsl', 'pv-02', 'quiz', 'vsl', 'webinar']
  for (const p of patterns) {
    if (campaign.toLowerCase().includes(p)) return p
  }
  return 'Outro'
}

// Extrair estratégia de bid/escala
function extractStrategy(campaign) {
  if (!campaign) return 'Desconhecido'
  const matches = campaign.match(/\[([^\]]+)\]/g)
  if (matches) {
    const lower = matches.map(m => m.replace(/[\[\]]/g, '').toLowerCase())
    if (lower.some(m => m.includes('bid'))) return 'BID'
    if (lower.some(m => m.includes('cbo'))) return 'CBO'
    if (lower.some(m => m.includes('escala'))) return 'Escala'
    if (lower.some(m => m.includes('teste'))) return 'Teste'
    if (lower.some(m => m.includes('validado'))) return 'Validados'
  }
  return 'Outro'
}

function isSim(val) {
  if (!val) return false
  return ['sim', 'yes', 'true', '1'].includes(String(val).toLowerCase().trim())
}

export async function getFunnelAnalytics(opts = {}) {
  const sales = filterSales(getAllSalesWithUtm(), opts)
  const total = sales.length
  if (total === 0) return { total: 0, orderbump: {}, upsell: {}, tiposFunil: [], estrategias: [], funis: [], checkouts: [], metodosPagamento: [], ofertaConversao: [], taxaConversao: {} }

  // Buscar dados do Meta para calcular taxas de conversão
  let metaCampaigns = []
  try {
    metaCampaigns = await getCampaignInsights(opts.dateOpts || 'this_month') || []
  } catch (e) {
    console.warn('[Analytics] Meta campaigns not available:', e.message)
  }

  // ===== TAXAS DE CONVERSÃO =====
  const totalCliques = metaCampaigns.reduce((s, c) => s + (c.cliques || 0), 0)
  const totalImpressoes = metaCampaigns.reduce((s, c) => s + (c.impressoes || 0), 0)
  const totalAlcance = metaCampaigns.reduce((s, c) => s + (c.alcance || 0), 0)
  const totalInvestido = metaCampaigns.reduce((s, c) => s + (c.investido || 0), 0)

  const taxaConversao = {
    clickToSale: totalCliques > 0 ? Math.round((total / totalCliques) * 10000) / 100 : 0,
    impressionToSale: totalImpressoes > 0 ? Math.round((total / totalImpressoes) * 1000000) / 100 : 0,
    alcanceToSale: totalAlcance > 0 ? Math.round((total / totalAlcance) * 10000) / 100 : 0,
    totalCliques,
    totalImpressoes,
    totalAlcance,
    totalInvestido,
    cpc: totalCliques > 0 ? Math.round(totalInvestido / totalCliques * 100) / 100 : 0,
    cpm: totalImpressoes > 0 ? Math.round(totalInvestido / totalImpressoes * 1000 * 100) / 100 : 0,
    cpa: total > 0 ? Math.round(totalInvestido / total * 100) / 100 : 0,
  }

  // ===== ORDER BUMP =====
  const comOB = sales.filter(s => s.orderbump)
  const semOB = sales.filter(s => !s.orderbump)
  const orderbump = {
    total: comOB.length,
    taxa: total > 0 ? Math.round((comOB.length / total) * 10000) / 100 : 0,
    receitaOB: comOB.reduce((s, v) => s + v.valor, 0),
    ticketComOB: comOB.length > 0 ? Math.round(comOB.reduce((s, v) => s + v.valor, 0) / comOB.length * 100) / 100 : 0,
    ticketSemOB: semOB.length > 0 ? Math.round(semOB.reduce((s, v) => s + v.valor, 0) / semOB.length * 100) / 100 : 0,
  }

  // ===== UPSELL =====
  const comUpsell = sales.filter(s => s.upsell)
  const upsell = {
    total: comUpsell.length,
    taxa: total > 0 ? Math.round((comUpsell.length / total) * 10000) / 100 : 0,
    receitaUpsell: comUpsell.reduce((s, v) => s + v.valor, 0),
    ticketComUpsell: comUpsell.length > 0 ? Math.round(comUpsell.reduce((s, v) => s + v.valor, 0) / comUpsell.length * 100) / 100 : 0,
  }

  // ===== ANÁLISE POR TIPO DE FUNIL (quizz-01v1, pv-01-minivsl, etc) =====
  const tipoFunilMap = {}
  // Mapear cliques e investimento por tipo de funil do Meta
  const metaByFunnelType = {}
  metaCampaigns.forEach(mc => {
    const tipo = extractFunnelType(mc.nome)
    if (!metaByFunnelType[tipo]) metaByFunnelType[tipo] = { cliques: 0, impressoes: 0, investido: 0, alcance: 0 }
    metaByFunnelType[tipo].cliques += mc.cliques || 0
    metaByFunnelType[tipo].impressoes += mc.impressoes || 0
    metaByFunnelType[tipo].investido += mc.investido || 0
    metaByFunnelType[tipo].alcance += mc.alcance || 0
  })

  sales.forEach(s => {
    const tipo = extractFunnelType(s.utm?.utm_campaign)
    if (!tipoFunilMap[tipo]) tipoFunilMap[tipo] = { vendas: 0, receita: 0, orderbumps: 0, upsells: 0 }
    tipoFunilMap[tipo].vendas++
    tipoFunilMap[tipo].receita += s.valor
    if (s.orderbump) tipoFunilMap[tipo].orderbumps++
    if (s.upsell) tipoFunilMap[tipo].upsells++
  })

  const tiposFunil = Object.entries(tipoFunilMap)
    .map(([tipo, data]) => {
      const meta = metaByFunnelType[tipo] || {}
      const connectRate = meta.cliques > 0 ? Math.round((data.vendas / meta.cliques) * 10000) / 100 : null
      const roas = meta.investido > 0 ? Math.round((data.receita / meta.investido) * 100) / 100 : null
      return {
        tipo,
        ...data,
        ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
        taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
        taxaUpsell: Math.round((data.upsells / data.vendas) * 10000) / 100,
        // Dados do Meta
        cliques: meta.cliques || 0,
        impressoes: meta.impressoes || 0,
        investido: meta.investido || 0,
        // Taxas calculadas
        connectRate,
        cpa: data.vendas > 0 && meta.investido > 0 ? Math.round(meta.investido / data.vendas * 100) / 100 : null,
        roas,
      }
    })
    .sort((a, b) => b.vendas - a.vendas)

  // ===== ANÁLISE POR ESTRATÉGIA (BID, CBO, Escala, Teste) =====
  const estrategiaMap = {}
  const metaByStrategy = {}
  metaCampaigns.forEach(mc => {
    const est = extractStrategy(mc.nome)
    if (!metaByStrategy[est]) metaByStrategy[est] = { cliques: 0, investido: 0 }
    metaByStrategy[est].cliques += mc.cliques || 0
    metaByStrategy[est].investido += mc.investido || 0
  })

  sales.forEach(s => {
    const est = extractStrategy(s.utm?.utm_campaign)
    if (!estrategiaMap[est]) estrategiaMap[est] = { vendas: 0, receita: 0 }
    estrategiaMap[est].vendas++
    estrategiaMap[est].receita += s.valor
  })

  const estrategias = Object.entries(estrategiaMap)
    .map(([estrategia, data]) => {
      const meta = metaByStrategy[estrategia] || {}
      return {
        estrategia,
        ...data,
        cliques: meta.cliques || 0,
        investido: meta.investido || 0,
        connectRate: meta.cliques > 0 ? Math.round((data.vendas / meta.cliques) * 10000) / 100 : null,
        cpa: data.vendas > 0 && meta.investido > 0 ? Math.round(meta.investido / data.vendas * 100) / 100 : null,
        roas: meta.investido > 0 ? Math.round((data.receita / meta.investido) * 100) / 100 : null,
      }
    })
    .sort((a, b) => b.vendas - a.vendas)

  // ===== FUNIS (do campo funil do CSV) =====
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
      nome, ...data,
      ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
      taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
    }))
    .sort((a, b) => b.vendas - a.vendas)

  // ===== CHECKOUTS =====
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
      nome, ...data,
      ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
      taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
    }))
    .sort((a, b) => b.vendas - a.vendas)

  // ===== MÉTODOS DE PAGAMENTO =====
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

  // ===== OFERTA =====
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
      oferta, ...data,
      ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
      taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
    }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 15)

  return {
    total,
    receitaTotal: sales.reduce((s, v) => s + v.valor, 0),
    ticketMedio: Math.round(sales.reduce((s, v) => s + v.valor, 0) / total * 100) / 100,
    taxaConversao,
    orderbump,
    upsell,
    tiposFunil: tiposFunil.slice(0, 10),
    estrategias,
    funis: funis.slice(0, 10),
    checkouts: checkouts.slice(0, 10),
    metodosPagamento,
    ofertaConversao,
  }
}

function normalizeForMatch(str) {
  return (str || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function findMatchingAd(creativeName, metaAds) {
  const normalized = normalizeForMatch(creativeName)
  if (!normalized || normalized === 'sem criativo') return null
  // 1. Exact match
  let match = metaAds.find(ad => normalizeForMatch(ad.adName) === normalized)
  if (match) return match
  // 2. Ad name contains utm_content
  match = metaAds.find(ad => normalizeForMatch(ad.adName).includes(normalized))
  if (match) return match
  // 3. utm_content contains ad name
  match = metaAds.find(ad => {
    const adNorm = normalizeForMatch(ad.adName)
    return adNorm.length > 5 && normalized.includes(adNorm)
  })
  return match || null
}

export async function getCreativeAnalytics(opts = {}) {
  const sales = filterSales(getAllSalesWithUtm(), opts)
  if (sales.length === 0) return { criativos: [], contas: [], totalVendas: 0, totalReceita: 0 }

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

  // Buscar dados de criativos do Meta Ads
  let metaAds = []
  try {
    metaAds = await getAdCreatives(opts.dateOpts || 'this_month') || []
  } catch (err) {
    console.warn('[Analytics] Erro ao buscar criativos do Meta:', err.message)
  }

  const criativos = Object.entries(criativoMap)
    .map(([nome, data]) => {
      const matchedAd = findMatchingAd(nome, metaAds)
      return {
        nome, ...data,
        ticketMedio: Math.round(data.receita / data.vendas * 100) / 100,
        pctVendas: Math.round((data.vendas / totalVendas) * 10000) / 100,
        pctReceita: Math.round((data.receita / totalReceita) * 10000) / 100,
        taxaOB: Math.round((data.orderbumps / data.vendas) * 10000) / 100,
        // Meta Ads data
        linkedToMeta: !!matchedAd,
        thumbnailUrl: matchedAd?.thumbnailUrl || null,
        imageUrl: matchedAd?.imageUrl || null,
        darkpostUrl: matchedAd?.darkpostUrl || null,
        previewUrl: matchedAd?.previewUrl || null,
        metaSpend: matchedAd?.metaSpend || 0,
        metaClicks: matchedAd?.metaClicks || 0,
        metaImpressions: matchedAd?.metaImpressions || 0,
        adId: matchedAd?.adId || null,
        campaignName: matchedAd?.campaignName || null,
      }
    })
    .sort((a, b) => b.vendas - a.vendas)

  const matchedCount = criativos.filter(c => c.linkedToMeta).length

  const contaSet = new Set()
  getAllSalesWithUtm().forEach(s => { if (s.conta) contaSet.add(s.conta) })

  return {
    criativos: criativos.slice(0, 30),
    totalVendas,
    totalReceita,
    matchedCount,
    totalCreatives: criativos.length,
    contas: ['todas', ...Array.from(contaSet).sort()]
  }
}

export function getAvailableAccounts() {
  const contaSet = new Set()
  getAllSalesWithUtm().forEach(s => { if (s.conta) contaSet.add(s.conta) })
  return ['todas', ...Array.from(contaSet).sort()]
}
