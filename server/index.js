import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import metaRoutes from './routes/meta.js'
import hublaRoutes from './routes/hubla.js'
import pagtrustRoutes from './routes/pagtrust.js'
import attributionRoutes from './routes/attribution.js'
import importRoutes from './routes/import.js'
import analyticsRoutes from './routes/analytics.js'
import abtestsRoutes from './routes/abtests.js'
import webinarioRoutes from './routes/webinario.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Rotas API
app.use('/api/meta', metaRoutes)
app.use('/api/hubla', hublaRoutes)
app.use('/api/pagtrust', pagtrustRoutes)
app.use('/api/attribution', attributionRoutes)
app.use('/api/import', importRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/abtests', abtestsRoutes)
app.use('/api/webinario', webinarioRoutes)

// Health check
app.get('/api/health', (req, res) => {
  const configured = {
    meta: !!(process.env.META_ACCESS_TOKEN && (process.env.META_AD_ACCOUNTS || process.env.META_AD_ACCOUNT_ID)),
    hubla: !!process.env.HUBLA_API_TOKEN,
    pagtrust: !!process.env.PAGTRUST_WEBHOOK_TOKEN,
  }
  res.json({ status: 'ok', configured })
})

// Em produção, servir o frontend buildado
const distPath = join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server rodando em http://0.0.0.0:${PORT}`)
  const accounts = process.env.META_AD_ACCOUNTS?.split(',').length || (process.env.META_AD_ACCOUNT_ID ? 1 : 0)
  console.log(`📊 Meta Ads: ${process.env.META_ACCESS_TOKEN ? `✅ ${accounts} conta(s)` : '❌ não configurado'}`)
  console.log(`🛒 Hubla: ${process.env.HUBLA_API_TOKEN ? '✅ configurado' : '❌ não configurado'}`)
  console.log(`💳 Pagtrust: ${process.env.PAGTRUST_WEBHOOK_TOKEN ? '✅ configurado' : '❌ não configurado'}`)
})
