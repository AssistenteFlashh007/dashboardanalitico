import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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
