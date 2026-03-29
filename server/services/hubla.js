import { getCache, setCache } from '../utils/cache.js'

const HUBLA_API = 'https://api.hub.la'

async function hublaFetch(endpoint, params = {}) {
  const token = process.env.HUBLA_API_TOKEN
  if (!token) throw new Error('HUBLA_API_TOKEN não configurado')

  const url = new URL(`${HUBLA_API}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Hubla API error: ${res.status}`)
  }
  return res.json()
}

export async function getSales(page = 1, status = '4') {
  const cacheKey = `hubla_sales_${page}_${status}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  // Status: 1=pendente, 2=recusado, 3=cancelado, 4=pago, 5=reembolsado, 6=chargeback
  const data = await hublaFetch('/2.0/transactions', {
    page: String(page),
    status,
  })

  setCache(cacheKey, data)
  return data
}

export async function getSalesSummary() {
  const cacheKey = 'hubla_summary'
  const cached = getCache(cacheKey)
  if (cached) return cached

  // Buscar vendas aprovadas
  const approved = await getSales(1, '4')
  // Buscar reembolsos
  const refunded = await getSales(1, '5')

  const transactions = approved.data || approved.items || approved || []
  const refunds = refunded.data || refunded.items || refunded || []

  const transactionList = Array.isArray(transactions) ? transactions : []
  const refundList = Array.isArray(refunds) ? refunds : []

  const totalReceita = transactionList.reduce((sum, t) => {
    const valor = t.amount || t.value || t.price || 0
    return sum + (typeof valor === 'number' ? valor : parseFloat(valor) || 0)
  }, 0)

  const totalReembolsos = refundList.reduce((sum, t) => {
    const valor = t.amount || t.value || t.price || 0
    return sum + (typeof valor === 'number' ? valor : parseFloat(valor) || 0)
  }, 0)

  const summary = {
    totalVendas: transactionList.length,
    totalReembolsos: refundList.length,
    receita: totalReceita / 100, // Hubla geralmente retorna em centavos
    reembolsos: totalReembolsos / 100,
    receitaLiquida: (totalReceita - totalReembolsos) / 100,
    transacoes: transactionList.slice(0, 20).map(t => ({
      id: t.id || t.transaction_id,
      produto: t.product?.name || t.productName || t.product_name || 'Produto',
      valor: (t.amount || t.value || t.price || 0) / 100,
      status: t.status,
      data: t.created_at || t.createdAt || t.date,
      comprador: t.buyer?.name || t.buyerName || t.buyer_name || '',
      email: t.buyer?.email || t.buyerEmail || t.buyer_email || '',
    })),
  }

  setCache(cacheKey, summary)
  return summary
}
