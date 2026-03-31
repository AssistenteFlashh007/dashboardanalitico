import { Router } from 'express'
import { getFunnelAnalytics, getCreativeAnalytics, getAvailableAccounts, getPreviousPeriod } from '../services/analytics.js'

const router = Router()

// GET /api/analytics/funnel?period=this_month&platform=todas&conta=todas
router.get('/funnel', async (req, res) => {
  try {
    const { period, since, until, platform, conta, compare } = req.query
    const dateOpts = since && until ? { since, until } : { period: period || 'this_month' }
    const baseOpts = { dateOpts, platform: platform || 'todas', conta: conta || 'todas' }
    const data = await getFunnelAnalytics(baseOpts)

    let prev = null
    if (compare === 'true') {
      const prevPeriod = getPreviousPeriod(dateOpts)
      if (prevPeriod) {
        prev = await getFunnelAnalytics({ ...baseOpts, dateOpts: prevPeriod })
      }
    }

    res.json({ success: true, data, prev })
  } catch (error) {
    console.error('[Funnel Analytics]', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/analytics/creatives?period=this_month&platform=todas&conta=todas
router.get('/creatives', async (req, res) => {
  try {
    const { period, since, until, platform, conta } = req.query
    const dateOpts = since && until ? { since, until } : { period: period || 'this_month' }
    const data = await getCreativeAnalytics({ dateOpts, platform: platform || 'todas', conta: conta || 'todas' })
    res.json({ success: true, data })
  } catch (error) {
    console.error('[Creative Analytics]', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/analytics/accounts
router.get('/accounts', (req, res) => {
  const accounts = getAvailableAccounts()
  res.json({ success: true, data: accounts })
})

export default router
