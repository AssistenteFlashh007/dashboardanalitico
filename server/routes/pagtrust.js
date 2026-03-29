import { Router } from 'express'
import { addEvent, getEvents, getSalesSummary, validateToken } from '../services/pagtrust.js'
import { addSaleWithUtm, extractUtmFromPagtrust } from '../services/attribution.js'

const router = Router()

// POST /api/pagtrust/webhook — Recebe eventos da Pagtrust
router.post('/webhook', (req, res) => {
  const token = req.headers['x-webhook-token'] || req.query.token
  if (!validateToken(token)) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const event = req.body
  if (!event || Object.keys(event).length === 0) {
    return res.status(400).json({ error: 'Payload vazio' })
  }

  addEvent(event)

  // Se for venda aprovada, salvar com UTM para atribuição
  const isSale = event.status === 'approved' || event.status === 'aprovado' || event.type === 'purchase_approved'
  if (isSale) {
    const utm = extractUtmFromPagtrust(event)
    addSaleWithUtm({
      id: event.id || event.transaction_id || Date.now(),
      plataforma: 'Pagtrust',
      produto: event.product?.name || event.productName || 'Produto Pagtrust',
      valor: event.purchase?.price || event.price || event.amount || event.valor || 0,
      data: event.purchase?.approved_date || event.approved_date || new Date().toISOString(),
      comprador: event.buyer?.name || event.buyerName || '',
      utm,
    })
  }

  console.log(`[Pagtrust Webhook] Evento: ${event.type || event.status || 'desconhecido'}${isSale ? ' (+ UTM salvo)' : ''}`)
  res.status(200).json({ received: true })
})

// GET /api/pagtrust/sales
router.get('/sales', (req, res) => {
  const summary = getSalesSummary()
  res.json({ success: true, data: summary })
})

// GET /api/pagtrust/events?limit=50
router.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const events = getEvents(limit)
  res.json({ success: true, data: events, total: events.length })
})

export default router
