import { Router } from 'express'
import { addEvent, getEvents, getSalesSummary, validateToken } from '../services/hubla.js'

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
  const eventType = event.type || 'desconhecido'
  console.log(`[Hubla Webhook] Evento: ${eventType}`)
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
