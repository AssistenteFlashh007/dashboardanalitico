import { useState, useEffect, useCallback } from 'react'
import {
  fetchMetaInsights,
  fetchMetaCampaigns,
  fetchMetaDaily,
  fetchHublaSummary,
  fetchPagtrustSales,
  fetchAttribution,
  checkHealth,
} from '../services/api.js'
import * as mockData from '../data/mockData.js'

// Nomes do produto IniciaShop nas plataformas
const INICIASHOP_NAMES = ['iniciashop']

function isIniciaShop(productName) {
  if (!productName) return false
  return INICIASHOP_NAMES.some(n => productName.toLowerCase().includes(n))
}

export default function useDashboardData(period = { preset: 'last_30d' }, platform = 'todas') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sources, setSources] = useState({ meta: false, hubla: false, pagtrust: false })

  // Extrair valores estáveis do period
  const preset = typeof period === 'string' ? period : period?.preset || 'last_30d'
  const since = typeof period === 'object' ? period?.since : undefined
  const until = typeof period === 'object' ? period?.until : undefined

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const periodObj = since && until ? { preset, since, until } : { preset }

    try {
      const [health, metaInsights, metaCampaigns, metaDaily, hublaSummary, pagtrustSales, attribution] =
        await Promise.all([
          checkHealth(),
          fetchMetaInsights(periodObj),
          fetchMetaCampaigns(periodObj),
          fetchMetaDaily(periodObj),
          fetchHublaSummary(),
          fetchPagtrustSales(),
          fetchAttribution(periodObj, platform),
        ])

      const configured = health?.configured || {}
      setSources(configured)

      const campaigns = metaCampaigns || mockData.campaignPerformance
      const salesData = buildSalesData(hublaSummary, pagtrustSales)
      const kpis = buildKpis(metaInsights, hublaSummary, pagtrustSales, attribution)

      const weeklyTraffic = metaDaily
        ? metaDaily.map(d => {
            const date = new Date(d.data)
            const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
            return { dia: dias[date.getDay()], visitas: d.cliques }
          })
        : mockData.weeklyTraffic

      setData({
        kpis,
        campaigns,
        weeklyTraffic,
        salesData,
        attribution,
        trafficOverview: mockData.trafficOverview,
        trafficSources: mockData.trafficSources,
        socialMediaMetrics: mockData.socialMediaMetrics,
        conversionFunnel: buildFunnel(metaInsights, hublaSummary, pagtrustSales),
        topPages: mockData.topPages,
      })
    } catch (err) {
      console.error('[Dashboard]', err)
      setError(err.message)
      setData({
        kpis: buildKpis(null, null, null, null),
        campaigns: mockData.campaignPerformance,
        weeklyTraffic: mockData.weeklyTraffic,
        salesData: null,
        attribution: null,
        trafficOverview: mockData.trafficOverview,
        trafficSources: mockData.trafficSources,
        socialMediaMetrics: mockData.socialMediaMetrics,
        conversionFunnel: mockData.conversionFunnel,
        topPages: mockData.topPages,
      })
    } finally {
      setLoading(false)
    }
  }, [preset, since, until, platform])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { data, loading, error, sources, refetch: loadData }
}

function buildKpis(meta, hubla, pagtrust, attribution) {
  // Usar dados de atribuição (já filtrados por data) como fonte primária
  const faturamento = attribution?.totalReceita || 0
  const totalVendas = attribution?.totalVendas || 0
  const investimento = meta?.spend || 0

  // CPA IniciaShop — vendas do IniciaShop já filtradas pela atribuição
  const vendasIniciaShop = attribution?.vendasIniciaShop || 0
  const cpaIniciaShop = vendasIniciaShop > 0
    ? Math.round((investimento / vendasIniciaShop) * 100) / 100
    : 0

  // ROAS real = faturamento / investimento
  const roas = investimento > 0
    ? Math.round((faturamento / investimento) * 100) / 100
    : 0

  // Lucro = faturamento - investimento
  const lucro = faturamento - investimento

  // Ticket médio
  const ticketMedio = totalVendas > 0
    ? Math.round((faturamento / totalVendas) * 100) / 100
    : 0

  return {
    faturamento: { valor: faturamento, variacao: 0 },
    investimento: { valor: investimento, variacao: 0 },
    cpaIniciaShop: { valor: cpaIniciaShop, variacao: 0 },
    roas: { valor: roas, variacao: 0 },
    lucro: { valor: lucro, variacao: 0 },
    ticketMedio: { valor: ticketMedio, variacao: 0 },
    // Extras para outros componentes
    vendasTotal: totalVendas,
    receitaTotal: faturamento,
  }
}

function buildSalesData(hubla, pagtrust) {
  if (!hubla && !pagtrust) return null

  const todasVendas = [
    ...(hubla?.transacoes || []).map(t => ({ ...t, plataforma: 'Hubla' })),
    ...(pagtrust?.ultimasVendas || []).map(t => ({ ...t, plataforma: 'Pagtrust' })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data))

  return {
    hubla: {
      vendas: hubla?.totalVendas || 0,
      receita: hubla?.receita || 0,
      reembolsos: hubla?.totalReembolsos || 0,
      receitaLiquida: hubla?.receitaLiquida || 0,
    },
    pagtrust: {
      vendas: pagtrust?.totalVendas || 0,
      receita: pagtrust?.receita || 0,
      reembolsos: pagtrust?.totalReembolsos || 0,
      receitaLiquida: pagtrust?.receitaLiquida || 0,
    },
    ultimasVendas: todasVendas.slice(0, 20),
  }
}

function buildFunnel(meta, hubla, pagtrust) {
  if (!meta) return mockData.conversionFunnel

  const vendasTotal = (hubla?.totalVendas || 0) + (pagtrust?.totalVendas || 0)

  return [
    { etapa: 'Alcance', valor: meta.reach || 0 },
    { etapa: 'Impressões', valor: meta.impressions || 0 },
    { etapa: 'Cliques', valor: meta.clicks || 0 },
    { etapa: 'Conversões', valor: meta.conversions || 0 },
    { etapa: 'Vendas', valor: vendasTotal || meta.conversions || 0 },
  ]
}
