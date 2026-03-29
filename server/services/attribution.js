import { getCache, setCache } from '../utils/cache.js'

// Armazena todas as vendas com UTM para cruzamento
const salesWithUtm = []
const MAX_SALES = 5000

export function addSaleWithUtm(sale) {
  salesWithUtm.unshift(sale)
  if (salesWithUtm.length > MAX_SALES) {
    salesWithUtm.length = MAX_SALES
  }
}

export function getAllSalesWithUtm() {
  return salesWithUtm
}

// Extrair UTMs de um evento da Hubla
export function extractUtmFromHubla(event) {
  const session = event.event?.lead?.session
  const utm = session?.utm || {}
  return {
    utm_source: utm.source || null,
    utm_medium: utm.medium || null,
    utm_campaign: utm.campaign || null,
    utm_content: utm.content || null,
    utm_term: utm.term || null,
    // Hubla também envia cookies de rastreamento
    fbclid: session?.cookies?.fbc || null,
    fbp: session?.cookies?.fbp || null,
    gclid: session?.cookies?.gclid || null,
  }
}

// Extrair UTMs de um evento da Pagtrust
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

// Cruzar vendas com campanhas do Meta Ads
export function buildAttribution(metaCampaigns) {
  const cacheKey = 'attribution_data'
  const cached = getCache(cacheKey)
  if (cached && cached._salesCount === salesWithUtm.length) return cached

  // Agrupar vendas por utm_campaign
  const salesByCampaign = {}
  const salesBySource = {}
  const salesWithoutUtm = []

  salesWithUtm.forEach(sale => {
    // Por campanha
    const campaign = sale.utm?.utm_campaign
    if (campaign) {
      if (!salesByCampaign[campaign]) {
        salesByCampaign[campaign] = { vendas: 0, receita: 0, sales: [] }
      }
      salesByCampaign[campaign].vendas++
      salesByCampaign[campaign].receita += sale.valor
      salesByCampaign[campaign].sales.push(sale)
    } else {
      salesWithoutUtm.push(sale)
    }

    // Por source
    const source = sale.utm?.utm_source || 'direto'
    if (!salesBySource[source]) {
      salesBySource[source] = { vendas: 0, receita: 0 }
    }
    salesBySource[source].vendas++
    salesBySource[source].receita += sale.valor
  })

  // Cruzar com campanhas do Meta se disponível
  const campaignAttribution = []

  if (metaCampaigns && metaCampaigns.length > 0) {
    metaCampaigns.forEach(mc => {
      const campaignName = mc.nome?.toLowerCase().trim()
      // Tentar match por nome da campanha
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
        conversoesMeta: mc.conversoes,
        // Dados reais de vendas
        vendasReais: salesData?.vendas || 0,
        receitaReal: salesData?.receita || 0,
        // ROAS real = receita de vendas / investido
        roasReal: salesData && mc.investido > 0
          ? Math.round((salesData.receita / mc.investido) * 100) / 100
          : null,
        // CPA real = investido / vendas reais
        cpaReal: salesData && salesData.vendas > 0
          ? Math.round((mc.investido / salesData.vendas) * 100) / 100
          : null,
        // ROAS do Meta (pixel)
        roasMeta: mc.roas,
      })
    })
  }

  // Ordenar por receita real (maiores primeiro)
  campaignAttribution.sort((a, b) => (b.receitaReal || 0) - (a.receitaReal || 0))

  // Totais
  const totalVendas = salesWithUtm.length
  const totalReceita = salesWithUtm.reduce((sum, s) => sum + s.valor, 0)
  const vendasFacebook = Object.entries(salesBySource)
    .filter(([source]) => ['facebook', 'fb', 'ig', 'instagram', 'meta'].includes(source.toLowerCase()))
    .reduce((sum, [, data]) => sum + data.vendas, 0)
  const receitaFacebook = Object.entries(salesBySource)
    .filter(([source]) => ['facebook', 'fb', 'ig', 'instagram', 'meta'].includes(source.toLowerCase()))
    .reduce((sum, [, data]) => sum + data.receita, 0)

  const result = {
    campaignAttribution,
    salesBySource: Object.entries(salesBySource).map(([source, data]) => ({
      source,
      ...data,
    })).sort((a, b) => b.receita - a.receita),
    totalVendas,
    totalReceita,
    vendasFacebook,
    receitaFacebook,
    vendasSemUtm: salesWithoutUtm.length,
    _salesCount: salesWithUtm.length,
  }

  setCache(cacheKey, result, 60 * 1000) // Cache de 1 minuto
  return result
}
