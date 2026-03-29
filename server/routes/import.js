import { Router } from 'express'
import { importCsv } from '../services/csvImport.js'

const router = Router()

// POST /api/import/csv — Importar CSV de vendas históricas
router.post('/csv', express_raw(), (req, res) => {
  try {
    const platform = req.query.platform || 'hubla'
    const csvContent = req.body

    if (!csvContent || csvContent.length === 0) {
      return res.status(400).json({ success: false, error: 'Envie o conteúdo do CSV no body' })
    }

    const result = importCsv(csvContent.toString('utf-8'), platform)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[CSV Import]', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

function express_raw() {
  return (req, res, next) => {
    if (req.headers['content-type']?.includes('text/csv') ||
        req.headers['content-type']?.includes('text/plain')) {
      let body = ''
      req.setEncoding('utf8')
      req.on('data', chunk => body += chunk)
      req.on('end', () => { req.body = body; next() })
    } else {
      next()
    }
  }
}

// POST /api/import/json — Importar vendas em JSON (alternativa)
router.post('/json', (req, res) => {
  try {
    const { sales, platform = 'hubla' } = req.body
    if (!sales || !Array.isArray(sales)) {
      return res.status(400).json({ success: false, error: 'Envie { sales: [...] }' })
    }

    const { addSaleWithUtm } = require('../services/attribution.js')
    let imported = 0
    for (const sale of sales) {
      addSaleWithUtm({
        id: sale.id || `json_${imported}`,
        plataforma: platform,
        produto: sale.produto || sale.product || 'Produto',
        valor: sale.valor || sale.value || sale.price || 0,
        data: sale.data || sale.date || new Date().toISOString(),
        comprador: sale.comprador || sale.buyer || '',
        utm: {
          utm_source: sale.utm_source || null,
          utm_medium: sale.utm_medium || null,
          utm_campaign: sale.utm_campaign || null,
          utm_content: sale.utm_content || null,
          utm_term: sale.utm_term || null,
        },
      })
      imported++
    }

    res.json({ success: true, data: { imported } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
