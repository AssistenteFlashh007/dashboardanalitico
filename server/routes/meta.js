import { Router } from 'express'
import { getAccountInsights, getCampaignInsights, getDailyInsights } from '../services/metaAds.js'

const router = Router()

function getDateOpts(query) {
  const { period, since, until } = query
  if (since && until) return { since, until }
  return { period: period || 'last_30d' }
}

// GET /api/meta/insights?period=last_30d  OU  ?since=2026-03-01&until=2026-03-28
router.get('/insights', async (req, res) => {
  try {
    const opts = getDateOpts(req.query)
    const data = await getAccountInsights(opts)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Meta Insights]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

// GET /api/meta/campaigns?period=last_30d  OU  ?since=2026-03-01&until=2026-03-28
router.get('/campaigns', async (req, res) => {
  try {
    const opts = getDateOpts(req.query)
    const data = await getCampaignInsights(opts)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Meta Campaigns]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

// GET /api/meta/daily?period=last_7d  OU  ?since=2026-03-01&until=2026-03-28
router.get('/daily', async (req, res) => {
  try {
    const opts = getDateOpts(req.query)
    const data = await getDailyInsights(opts)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Meta Daily]', error.message)
    res.status(error.message.includes('não configurado') ? 501 : 500)
      .json({ success: false, error: error.message })
  }
})

export default router
