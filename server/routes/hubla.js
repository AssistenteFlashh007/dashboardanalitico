import { Router } from 'express'
import { getSales, getSalesSummary } from '../services/hubla.js'

const router = Router()

// GET /api/hubla/sales?page=1&status=4
router.get('/sales', async (req, res) => {
  try {
    const { page = 1, status = '4' } = req.query
    const data = await getSales(page, status)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Hubla Sales]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

// GET /api/hubla/summary
router.get('/summary', async (req, res) => {
  try {
    const data = await getSalesSummary()
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Hubla Summary]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

export default router
