import { Router } from 'express'
import { addEvent, getEvents, getSalesSummary, validateToken } from '../services/pagtrust.js'
import { addSaleWithUtm, extractUtmFromPagtrust } from '../services/attribution.js'

const router = Router()

// POST /api/pagtrust/webhook — Recebe eventos da Pagtrust
router.post('/webhook', (req, res) => {
  // Pagtrust pode enviar token em vários lugares
  const token = req.headers['x-webhook-token'] ||
                req.headers['x-pagtrust-token'] ||
                req.headers['authorization']?.replace('Bearer ', '') ||
                req.query.token ||
                req.body?.token

  if (!validateToken(token)) {
    // Log pra debug - ajuda a entender porque nao esta recebendo
    console.log(`[Pagtrust Webhook] Token REJEITADO. Recebido: ${token || 'nenhum'}`)
    console.log(`[Pagtrust Webhook] Headers:`, JSON.stringify(req.headers).substring(0, 300))
    return res.status(401).json({ error: 'Token inválido' })
  }

  const event = req.body
  if (!event || Object.keys(event).length === 0) {
    return res.status(400).json({ error: 'Payload vazio' })
  }

  addEvent(event)

  // Pagtrust V2 pode enviar status como string em português ou inglês
  const status = (event.status || event.purchase?.status || '').toLowerCase()
  const type = (event.type || '').toLowerCase()
  const isSale = status === 'approved' || status === 'aprovado' ||
                 type === 'purchase_approved' || type === 'approved' ||
                 status === 'paid' || status === 'pago'

  if (isSale) {
    const utm = extractUtmFromPagtrust(event)

    // Pagtrust V2 pode ter estruturas diferentes
    const produto = event.product?.name || event.productName || event.produto ||
                    event.purchase?.product?.name || event.items?.[0]?.name || 'Produto Pagtrust'
    const valor = event.purchase?.price || event.price || event.amount || event.valor ||
                  event.purchase?.amount || event.items?.[0]?.price || 0
    const comprador = event.buyer?.name || event.buyerName || event.comprador ||
                      event.customer?.name || ''
    const email = event.buyer?.email || event.buyerEmail ||
                  event.customer?.email || ''

    addSaleWithUtm({
      id: event.id || event.transaction_id || event.purchase?.id || Date.now(),
      plataforma: 'Pagtrust',
      produto,
      valor: typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.')) || 0,
      data: event.purchase?.approved_date || event.approved_date || event.date || new Date().toISOString(),
      comprador,
      email,
      utm,
    })
  }

  console.log(`[Pagtrust Webhook] Evento: ${event.type || status || 'desconhecido'}${isSale ? ' (+ UTM salvo)' : ''}`)
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
