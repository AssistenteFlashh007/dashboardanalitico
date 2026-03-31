import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getAllSalesWithUtm } from '../services/attribution.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'webinario.json')

function loadData() {
  if (!existsSync(DATA_FILE)) return null
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) } catch { return null }
}

function saveData(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

const router = Router()

// GET /api/webinario - carregar dados
router.get('/', (req, res) => {
  const data = loadData()
  res.json({ success: true, data })
})

// POST /api/webinario - salvar dados
router.post('/', (req, res) => {
  const data = req.body
  if (!data) return res.status(400).json({ error: 'Dados vazios' })
  data.updatedAt = new Date().toISOString()
  saveData(data)
  res.json({ success: true, data })
})

// GET /api/webinario/vendas - vendas reais do webnario (produto Maquina de Salarios + UTM webnario)
router.get('/vendas', (req, res) => {
  try {
    const allSales = getAllSalesWithUtm()

    // Filtrar: produto "Maquina de Salarios" com UTM contendo "webnario"
    let filtered = allSales.filter(s => {
      const produto = (s.produto || '').toLowerCase()
      const hasProduto = produto.includes('maquina de sal') || produto.includes('máquina de sal')
      if (!hasProduto) return false

      const utm = s.utm || {}
      const utmStr = [utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content, utm.utm_term]
        .filter(Boolean).join(' ').toLowerCase()
      return utmStr.includes('webnario') || utmStr.includes('webinario')
    })

    // Filtro de datas
    let since = req.query.since
    let until = req.query.until
    const period = req.query.period || 'today'

    if (!since || !until) {
      const now = new Date()
      const brDate = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      if (period === 'today') {
        since = brDate; until = brDate
      } else if (period === 'yesterday') {
        const y = new Date(now); y.setDate(y.getDate() - 1)
        since = y.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); until = since
      } else if (period === 'this_month') {
        since = brDate.substring(0, 8) + '01'; until = brDate
      } else if (period === 'last_7d') {
        const d = new Date(now); d.setDate(d.getDate() - 7)
        since = d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); until = brDate
      } else if (period === 'last_90d') {
        since = null; until = null
      }
    }

    if (since && until) {
      filtered = filtered.filter(s => {
        const d = new Date(s.data)
        d.setHours(d.getHours() - 3)
        const dateBR = d.toISOString().split('T')[0]
        return dateBR >= since && dateBR <= until
      })
    }

    const total = filtered.length
    const receita = filtered.reduce((sum, s) => sum + (s.valor || 0), 0)

    res.json({ success: true, total, receita })
  } catch (err) {
    console.error('[Webinario] Erro ao buscar vendas:', err.message)
    res.json({ success: false, total: 0, receita: 0, error: err.message })
  }
})

// POST /api/webinario/webhook/manychat - receber dados do ManyChat
router.post('/webhook/manychat', (req, res) => {
  const event = req.body
  console.log('[Webinario] ManyChat webhook:', JSON.stringify(event).substring(0, 300))
  // TODO: processar dados do ManyChat e atualizar metricas
  res.status(200).json({ received: true })
})

// POST /api/webinario/webhook/inlead - receber dados do InLead
router.post('/webhook/inlead', (req, res) => {
  const event = req.body
  console.log('[Webinario] InLead webhook:', JSON.stringify(event).substring(0, 300))
  // TODO: processar dados do InLead e atualizar metricas
  res.status(200).json({ received: true })
})

// POST /api/webinario/webhook/sendflow - receber dados do SendFlow
router.post('/webhook/sendflow', (req, res) => {
  const event = req.body
  console.log('[Webinario] SendFlow webhook:', JSON.stringify(event).substring(0, 300))
  // TODO: processar dados do SendFlow e atualizar metricas
  res.status(200).json({ received: true })
})

// POST /api/webinario/webhook/hotwebnar - receber dados do HotWebnar
router.post('/webhook/hotwebnar', (req, res) => {
  const event = req.body
  console.log('[Webinario] HotWebnar webhook:', JSON.stringify(event).substring(0, 300))
  // TODO: processar dados do HotWebnar e atualizar metricas
  res.status(200).json({ received: true })
})

export default router
