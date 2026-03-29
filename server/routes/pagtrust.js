import { Router } from 'express'
import { addEvent, getEvents, getSalesSummary, validateToken } from '../services/pagtrust.js'

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
  console.log(`[Pagtrust Webhook] Evento recebido: ${event.type || event.status || 'desconhecido'}`)
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
