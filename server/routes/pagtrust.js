import { Router } from 'express'
import { addEvent, getEvents, getSalesSummary, validateToken } from '../services/pagtrust.js'
import { addSaleWithUtm } from '../services/attribution.js'

const router = Router()

// POST /api/pagtrust/webhook — Recebe eventos da Pagtrust V2
router.post('/webhook', (req, res) => {
  // Pagtrust envia token em varios lugares
  const token = req.headers['x-webhook-token'] ||
                req.headers['x-pagtrust-token'] ||
                req.headers['authorization']?.replace('Bearer ', '') ||
                req.query.token ||
                req.body?.token

  // Log de debug
  console.log(`[Pagtrust Webhook] Request recebido! Token: ${token || 'nenhum'} | Body keys: ${Object.keys(req.body || {}).join(',')}`)

  // TODO: reativar validacao quando confirmar formato do token
  // if (!validateToken(token)) {
  //   return res.status(401).json({ error: 'Token invalido' })
  // }

  const event = req.body
  if (!event || Object.keys(event).length === 0) {
    return res.status(400).json({ error: 'Payload vazio' })
  }

  addEvent(event)

  // Pagtrust V2: dados em event.data
  const d = event.data || event
  const purchaseData = d.purchase || event.purchase || {}
  const eventType = String(event.event || event.type || '').toUpperCase()

  // SOMENTE PURCHASE_APPROVED conta como venda paga
  const isSale = eventType === 'PURCHASE_APPROVED'

  if (isSale) {
    try {
      const saleId = event.id || purchaseData.transaction || ''
      const prodName = d.product?.name || ''
      const dedupKey = `${saleId}_${prodName}`

      // Dedup em memoria
      if (!global._pagtrust_dedup) global._pagtrust_dedup = {}
      if (saleId && global._pagtrust_dedup[dedupKey]) {
        console.log(`[Pagtrust Webhook] Venda duplicada ignorada: ${dedupKey}`)
      } else {
        if (saleId) global._pagtrust_dedup[dedupKey] = true

        const origin = purchaseData.origin || d.origin || {}
        const utm = {
          utm_source: origin.utmsource || origin.utm_source || origin.src || null,
          utm_medium: origin.utmmedium ? String(origin.utmmedium).split('|')[0].trim() : null,
          utm_campaign: origin.utmcampaign ? String(origin.utmcampaign).split('|')[0].trim() : null,
          utm_content: origin.content ? String(origin.content).split('|')[0].trim() : null,
          utm_term: origin.term || null,
          fbclid: origin.fbclid || null,
          fbp: null,
          gclid: origin.gclid || null,
        }

        // Preco: usar price.price (comissao/liquido) em vez de full_price.value (bruto)
        const priceAlt = purchaseData.price || {}
        const priceObj = purchaseData.full_price || {}
        const valor = priceAlt.price || priceAlt.value || priceObj.value || 0

        const buyer = d.buyer || event.buyer || {}
        const checkout = purchaseData.checkout || {}
        const funnel = purchaseData.funnel || {}
        const offer = purchaseData.offer || {}
        const isOB = purchaseData.order_bump?.is_order_bump || false
        const isUpsell = purchaseData.upsell?.is_upsell || false

        addSaleWithUtm({
          id: saleId || Date.now().toString(),
          plataforma: 'Pagtrust',
          produto: prodName || 'Produto Pagtrust',
          valor: typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.')) || 0,
          data: purchaseData.approved_date ? new Date(purchaseData.approved_date).toISOString() : new Date().toISOString(),
          comprador: buyer.name || '',
          email: buyer.email || '',
          utm,
          orderbump: isOB,
          upsell: isUpsell,
          checkout: checkout.name || null,
          funil: funnel.name || null,
          oferta: offer.name || null,
          metodo_pagamento: purchaseData.payment?.type || null,
        })
      }
    } catch (err) {
      console.error(`[Pagtrust Webhook] ERRO ao salvar venda:`, err.message)
    }
  }

  console.log(`[Pagtrust Webhook] Evento: ${eventType || 'desconhecido'}${isSale ? ' (+ UTM salvo)' : ''}`)
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
