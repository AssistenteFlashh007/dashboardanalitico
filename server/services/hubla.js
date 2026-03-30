// Hubla funciona via webhooks — armazenamos eventos em memória
// Documentação: https://hubla.gitbook.io/docs/webhooks/eventos-v2

const events = []
const MAX_EVENTS = 2000

export function addEvent(event) {
  events.unshift({
    ...event,
    receivedAt: new Date().toISOString(),
  })
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS
  }
}

export function getEvents(limit = 50) {
  return events.slice(0, limit)
}

export function validateToken(token) {
  const expectedToken = process.env.HUBLA_API_TOKEN
  if (!expectedToken) return true
  return token === expectedToken
}

export function getSalesSummary() {
  // Somente pagamentos confirmados (nao invoice.created que e pre-pagamento)
  const vendas = events.filter(e =>
    e.type === 'invoice.payment_succeeded' ||
    e.type === 'invoice.payment_confirmed'
  )

  const reembolsos = events.filter(e =>
    e.type === 'invoice.refunded' ||
    e.type === 'refund_request.accepted'
  )

  const totalReceita = vendas.reduce((sum, e) => {
    const valor = extractValue(e)
    return sum + valor
  }, 0)

  const totalReembolsos = reembolsos.reduce((sum, e) => {
    const valor = extractValue(e)
    return sum + valor
  }, 0)

  return {
    totalVendas: vendas.length,
    totalReembolsos: reembolsos.length,
    receita: totalReceita,
    reembolsos: totalReembolsos,
    receitaLiquida: totalReceita - totalReembolsos,
    totalEventos: events.length,
    transacoes: vendas.slice(0, 20).map(e => ({
      id: e.event?.invoice?.id || e.event?.subscription?.id || e.receivedAt,
      produto: e.event?.invoice?.product?.name ||
               e.event?.subscription?.product?.name ||
               e.event?.products?.[0]?.name ||
               'Produto Hubla',
      valor: extractValue(e),
      status: 'pago',
      data: e.event?.invoice?.paidAt ||
            e.event?.invoice?.createdAt ||
            e.event?.subscription?.activatedAt ||
            e.receivedAt,
      comprador: e.event?.invoice?.buyer?.name ||
                 e.event?.subscription?.subscriber?.name ||
                 e.event?.lead?.fullName ||
                 '',
      email: e.event?.invoice?.buyer?.email ||
             e.event?.subscription?.subscriber?.email ||
             e.event?.lead?.email ||
             '',
    })),
  }
}

function extractValue(event) {
  // Tentar diferentes caminhos onde o valor pode estar
  const paths = [
    event.event?.invoice?.amount,
    event.event?.invoice?.value,
    event.event?.invoice?.price,
    event.event?.subscription?.price,
    event.event?.smartInstallment?.amount,
    event.amount,
    event.value,
    event.price,
  ]

  for (const v of paths) {
    if (v != null && typeof v === 'object') {
      // Objeto com totalCents — sempre dividir por 100
      const cents = v.totalCents || v.subtotalCents || 0
      if (cents > 0) return cents / 100
    }
    if (v != null && typeof v !== 'object') {
      const num = typeof v === 'number' ? v : parseFloat(v)
      if (!isNaN(num) && num > 0) {
        return num
      }
    }
  }
  return 0
}
