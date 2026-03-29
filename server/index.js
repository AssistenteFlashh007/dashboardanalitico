import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import metaRoutes from './routes/meta.js'
import hublaRoutes from './routes/hubla.js'
import pagtrustRoutes from './routes/pagtrust.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Rotas
app.use('/api/meta', metaRoutes)
app.use('/api/hubla', hublaRoutes)
app.use('/api/pagtrust', pagtrustRoutes)

// Health check
app.get('/api/health', (req, res) => {
  const configured = {
    meta: !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID),
    hubla: !!process.env.HUBLA_API_TOKEN,
    pagtrust: !!process.env.PAGTRUST_WEBHOOK_TOKEN,
  }
  res.json({ status: 'ok', configured })
})

app.listen(PORT, () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`)
  console.log(`📊 Meta Ads: ${process.env.META_ACCESS_TOKEN ? '✅ configurado' : '❌ não configurado'}`)
  console.log(`🛒 Hubla: ${process.env.HUBLA_API_TOKEN ? '✅ configurado' : '❌ não configurado'}`)
  console.log(`💳 Pagtrust: ${process.env.PAGTRUST_WEBHOOK_TOKEN ? '✅ configurado' : '❌ não configurado'}`)
})
