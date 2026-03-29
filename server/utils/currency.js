import { getCache, setCache } from './cache.js'

const CACHE_KEY = 'usd_brl_rate'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutos

export async function getUsdToBrl() {
  const cached = getCache(CACHE_KEY)
  if (cached) return cached

  try {
    // API pública do Banco Central / AwesomeAPI
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
    if (!res.ok) throw new Error(`Currency API error: ${res.status}`)
    const data = await res.json()
    const rate = parseFloat(data.USDBRL?.bid || data.USDBRL?.ask || 5.70)

    console.log(`💱 Cotação USD/BRL atualizada: R$ ${rate.toFixed(2)}`)
    setCache(CACHE_KEY, rate, CACHE_TTL)
    return rate
  } catch (error) {
    console.warn(`[Currency] Erro ao buscar cotação: ${error.message}. Usando fallback R$ 5.70`)
    const fallback = 5.70
    setCache(CACHE_KEY, fallback, CACHE_TTL)
    return fallback
  }
}

export function convertUsdToBrl(valueUsd, rate) {
  return Math.round(valueUsd * rate * 100) / 100
}
