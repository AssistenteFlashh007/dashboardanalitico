import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { fetchWebinarStats } from '../services/hotwebinar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const CONFIG_FILE = join(DATA_DIR, 'hotwebinar-config.json')

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return null
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) } catch { return null }
}

function saveConfig(config) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

const router = Router()

// GET /api/hotwebinar/stats?type=alunos|naoAlunos|ambos
router.get('/stats', async (req, res) => {
  const config = loadConfig()
  if (!config?.token) {
    return res.json({ success: false, error: 'Token nao configurado. Use POST /api/hotwebinar/config' })
  }

  const type = req.query.type || 'ambos'

  // Resolver datas do filtro
  let since = req.query.since
  let until = req.query.until
  const period = req.query.period || 'today'

  if (!since || !until) {
    const now = new Date()
    const brDate = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    if (period === 'today') {
      since = brDate
      until = brDate
    } else if (period === 'yesterday') {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      since = y.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      until = since
    } else if (period === 'this_month') {
      since = brDate.substring(0, 8) + '01'
      until = brDate
    } else if (period === 'last_7d') {
      const d = new Date(now); d.setDate(d.getDate() - 7)
      since = d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      until = brDate
    } else {
      // last_90d ou default: sem filtro de data
      since = null
      until = null
    }
  }

  try {
    const result = {}
    const errors = []
    const dateRange = since && until ? { since, until } : null

    if (type === 'alunos' || type === 'ambos') {
      if (config.webinarAlunos) {
        const stats = await fetchWebinarStats(config.webinarAlunos, config.token, dateRange)
        if (stats?.error) {
          errors.push(`Alunos: ${stats.message}`)
        } else {
          result.alunos = stats
        }
      }
    }

    if (type === 'naoAlunos' || type === 'ambos') {
      if (config.webinarNaoAlunos) {
        const stats = await fetchWebinarStats(config.webinarNaoAlunos, config.token, dateRange)
        if (stats?.error) {
          errors.push(`Nao Alunos: ${stats.message}`)
        } else {
          result.naoAlunos = stats
        }
      }
    }

    if (errors.length > 0 && !result.alunos && !result.naoAlunos) {
      return res.json({ success: false, error: errors.join(' | ') })
    }

    res.json({ success: true, data: result, warnings: errors.length > 0 ? errors : undefined })
  } catch (err) {
    console.error('[HotWebinar Route] Erro:', err.message)
    res.json({ success: false, error: err.message })
  }
})

// GET /api/hotwebinar/config - ver config atual (sem expor token completo)
router.get('/config', (req, res) => {
  const config = loadConfig()
  if (!config) return res.json({ success: true, data: null })
  res.json({
    success: true,
    data: {
      hasToken: !!config.token,
      webinarAlunos: config.webinarAlunos || null,
      webinarNaoAlunos: config.webinarNaoAlunos || null,
    }
  })
})

// POST /api/hotwebinar/config - salvar token e IDs
router.post('/config', (req, res) => {
  const { token, webinarAlunos, webinarNaoAlunos } = req.body
  const current = loadConfig() || {}

  const config = {
    ...current,
    token: token || current.token,
    webinarAlunos: webinarAlunos || current.webinarAlunos,
    webinarNaoAlunos: webinarNaoAlunos || current.webinarNaoAlunos,
    updatedAt: new Date().toISOString(),
  }

  saveConfig(config)
  console.log(`[HotWebinar] Config salva. Alunos: ${config.webinarAlunos} | NaoAlunos: ${config.webinarNaoAlunos}`)
  res.json({ success: true })
})

export default router
