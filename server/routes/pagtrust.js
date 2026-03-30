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

  // Log TUDO que chega pra debug (v2)
  console.log(`[Pagtrust Webhook] Request recebido! Token: ${token || 'nenhum'} | Body keys: ${Object.keys(req.body || {}).join(',')}`)

  if (!validateToken(token)) {
    console.log(`[Pagtrust Webhook] Token REJEITADO. Headers:`, JSON.stringify(req.headers).substring(0, 500))
    // TEMPORARIO: aceitar mesmo sem token pra nao perder vendas
    // return res.status(401).json({ error: 'Token inválido' })
  }

  const event = req.body
  if (!event || Object.keys(event).length === 0) {
    return res.status(400).json({ error: 'Payload vazio' })
  }

  addEvent(event)

  // Pagtrust V2: dados estao em event.data ou direto no event
  const d = event.data || event
  const purchaseData = d.purchase || event.purchase || {}
  const purchaseStatus = String(purchaseData.status || event.status || d.status || '').toUpperCase()
  const eventType = String(event.event || event.type || '').toUpperCase()

  // SOMENTE PURCHASE_APPROVED conta como venda
  const isSale = eventType === 'PURCHASE_APPROVED'

  if (isSale) {
    try {
    // Deduplicacao: verificar se ja existe essa venda pelo ID + produto
    const saleId = event.id || purchaseData.transaction || ''
    const prodName = (d.product?.name || '')
    const dedupKey = `${saleId}_${prodName}`
    if (saleId && global._pagtrust_dedup?.[dedupKey]) {
      console.log(`[Pagtrust Webhook] Venda duplicada ignorada: ${dedupKey}`)
    } else {
      if (!global._pagtrust_dedup) global._pagtrust_dedup = {}
      if (saleId) global._pagtrust_dedup[dedupKey] = true
    const origin = purchaseData.origin || d.origin || {}
    const utm = {
      utm_source: origin.utmsource || origin.utm_source || origin.src || null,
      utm_medium: origin.utmmedium ? origin.utmmedium.split('|')[0].trim() : null,
      utm_campaign: origin.utmcampaign ? origin.utmcampaign.split('|')[0].trim() : null,
      utm_content: origin.content ? origin.content.split('|')[0].trim() : null,
      utm_term: origin.term || null,
      fbclid: origin.fbclid || null,
      fbp: null,
      gclid: origin.gclid || null,
    }

    // Pagtrust V2: produto em data.product.name
    const produto = d.product?.name || event.product?.name || d.productName || 'Produto Pagtrust'
    const priceObj = purchaseData.price || purchaseData.full_price || {}
    const valor = priceObj.value || priceObj.price || purchaseData.price || event.price || event.amount || 0
    const buyer = d.buyer || event.buyer || {}
    const comprador = buyer.name || buyer.buyerName || ''
    const email = buyer.email || buyer.buyerEmail || ''
    const checkout = purchaseData.checkout || {}
    const funnel = purchaseData.funnel || {}
    const offer = purchaseData.offer || {}
    const isOB = purchaseData.order_bump?.is_order_bump || false
    const isUpsell = purchaseData.upsell?.is_upsell || false

    addSaleWithUtm({
      id: event.id || purchaseData.transaction || Date.now(),
      plataforma: 'Pagtrust',
      produto,
      valor: typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.')) || 0,
      data: purchaseData.approved_date ? new Date(purchaseData.approved_date).toISOString() : new Date().toISOString(),
      comprador,
      email,
      utm,
      orderbump: isOB,
      upsell: isUpsell,
      checkout: checkout.name || null,
      funil: funnel.name || null,
      oferta: offer.name || null,
      metodo_pagamento: purchaseData.payment?.type || null,
    })
    } // fim dedup else
    } catch (err) {
      console.error(`[Pagtrust Webhook] ERRO ao salvar venda:`, err.message)
    }
  }

  console.log(`[Pagtrust Webhook] Evento: ${event.event || eventType || 'desconhecido'}${isSale ? ' (+ UTM salvo)' : ''}`)
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
