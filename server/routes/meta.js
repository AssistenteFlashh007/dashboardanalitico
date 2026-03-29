import { Router } from 'express'
import { getAccountInsights, getCampaignInsights, getDailyInsights } from '../services/metaAds.js'

const router = Router()

// GET /api/meta/insights?period=last_30d
router.get('/insights', async (req, res) => {
  try {
    const period = req.query.period || 'last_30d'
    const data = await getAccountInsights(period)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Meta Insights]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

// GET /api/meta/campaigns?period=last_30d
router.get('/campaigns', async (req, res) => {
  try {
    const period = req.query.period || 'last_30d'
    const data = await getCampaignInsights(period)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Meta Campaigns]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

// GET /api/meta/daily?period=last_7d
router.get('/daily', async (req, res) => {
  try {
    const period = req.query.period || 'last_7d'
    const data = await getDailyInsights(period)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Meta Daily]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

export default router
