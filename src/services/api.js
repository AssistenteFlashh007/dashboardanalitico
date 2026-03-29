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
export async function fetchAttribution(opts) {
  return apiFetch(`/attribution?${buildDateQuery(opts)}`)
}
