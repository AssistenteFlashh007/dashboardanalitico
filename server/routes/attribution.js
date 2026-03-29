import { Router } from 'express'
import { buildAttribution, getAllSalesWithUtm } from '../services/attribution.js'
import { getCampaignInsights } from '../services/metaAds.js'

const router = Router()

// GET /api/attribution?period=last_30d
router.get('/', async (req, res) => {
  try {
    const period = req.query.period || 'last_30d'

    // Buscar campanhas do Meta para cruzar
    let metaCampaigns = null
    try {
      metaCampaigns = await getCampaignInsights(period)
    } catch (e) {
      console.warn('[Attribution] Meta campaigns not available:', e.message)
    }

    const data = buildAttribution(metaCampaigns)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Attribution]', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/attribution/sales — Lista vendas com UTM
router.get('/sales', (req, res) => {
  const sales = getAllSalesWithUtm()
  res.json({ success: true, data: sales, total: sales.length })
})

export default router
