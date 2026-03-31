const API_BASE = '/api'

async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (res.status === 501) return null
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const json = await res.json()
    return json.success ? json.data : null
  } catch (error) {
    console.warn(`[API] ${endpoint}:`, error.message)
    return null
  }
}

function buildDateQuery(opts) {
  if (!opts) return 'period=last_30d'
  const { preset, since, until } = typeof opts === 'string' ? { preset: opts } : opts
  if (since && until) return `since=${since}&until=${until}`
  return `period=${preset || 'last_30d'}`
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Meta Ads
export async function fetchMetaInsights(opts) {
  return apiFetch(`/meta/insights?${buildDateQuery(opts)}`)
}

export async function fetchMetaCampaigns(opts) {
  return apiFetch(`/meta/campaigns?${buildDateQuery(opts)}`)
}

export async function fetchMetaDaily(opts) {
  return apiFetch(`/meta/daily?${buildDateQuery(opts)}`)
}

// Hubla
export async function fetchHublaSummary() {
  return apiFetch('/hubla/summary')
}

// Pagtrust
export async function fetchPagtrustSales() {
  return apiFetch('/pagtrust/sales')
}

// Atribuição UTM
export async function fetchAttribution(opts, platform = 'todas') {
  const platformParam = platform !== 'todas' ? `&platform=${platform}` : ''
  return apiFetch(`/attribution?${buildDateQuery(opts)}${platformParam}`)
}

// Analytics
export async function fetchFunnelAnalytics(opts, platform = 'todas', conta = 'todas', compare = false) {
  const p = platform !== 'todas' ? `&platform=${platform}` : ''
  const c = conta !== 'todas' ? `&conta=${conta}` : ''
  const cmp = compare ? '&compare=true' : ''
  if (compare) {
    // Retornar { data, prev } quando comparando
    try {
      const res = await fetch(`${API_BASE}/analytics/funnel?${buildDateQuery(opts)}${p}${c}${cmp}`)
      if (!res.ok) return { data: null, prev: null }
      const json = await res.json()
      return { data: json.success ? json.data : null, prev: json.prev || null }
    } catch {
      return { data: null, prev: null }
    }
  }
  return apiFetch(`/analytics/funnel?${buildDateQuery(opts)}${p}${c}`)
}

export async function fetchCreativeAnalytics(opts, platform = 'todas', conta = 'todas') {
  const p = platform !== 'todas' ? `&platform=${platform}` : ''
  const c = conta !== 'todas' ? `&conta=${conta}` : ''
  return apiFetch(`/analytics/creatives?${buildDateQuery(opts)}${p}${c}`)
}

export async function fetchAccounts() {
  return apiFetch('/analytics/accounts')
}
