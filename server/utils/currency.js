import { getCache, setCache } from './cache.js'

const CACHE_KEY = 'usd_brl_rate'
const CACHE_TTL = 15 * 60 * 1000 // 15 minutos

export async function getUsdToBrl() {
  const cached = getCache(CACHE_KEY)
  if (cached) return cached

  // Tentar multiplas APIs pra garantir cotacao real
  const apis = [
    {
      name: 'AwesomeAPI',
      url: 'https://economia.awesomeapi.com.br/json/last/USD-BRL',
      parse: (data) => parseFloat(data.USDBRL?.bid || 0)
    },
    {
      name: 'AwesomeAPI v2',
      url: 'https://economia.awesomeapi.com.br/USD-BRL/1',
      parse: (data) => parseFloat(data[0]?.bid || 0)
    },
    {
      name: 'Open Exchange (BCB)',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      parse: (data) => parseFloat(data.rates?.BRL || 0)
    },
  ]

  for (const api of apis) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(api.url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) continue
      const data = await res.json()
      const rate = api.parse(data)

      if (rate > 3 && rate < 10) { // sanity check
        console.log(`💱 Cotacao USD/BRL via ${api.name}: R$ ${rate.toFixed(4)}`)
        setCache(CACHE_KEY, rate, CACHE_TTL)
        return rate
      }
    } catch (err) {
      console.warn(`[Currency] ${api.name} falhou: ${err.message}`)
    }
  }

  // Ultimo fallback -- mas avisa no log que e fallback
  const fallback = 5.25
  console.error(`[Currency] TODAS as APIs falharam! Usando fallback R$ ${fallback}`)
  setCache(CACHE_KEY, fallback, 5 * 60 * 1000) // cache menor pra tentar de novo logo
  return fallback
}

export function convertUsdToBrl(valueUsd, rate) {
  return Math.round(valueUsd * rate * 100) / 100
}
