import { getCache, setCache } from '../utils/cache.js'
import { getUsdToBrl, convertUsdToBrl } from '../utils/currency.js'

const GRAPH_API = 'https://graph.facebook.com/v21.0'

function getAccountIds() {
  // Suporta META_AD_ACCOUNTS (múltiplas) ou META_AD_ACCOUNT_ID (única)
  const multiple = process.env.META_AD_ACCOUNTS
  if (multiple) {
    return multiple.split(',').map(id => id.trim()).filter(Boolean)
  }
  const single = process.env.META_AD_ACCOUNT_ID
  if (single) return [single.trim()]
  throw new Error('META_AD_ACCOUNTS ou META_AD_ACCOUNT_ID não configurado')
}

async function metaFetch(endpoint, params = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN não configurado')

  const url = new URL(`${GRAPH_API}${endpoint}`)
  url.searchParams.set('access_token', token)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Meta API error: ${res.status}`)
  }
  return res.json()
}

// Nomes amigáveis para as contas
const ACCOUNT_NAMES = {
  'act_938668269124772': 'Bru Masterclass 02',
  'act_2785954928464450': 'Bru Masterclass 03',
  'act_2137556313751097': 'Bru Masterclass 04',
  'act_948441777628994': 'Bru Masterclass 05',
}

function parseInsights(insights, rate) {
  const spendUsd = parseFloat(insights.spend || 0)
  const cpcUsd = parseFloat(insights.cpc || 0)
  const cpmUsd = parseFloat(insights.cpm || 0)

  const result = {
    spend: convertUsdToBrl(spendUsd, rate),
    spendUsd,
    impressions: parseInt(insights.impressions || 0),
    reach: parseInt(insights.reach || 0),
    clicks: parseInt(insights.clicks || 0),
    ctr: parseFloat(insights.ctr || 0),
    cpc: convertUsdToBrl(cpcUsd, rate),
    cpm: convertUsdToBrl(cpmUsd, rate),
    roas: parseFloat(insights.purchase_roas?.[0]?.value || 0),
    conversions: 0,
    cpa: 0,
  }

  const purchaseAction = insights.actions?.find(a => a.action_type === 'purchase')
  if (purchaseAction) {
    result.conversions = parseInt(purchaseAction.value || 0)
  }
  const cpaAction = insights.cost_per_action_type?.find(a => a.action_type === 'purchase')
  if (cpaAction) {
    result.cpa = convertUsdToBrl(parseFloat(cpaAction.value || 0), rate)
  }

  return result
}

function buildDateParams(opts = {}) {
  const { period = 'last_30d', since, until } = typeof opts === 'string' ? { period: opts } : opts
  if (since && until) {
    return { time_range: JSON.stringify({ since, until }) }
  }
  return { date_preset: period }
}

function buildCacheKey(prefix, opts) {
  const { period, since, until } = typeof opts === 'string' ? { period: opts } : opts
  if (since && until) return `${prefix}_${since}_${until}`
  return `${prefix}_${period || 'last_30d'}`
}

export async function getAccountInsights(opts = 'last_30d') {
  const cacheKey = buildCacheKey('meta_insights', opts)
  const cached = getCache(cacheKey)
  if (cached) return cached

  const accountIds = getAccountIds()
  const rate = await getUsdToBrl()
  const dateParams = buildDateParams(opts)
  const fields = [
    'spend', 'impressions', 'reach', 'clicks',
    'ctr', 'cpc', 'cpm', 'actions',
    'cost_per_action_type', 'purchase_roas',
  ].join(',')

  // Buscar dados de todas as contas em paralelo
  const results = await Promise.allSettled(
    accountIds.map(async (accountId) => {
      const data = await metaFetch(`/${accountId}/insights`, {
        fields,
        ...dateParams,
        level: 'account',
      })
      return {
        accountId,
        accountName: ACCOUNT_NAMES[accountId] || accountId,
        insights: data.data?.[0] || null,
      }
    })
  )

  // Separar sucessos e erros
  const successful = results
    .filter(r => r.status === 'fulfilled' && r.value.insights)
    .map(r => r.value)

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason?.message || 'Erro desconhecido')

  if (successful.length === 0) {
    throw new Error(`Nenhuma conta retornou dados. Erros: ${errors.join('; ')}`)
  }

  // Agregar dados de todas as contas
  const aggregated = {
    spend: 0, impressions: 0, reach: 0, clicks: 0,
    conversions: 0, cpa: 0, roas: 0, ctr: 0, cpc: 0, cpm: 0,
  }

  const perAccount = []

  successful.forEach(({ accountId, accountName, insights }) => {
    const parsed = parseInsights(insights, rate)
    perAccount.push({ accountId, accountName, ...parsed })

    aggregated.spend += parsed.spend
    aggregated.impressions += parsed.impressions
    aggregated.reach += parsed.reach
    aggregated.clicks += parsed.clicks
    aggregated.conversions += parsed.conversions
  })

  // Calcular médias ponderadas
  if (aggregated.impressions > 0) {
    aggregated.ctr = (aggregated.clicks / aggregated.impressions) * 100
    aggregated.cpm = (aggregated.spend / aggregated.impressions) * 1000
  }
  if (aggregated.clicks > 0) {
    aggregated.cpc = aggregated.spend / aggregated.clicks
  }
  if (aggregated.conversions > 0) {
    aggregated.cpa = aggregated.spend / aggregated.conversions
  }
  if (aggregated.spend > 0) {
    // ROAS = receita média ponderada (usando spend em USD para peso correto)
    const totalSpendUsd = perAccount.reduce((sum, a) => sum + (a.spendUsd || 0), 0)
    const totalRoasWeighted = successful.reduce((sum, { insights }) => {
      const s = parseFloat(insights.spend || 0)
      const r = parseFloat(insights.purchase_roas?.[0]?.value || 0)
      return sum + (s * r)
    }, 0)
    aggregated.roas = totalSpendUsd > 0 ? totalRoasWeighted / totalSpendUsd : 0
  }

  // Arredondar
  aggregated.ctr = Math.round(aggregated.ctr * 100) / 100
  aggregated.cpc = Math.round(aggregated.cpc * 100) / 100
  aggregated.cpm = Math.round(aggregated.cpm * 100) / 100
  aggregated.cpa = Math.round(aggregated.cpa * 100) / 100
  aggregated.roas = Math.round(aggregated.roas * 100) / 100

  const result = {
    ...aggregated,
    moeda: 'BRL',
    cotacaoUsada: rate,
    perAccount,
    errors: errors.length > 0 ? errors : undefined,
    totalAccounts: accountIds.length,
    activeAccounts: successful.length,
  }

  setCache(cacheKey, result)
  return result
}

export async function getCampaignInsights(opts = 'last_30d') {
  const cacheKey = buildCacheKey('meta_campaigns', opts)
  const cached = getCache(cacheKey)
  if (cached) return cached

  const accountIds = getAccountIds()
  const rate = await getUsdToBrl()
  const dateParams = buildDateParams(opts)
  const fields = [
    'campaign_name', 'campaign_id',
    'spend', 'impressions', 'reach', 'clicks',
    'ctr', 'cpc', 'actions', 'purchase_roas',
    'cost_per_action_type',
  ].join(',')

  // Buscar campanhas de todas as contas
  const results = await Promise.allSettled(
    accountIds.map(async (accountId) => {
      const data = await metaFetch(`/${accountId}/insights`, {
        fields,
        ...dateParams,
        level: 'campaign',
        limit: '50',
      })
      const accountName = ACCOUNT_NAMES[accountId] || accountId
      return (data.data || []).map(c => {
        const spendUsd = parseFloat(c.spend || 0)
        const cpaUsd = parseFloat(c.cost_per_action_type?.find(a => a.action_type === 'purchase')?.value || 0)
        return {
          id: c.campaign_id,
          nome: c.campaign_name,
          conta: accountName,
          plataforma: 'Meta Ads',
          investido: convertUsdToBrl(spendUsd, rate),
          impressoes: parseInt(c.impressions || 0),
          alcance: parseInt(c.reach || 0),
          cliques: parseInt(c.clicks || 0),
          ctr: parseFloat(c.ctr || 0),
          roas: parseFloat(c.purchase_roas?.[0]?.value || 0),
          conversoes: parseInt(c.actions?.find(a => a.action_type === 'purchase')?.value || 0),
          cpa: convertUsdToBrl(cpaUsd, rate),
          receita: 0,
          status: 'ativa',
        }
      })
    })
  )

  const campaigns = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)

  // Calcular receita (investido * roas)
  campaigns.forEach(c => {
    c.receita = Math.round(c.investido * c.roas * 100) / 100
  })

  // Ordenar por gasto (maior primeiro)
  campaigns.sort((a, b) => b.investido - a.investido)

  setCache(cacheKey, campaigns)
  return campaigns
}

export async function getDailyInsights(opts = 'last_7d') {
  const cacheKey = buildCacheKey('meta_daily', opts)
  const cached = getCache(cacheKey)
  if (cached) return cached

  const accountIds = getAccountIds()
  const rate = await getUsdToBrl()
  const dateParams = buildDateParams(opts)

  const results = await Promise.allSettled(
    accountIds.map(async (accountId) => {
      const data = await metaFetch(`/${accountId}/insights`, {
        fields: 'spend,impressions,reach,clicks',
        ...dateParams,
        level: 'account',
        time_increment: '1',
      })
      return data.data || []
    })
  )

  // Agregar por data
  const dayMap = {}

  results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .forEach(d => {
      const key = d.date_start
      if (!dayMap[key]) {
        dayMap[key] = { data: key, gastos: 0, impressoes: 0, alcance: 0, cliques: 0 }
      }
      dayMap[key].gastos += convertUsdToBrl(parseFloat(d.spend || 0), rate)
      dayMap[key].impressoes += parseInt(d.impressions || 0)
      dayMap[key].alcance += parseInt(d.reach || 0)
      dayMap[key].cliques += parseInt(d.clicks || 0)
    })

  const daily = Object.values(dayMap).sort((a, b) => a.data.localeCompare(b.data))

  setCache(cacheKey, daily)
  return daily
}
