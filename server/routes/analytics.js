import { Router } from 'express'
import { getFunnelAnalytics, getCreativeAnalytics, getAvailableAccounts } from '../services/analytics.js'

const router = Router()

// GET /api/analytics/funnel?period=this_month&platform=todas&conta=todas
router.get('/funnel', (req, res) => {
  const { period, since, until, platform, conta } = req.query
  const dateOpts = since && until ? { since, until } : { period: period || 'this_month' }
  const data = getFunnelAnalytics({ dateOpts, platform: platform || 'todas', conta: conta || 'todas' })
  res.json({ success: true, data })
})

// GET /api/analytics/creatives?period=this_month&platform=todas&conta=todas
router.get('/creatives', (req, res) => {
  const { period, since, until, platform, conta } = req.query
  const dateOpts = since && until ? { since, until } : { period: period || 'this_month' }
  const data = getCreativeAnalytics({ dateOpts, platform: platform || 'todas', conta: conta || 'todas' })
  res.json({ success: true, data })
})

// GET /api/analytics/accounts
router.get('/accounts', (req, res) => {
  const accounts = getAvailableAccounts()
  res.json({ success: true, data: accounts })
})

export default router
