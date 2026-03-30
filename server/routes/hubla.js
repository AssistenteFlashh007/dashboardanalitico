import { Router } from 'express'
import { addEvent, getEvents, getSalesSummary, validateToken } from '../services/hubla.js'
import { addSaleWithUtm, extractUtmFromHubla } from '../services/attribution.js'

const router = Router()

// POST /api/hubla/webhook — Recebe eventos da Hubla
router.post('/webhook', (req, res) => {
  const token = req.headers['x-hubla-token']
  if (!validateToken(token)) {
    return res.status(401).json({ error: 'Token invalido' })
  }

  const event = req.body
  if (!event || Object.keys(event).length === 0) {
    return res.status(400).json({ error: 'Payload vazio' })
  }

  addEvent(event)

  // Somente payment_succeeded conta como venda
  // (payment_confirmed pode duplicar a mesma venda)
  const isSale = event.type === 'invoice.payment_succeeded'

  if (isSale) {
    try {
      const invoiceId = event.event?.invoice?.id || ''

      // Dedup em memoria
      if (!global._hubla_dedup) global._hubla_dedup = {}
      if (invoiceId && global._hubla_dedup[invoiceId]) {
        console.log(`[Hubla Webhook] Venda duplicada ignorada: ${invoiceId}`)
      } else {
        if (invoiceId) global._hubla_dedup[invoiceId] = true

        const utm = extractUtmFromHubla(event)

        // Valor: usar comissao do seller (receivers) em vez do bruto
        const receivers = event.event?.invoice?.receivers || []
        const seller = receivers.find(r => r.role === 'seller')
        let valor = 0
        if (seller?.totalCents) {
          valor = seller.totalCents / 100
        } else {
          // Fallback pro bruto se nao achar seller
          const rawAmount = event.event?.invoice?.amount
          if (rawAmount && typeof rawAmount === 'object') {
            valor = (rawAmount.totalCents || rawAmount.subtotalCents || 0) / 100
          } else if (typeof rawAmount === 'number') {
            valor = rawAmount / 100
          }
        }

        // Produto
        const produto = event.event?.product?.name ||
                        event.event?.products?.[0]?.name ||
                        'Produto Hubla'

        // Comprador
        const payer = event.event?.invoice?.payer || event.event?.user || {}
        const comprador = [payer.firstName, payer.lastName].filter(Boolean).join(' ') ||
                          payer.name || ''
        const email = payer.email || ''

        addSaleWithUtm({
          id: invoiceId || Date.now().toString(),
          plataforma: 'Hubla',
          produto,
          valor,
          data: event.event?.invoice?.saleDate || event.event?.invoice?.statusAt || new Date().toISOString(),
          comprador,
          email,
          utm,
        })
      }
    } catch (err) {
      console.error(`[Hubla Webhook] ERRO ao salvar venda:`, err.message)
    }
  }

  const eventType = event.type || 'desconhecido'
  const saved = isSale ? ' (+ UTM salvo)' : ''
  console.log(`[Hubla Webhook] Evento: ${eventType}${saved}`)
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
