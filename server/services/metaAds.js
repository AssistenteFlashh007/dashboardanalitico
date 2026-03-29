import { getCache, setCache } from '../utils/cache.js'

const GRAPH_API = 'https://graph.facebook.com/v21.0'

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

export async function getAccountInsights(datePreset = 'last_30d') {
  const cacheKey = `meta_insights_${datePreset}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!accountId) throw new Error('META_AD_ACCOUNT_ID não configurado')

  const data = await metaFetch(`/${accountId}/insights`, {
    fields: [
      'spend', 'impressions', 'reach', 'clicks',
      'ctr', 'cpc', 'cpm', 'actions',
      'cost_per_action_type', 'purchase_roas',
    ].join(','),
    date_preset: datePreset,
    level: 'account',
  })

  const insights = data.data?.[0] || {}

  const result = {
    spend: parseFloat(insights.spend || 0),
    impressions: parseInt(insights.impressions || 0),
    reach: parseInt(insights.reach || 0),
    clicks: parseInt(insights.clicks || 0),
    ctr: parseFloat(insights.ctr || 0),
    cpc: parseFloat(insights.cpc || 0),
    cpm: parseFloat(insights.cpm || 0),
    roas: parseFloat(insights.purchase_roas?.[0]?.value || 0),
    conversions: 0,
    cpa: 0,
  }

  // Extrair conversões e CPA das actions
  const purchaseAction = insights.actions?.find(a => a.action_type === 'purchase')
  if (purchaseAction) {
    result.conversions = parseInt(purchaseAction.value || 0)
  }
  const cpaAction = insights.cost_per_action_type?.find(a => a.action_type === 'purchase')
  if (cpaAction) {
    result.cpa = parseFloat(cpaAction.value || 0)
  }

  setCache(cacheKey, result)
  return result
}

export async function getCampaignInsights(datePreset = 'last_30d') {
  const cacheKey = `meta_campaigns_${datePreset}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!accountId) throw new Error('META_AD_ACCOUNT_ID não configurado')

  const data = await metaFetch(`/${accountId}/insights`, {
    fields: [
      'campaign_name', 'campaign_id',
      'spend', 'impressions', 'reach', 'clicks',
      'ctr', 'cpc', 'actions', 'purchase_roas',
      'cost_per_action_type',
    ].join(','),
    date_preset: datePreset,
    level: 'campaign',
    limit: '50',
  })

  const campaigns = (data.data || []).map(c => ({
    id: c.campaign_id,
    nome: c.campaign_name,
    plataforma: 'Meta Ads',
    investido: parseFloat(c.spend || 0),
    impressoes: parseInt(c.impressions || 0),
    alcance: parseInt(c.reach || 0),
    cliques: parseInt(c.clicks || 0),
    ctr: parseFloat(c.ctr || 0),
    roas: parseFloat(c.purchase_roas?.[0]?.value || 0),
    conversoes: parseInt(c.actions?.find(a => a.action_type === 'purchase')?.value || 0),
    cpa: parseFloat(c.cost_per_action_type?.find(a => a.action_type === 'purchase')?.value || 0),
    receita: 0,
    status: 'ativa',
  }))

  // Calcular receita (investido * roas)
  campaigns.forEach(c => {
    c.receita = Math.round(c.investido * c.roas * 100) / 100
  })

  setCache(cacheKey, campaigns)
  return campaigns
}

export async function getDailyInsights(datePreset = 'last_7d') {
  const cacheKey = `meta_daily_${datePreset}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!accountId) throw new Error('META_AD_ACCOUNT_ID não configurado')

  const data = await metaFetch(`/${accountId}/insights`, {
    fields: 'spend,impressions,reach,clicks',
    date_preset: datePreset,
    level: 'account',
    time_increment: '1',
  })

  const daily = (data.data || []).map(d => ({
    data: d.date_start,
    gastos: parseFloat(d.spend || 0),
    impressoes: parseInt(d.impressions || 0),
    alcance: parseInt(d.reach || 0),
    cliques: parseInt(d.clicks || 0),
  }))

  setCache(cacheKey, daily)
  return daily
}
