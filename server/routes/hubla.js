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
    const utm = extractUtmFromHubla(event)
    // Extrair valor — pode ser número (centavos) ou objeto {totalCents}
    const rawAmount = event.event?.invoice?.amount
    let valor = 0
    if (typeof rawAmount === 'number') {
      valor = rawAmount > 1000 ? rawAmount / 100 : rawAmount
    } else if (rawAmount && typeof rawAmount === 'object') {
      valor = (rawAmount.totalCents || rawAmount.subtotalCents || 0) / 100
    }

    addSaleWithUtm({
      id: event.event?.invoice?.id || Date.now(),
      plataforma: 'Hubla',
      produto: event.event?.invoice?.product?.name || event.event?.invoice?.offer?.name || 'Produto Hubla',
      valor,
      data: event.event?.invoice?.paidAt || new Date().toISOString(),
      comprador: event.event?.invoice?.buyer?.name || event.event?.invoice?.customer?.name || '',
      utm,
    })
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
