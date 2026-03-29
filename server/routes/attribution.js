import { Router } from 'express'
import { buildAttribution, getAllSalesWithUtm } from '../services/attribution.js'
import { getCampaignInsights } from '../services/metaAds.js'

const router = Router()

// GET /api/attribution?period=last_30d  OU  ?since=2026-03-01&until=2026-03-28
router.get('/', async (req, res) => {
  try {
    const { period, since, until } = req.query
    const dateOpts = since && until ? { since, until } : { period: period || 'last_30d' }

    let metaCampaigns = null
    try {
      metaCampaigns = await getCampaignInsights(dateOpts)
    } catch (e) {
      console.warn('[Attribution] Meta campaigns not available:', e.message)
    }

    const data = buildAttribution(metaCampaigns, dateOpts)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Attribution]', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/sales', (req, res) => {
  const sales = getAllSalesWithUtm()
  res.json({ success: true, data: sales, total: sales.length })
})

export default router
