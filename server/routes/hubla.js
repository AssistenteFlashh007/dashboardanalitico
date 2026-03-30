import { Router } from 'express'
import { addEvent, getEvents, getSalesSummary, validateToken } from '../services/hubla.js'
import { addSaleWithUtm, extractUtmFromHubla } from '../services/attribution.js'

const router = Router()

// POST /api/hubla/webhook — Recebe eventos da Hubla
router.post('/webhook', (req, res) => {
  // Hubla envia o token no header x-hubla-token
  const token = req.headers['x-hubla-token']
  if (!validateToken(token)) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const event = req.body
  if (!event || Object.keys(event).length === 0) {
    return res.status(400).json({ error: 'Payload vazio' })
  }

  addEvent(event)

  // Se for venda confirmada, salvar com UTM para atribuição
  const isSale = event.type === 'invoice.payment_succeeded' ||
                 event.type === 'invoice.payment_confirmed'
  if (isSale) {
    // Deduplicacao por invoice ID
    const invoiceId = event.event?.invoice?.id || ''
    if (invoiceId && global._hubla_dedup?.[invoiceId]) {
      console.log(`[Hubla Webhook] Venda duplicada ignorada: ${invoiceId}`)
    } else {
      if (!global._hubla_dedup) global._hubla_dedup = {}
      if (invoiceId) global._hubla_dedup[invoiceId] = true

    const utm = extractUtmFromHubla(event)

    // Valor: invoice.amount é objeto {totalCents, subtotalCents, ...}
    const rawAmount = event.event?.invoice?.amount
    let valor = 0
    if (rawAmount && typeof rawAmount === 'object') {
      valor = (rawAmount.totalCents || rawAmount.subtotalCents || 0) / 100
    } else if (typeof rawAmount === 'number') {
      valor = rawAmount > 1000 ? rawAmount / 100 : rawAmount
    }

    // Produto: está em event.event.product.name ou event.event.products[0].name
    const produto = event.event?.product?.name ||
                    event.event?.products?.[0]?.name ||
                    event.event?.invoice?.product?.name ||
                    'Produto Hubla'

    // Comprador: está em invoice.payer ou event.user
    const payer = event.event?.invoice?.payer || event.event?.user || {}
    const comprador = [payer.firstName, payer.lastName].filter(Boolean).join(' ') ||
                      payer.name || ''
    const email = payer.email || ''

    addSaleWithUtm({
      id: event.event?.invoice?.id || Date.now(),
      plataforma: 'Hubla',
      produto,
      valor,
      data: event.event?.invoice?.saleDate || event.event?.invoice?.statusAt || new Date().toISOString(),
      comprador,
      email,
      utm,
    })
    } // fim dedup else
  }

  const eventType = event.type || 'desconhecido'
  console.log(`[Hubla Webhook] Evento: ${eventType}${isSale ? ' (+ UTM salvo)' : ''}`)
  res.status(200).json({ received: true })
})

// GET /api/hubla/summary
router.get('/summary', (req, res) => {
  const summary = getSalesSummary()
  res.json({ success: true, data: summary })
})

// GET /api/hubla/events?limit=50
router.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const events = getEvents(limit)
  res.json({ success: true, data: events, total: events.length })
})

export default router
