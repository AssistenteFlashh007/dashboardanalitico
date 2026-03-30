import { getCache, setCache } from '../utils/cache.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const SALES_FILE = join(DATA_DIR, 'sales.json')
const MAX_SALES = 100000

// Normalizar valor — pode ser número, objeto {totalCents}, ou string
function normalizeValor(val) {
  if (typeof val === 'number') return val
  if (val && typeof val === 'object') {
    const cents = val.totalCents || val.subtotalCents || 0
    return typeof cents === 'number' ? cents / 100 : 0
  }
  if (typeof val === 'string') {
    // Formato brasileiro: R$ 1.297,50 -> 1297.50
    const cleaned = val.replace(/[R$US\s]/g, '').replace(/\./g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
  return 0
}

// Carregar vendas do arquivo ao iniciar e normalizar valores
let salesWithUtm = loadFromDisk().map(s => ({ ...s, valor: normalizeValor(s.valor) }))
console.log(`📂 ${salesWithUtm.length} vendas carregadas do disco`)

// Rebuild dedup maps from disk data to survive restarts
function rebuildDedupMaps() {
  global._hubla_dedup = {}
  global._pagtrust_dedup = {}
  for (const sale of salesWithUtm) {
    if (sale.plataforma === 'Hubla' && sale.id) {
      global._hubla_dedup[sale.id] = true
    }
    if (sale.plataforma === 'Pagtrust' && sale.id) {
      const key = `${sale.id}_${sale.produto || ''}`
      global._pagtrust_dedup[key] = true
    }
  }
  console.log(`🔒 Dedup maps: Hubla=${Object.keys(global._hubla_dedup).length} | Pagtrust=${Object.keys(global._pagtrust_dedup).length}`)
}
rebuildDedupMaps()

function loadFromDisk() {
  try {
    if (existsSync(SALES_FILE)) {
      const data = JSON.parse(readFileSync(SALES_FILE, 'utf-8'))
      return Array.isArray(data) ? data : []
    }
  } catch (e) {
    console.warn('[Attribution] Erro ao carregar sales.json:', e.message)
  }
  return []
}

let saveTimeout = null
function saveToDisk() {
  // Debounce — salva no máximo 1x a cada 2 segundos
  if (saveTimeout) return
  saveTimeout = setTimeout(() => {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
      writeFileSync(SALES_FILE, JSON.stringify(salesWithUtm))
    } catch (e) {
      console.warn('[Attribution] Erro ao salvar sales.json:', e.message)
    }
    saveTimeout = null
  }, 2000)
}

export function addSaleWithUtm(sale) {
  // Dedup: nao salvar se ID ja existe
  if (sale.id && salesWithUtm.some(s => s.id === sale.id && s.produto === sale.produto)) {
    console.log(`[Attribution] Venda duplicada ignorada (disco): ${sale.id} ${sale.produto}`)
    return
  }
  salesWithUtm.unshift({ ...sale, valor: normalizeValor(sale.valor) })
  if (salesWithUtm.length > MAX_SALES) {
    salesWithUtm.length = MAX_SALES
  }
  saveToDisk()
}

export function clearSales() {
  salesWithUtm = []
  saveToDisk()
}

export function getAllSalesWithUtm() {
  return salesWithUtm
}

// Converter data para string YYYY-MM-DD no fuso de Brasilia
function toDateBR(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  // Usar toLocaleString com timezone explicito
  return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

// Filtrar vendas por período (usando fuso de Brasília)
function filterByDate(sales, since, until) {
  if (!since && !until) return sales
  return sales.filter(s => {
    const dateBR = toDateBR(s.data)
    if (since && dateBR < since) return false
    if (until && dateBR > until) return false
    return true
  })
}

// Resolver datas de presets para since/until (fuso de Brasília)
function resolveDates(opts) {
  const { period, since, until } = typeof opts === 'string' ? { period: opts } : opts
  if (since && until) return { since, until }

  // Data atual em Brasília
  const now = new Date()
  now.setHours(now.getHours() - 3)
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
  // UTM pode estar em invoice.paymentSession ou lead.session
  const paymentSession = event.event?.invoice?.paymentSession
  const leadSession = event.event?.lead?.session
  const utm = paymentSession?.utm || leadSession?.utm || {}
  const cookies = paymentSession?.cookies || leadSession?.cookies || {}
  return {
    utm_source: utm.source || null,
    utm_medium: utm.medium || null,
    utm_campaign: utm.campaign || null,
    utm_content: utm.content ? utm.content.split('::')[0] : null,
    utm_term: utm.term || null,
    fbclid: cookies.fbclid || cookies.fbc || null,
    fbp: cookies.fbp || null,
    gclid: cookies.gclid || null,
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
  const salesByProduct = {}
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

    // Agrupar por produto
    const produto = sale.produto || 'Sem nome'
    if (!salesByProduct[produto]) {
      salesByProduct[produto] = { vendas: 0, receita: 0 }
    }
    salesByProduct[produto].vendas++
    salesByProduct[produto].receita += sale.valor
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
    salesByProduct: Object.entries(salesByProduct).map(([produto, data]) => ({
      produto, ...data,
    })).sort((a, b) => b.vendas - a.vendas),
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
