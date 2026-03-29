const API_BASE = '/api'

async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (res.status === 501) return null // Serviço não configurado
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const json = await res.json()
    return json.success ? json.data : null
  } catch (error) {
    console.warn(`[API] ${endpoint}:`, error.message)
    return null
  }
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
export async function fetchMetaInsights(period = 'last_30d') {
  return apiFetch(`/meta/insights?period=${period}`)
}

export async function fetchMetaCampaigns(period = 'last_30d') {
  return apiFetch(`/meta/campaigns?period=${period}`)
}

export async function fetchMetaDaily(period = 'last_7d') {
  return apiFetch(`/meta/daily?period=${period}`)
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
export async function fetchAttribution(period = 'last_30d') {
  return apiFetch(`/attribution?period=${period}`)
}
