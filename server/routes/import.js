import { Router } from 'express'
import { importCsv, importXlsx } from '../services/csvImport.js'
import { clearSales } from '../services/attribution.js'

const router = Router()

// Middleware para receber raw body (CSV ou XLSX)
function rawBody(req, res, next) {
  const chunks = []
  req.on('data', chunk => chunks.push(chunk))
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks)
    next()
  })
}

// POST /api/import/csv — Importar CSV de vendas
router.post('/csv', rawBody, (req, res) => {
  try {
    const platform = req.query.platform || 'pagtrust'
    const content = req.rawBody

    if (!content || content.length === 0) {
      return res.status(400).json({ success: false, error: 'Envie o conteúdo do CSV' })
    }

    const result = importCsv(content.toString('utf-8'), platform)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[CSV Import]', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/import/xlsx — Importar Excel de vendas
router.post('/xlsx', rawBody, (req, res) => {
  try {
    const platform = req.query.platform || 'hubla'
    const content = req.rawBody

    if (!content || content.length === 0) {
      return res.status(400).json({ success: false, error: 'Envie o arquivo XLSX' })
    }

    const result = importXlsx(content, platform)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[XLSX Import]', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/import/clear — Limpar todos os dados de vendas
router.delete('/clear', (req, res) => {
  clearSales()
  console.log('[Import] Todos os dados de vendas foram limpos')
  res.json({ success: true, message: 'Dados limpos' })
})

export default router
