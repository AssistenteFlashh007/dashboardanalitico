// Pagtrust é baseado em webhooks - armazenamos eventos em memória
const events = []
const MAX_EVENTS = 1000

export function addEvent(event) {
  events.unshift({
    ...event,
    receivedAt: new Date().toISOString(),
  })
  // Manter apenas os últimos MAX_EVENTS
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS
  }
}

export function getEvents(limit = 50) {
  return events.slice(0, limit)
}

export function getSalesSummary() {
  const vendas = events.filter(e =>
    e.status === 'approved' || e.status === 'aprovado' || e.type === 'purchase_approved'
  )
  const reembolsos = events.filter(e =>
    e.status === 'refunded' || e.status === 'reembolsado' || e.type === 'purchase_refunded'
  )

  const totalReceita = vendas.reduce((sum, e) => {
    const valor = e.purchase?.price || e.price || e.amount || e.valor || 0
    return sum + (typeof valor === 'number' ? valor : parseFloat(valor) || 0)
  }, 0)

  const totalReembolsos = reembolsos.reduce((sum, e) => {
    const valor = e.purchase?.price || e.price || e.amount || e.valor || 0
    return sum + (typeof valor === 'number' ? valor : parseFloat(valor) || 0)
  }, 0)

  return {
    totalVendas: vendas.length,
    totalReembolsos: reembolsos.length,
    receita: totalReceita,
    reembolsos: totalReembolsos,
    receitaLiquida: totalReceita - totalReembolsos,
    totalEventos: events.length,
    ultimasVendas: vendas.slice(0, 20).map(e => ({
      id: e.id || e.transaction_id || e.receivedAt,
      produto: e.product?.name || e.productName || e.produto || 'Produto',
      valor: e.purchase?.price || e.price || e.amount || e.valor || 0,
      data: e.purchase?.approved_date || e.approved_date || e.date || e.receivedAt,
      comprador: e.buyer?.name || e.buyerName || e.comprador || '',
      email: e.buyer?.email || e.buyerEmail || '',
    })),
  }
}

export function validateToken(token) {
  const expectedToken = process.env.PAGTRUST_WEBHOOK_TOKEN
  if (!expectedToken) return true // Se não configurou token, aceita tudo
  return token === expectedToken
}
