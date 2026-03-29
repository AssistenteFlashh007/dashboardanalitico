import { getCache, setCache } from '../utils/cache.js'

const salesWithUtm = []
const MAX_SALES = 100000

export function addSaleWithUtm(sale) {
  salesWithUtm.unshift(sale)
  if (salesWithUtm.length > MAX_SALES) {
    salesWithUtm.length = MAX_SALES
  }
}

export function getAllSalesWithUtm() {
  return salesWithUtm
}

// Filtrar vendas por período
function filterByDate(sales, since, until) {
  if (!since && !until) return sales
  const start = since ? new Date(since + 'T00:00:00') : new Date(0)
  const end = until ? new Date(until + 'T23:59:59') : new Date()
  return sales.filter(s => {
    const d = new Date(s.data)
    return d >= start && d <= end
  })
}

// Resolver datas de presets do Meta para since/until
function resolveDates(opts) {
  const { period, since, until } = typeof opts === 'string' ? { period: opts } : opts
  if (since && until) return { since, until }

  const now = new Date()
  const fmt = d => d.toISOString().split('T')[0]

  switch (period) {
    case 'today':
      return { since: fmt(now), until: fmt(now) }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { since: fmt(y), until: fmt(y) }
    }
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return { since: fmt(first), until: fmt(now) }
    }
    case 'last_7d': {
      const d = new Date(now); d.setDate(d.getDate() - 7)
      return { since: fmt(d), until: fmt(now) }
    }
    case 'last_30d': {
      const d = new Date(now); d.setDate(d.getDate() - 30)
      return { since: fmt(d), until: fmt(now) }
    }
    case 'last_90d':
    default:
      return { since: null, until: null } // sem filtro = tudo
  }
}

export function extractUtmFromHubla(event) {
  const session = event.event?.lead?.session
  const utm = session?.utm || {}
  return {
    utm_source: utm.source || null,
    utm_medium: utm.medium || null,
    utm_campaign: utm.campaign || null,
    utm_content: utm.content || null,
    utm_term: utm.term || null,
    fbclid: session?.cookies?.fbc || null,
    fbp: session?.cookies?.fbp || null,
    gclid: session?.cookies?.gclid || null,
  }
}

export function extractUtmFromPagtrust(event) {
  const origin = event.origin || event.tracking || {}
  return {
    utm_source: origin.utm_source || origin.src || event.utm_source || null,
    utm_medium: origin.utm_medium || event.utm_medium || null,
    utm_campaign: origin.utm_campaign || event.utm_campaign || null,
    utm_content: origin.utm_content || event.utm_content || null,
    utm_term: origin.utm_term || event.utm_term || null,
    fbclid: origin.fbclid || event.fbclid || null,
    fbp: null,
    gclid: origin.gclid || event.gclid || null,
  }
}

// Filtrar vendas por plataforma
function filterByPlatform(sales, platform) {
  if (!platform || platform === 'todas') return sales
  return sales.filter(s => s.plataforma?.toLowerCase() === platform.toLowerCase())
}

// Cruzar vendas com campanhas do Meta Ads — com filtro de data e plataforma
export function buildAttribution(metaCampaigns, dateOpts = {}, platform = 'todas') {
  const { since, until } = resolveDates(dateOpts)
  const cacheKey = `attr_${since}_${until}_${platform}_${salesWithUtm.length}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  // Filtrar vendas pelo período e plataforma
  const filteredSales = filterByPlatform(filterByDate(salesWithUtm, since, until), platform)

  const salesByCampaign = {}
  const salesBySource = {}
  let vendasSemUtm = 0

  filteredSales.forEach(sale => {
    const campaign = sale.utm?.utm_campaign
    if (campaign) {
      if (!salesByCampaign[campaign]) {
        salesByCampaign[campaign] = { vendas: 0, receita: 0 }
      }
      salesByCampaign[campaign].vendas++
      salesByCampaign[campaign].receita += sale.valor
    } else {
      vendasSemUtm++
    }

    const source = sale.utm?.utm_source || 'direto'
    if (!salesBySource[source]) {
      salesBySource[source] = { vendas: 0, receita: 0 }
    }
    salesBySource[source].vendas++
    salesBySource[source].receita += sale.valor
  })

  // Cruzar com campanhas do Meta
  const campaignAttribution = []

  if (metaCampaigns && metaCampaigns.length > 0) {
    metaCampaigns.forEach(mc => {
      const campaignName = mc.nome?.toLowerCase().trim()
      const matchKey = Object.keys(salesByCampaign).find(key =>
        key.toLowerCase().trim() === campaignName ||
        campaignName.includes(key.toLowerCase().trim()) ||
        key.toLowerCase().trim().includes(campaignName)
      )

      const salesData = matchKey ? salesByCampaign[matchKey] : null

      campaignAttribution.push({
        campanha: mc.nome,
        conta: mc.conta,
        investido: mc.investido,
        cliques: mc.cliques,
        impressoes: mc.impressoes,
        ctr: mc.ctr,
        conversoesMeta: mc.conversoes,
        vendasReais: salesData?.vendas || 0,
        receitaReal: salesData?.receita || 0,
        roasReal: salesData && mc.investido > 0
          ? Math.round((salesData.receita / mc.investido) * 100) / 100
          : null,
        cpaReal: salesData && salesData.vendas > 0
          ? Math.round((mc.investido / salesData.vendas) * 100) / 100
          : null,
        roasMeta: mc.roas,
        cpaMeta: mc.cpa,
      })
    })
  }

  campaignAttribution.sort((a, b) => (b.receitaReal || 0) - (a.receitaReal || 0))

  const totalVendas = filteredSales.length
  const totalReceita = filteredSales.reduce((sum, s) => sum + s.valor, 0)

  // Contar vendas IniciaShop
  const vendasIniciaShop = filteredSales.filter(s =>
    s.produto?.toLowerCase().includes('iniciashop')
  ).length
  const receitaIniciaShop = filteredSales
    .filter(s => s.produto?.toLowerCase().includes('iniciashop'))
    .reduce((sum, s) => sum + s.valor, 0)

  const result = {
    campaignAttribution,
    salesBySource: Object.entries(salesBySource).map(([source, data]) => ({
      source, ...data,
    })).sort((a, b) => b.receita - a.receita),
    totalVendas,
    totalReceita,
    vendasIniciaShop,
    receitaIniciaShop,
    vendasSemUtm,
    periodo: { since, until },
  }

  setCache(cacheKey, result, 30 * 1000)
  return result
}
