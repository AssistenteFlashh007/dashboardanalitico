import { useState, useEffect, useCallback } from 'react'
import {
  fetchMetaInsights,
  fetchMetaCampaigns,
  fetchMetaDaily,
  fetchHublaSummary,
  fetchPagtrustSales,
  checkHealth,
} from '../services/api.js'
import * as mockData from '../data/mockData.js'

export default function useDashboardData(period = 'last_30d') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sources, setSources] = useState({ meta: false, hubla: false, pagtrust: false })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Verificar quais serviços estão configurados
      const health = await checkHealth()
      const configured = health?.configured || {}
      setSources(configured)

      // Buscar dados em paralelo
      const [metaInsights, metaCampaigns, metaDaily, hublaSummary, pagtrustSales] =
        await Promise.all([
          configured.meta ? fetchMetaInsights(period) : null,
          configured.meta ? fetchMetaCampaigns(period) : null,
          configured.meta ? fetchMetaDaily('last_7d') : null,
          configured.hubla ? fetchHublaSummary() : null,
          configured.pagtrust ? fetchPagtrustSales() : null,
        ])

      // Montar KPIs (dados reais ou mock)
      const kpis = buildKpis(metaInsights, hublaSummary, pagtrustSales)

      // Montar campanhas
      const campaigns = metaCampaigns || mockData.campaignPerformance

      // Tráfego diário para gráfico semanal
      const weeklyTraffic = metaDaily
        ? metaDaily.map(d => {
            const date = new Date(d.data)
            const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
            return { dia: dias[date.getDay()], visitas: d.cliques }
          })
        : mockData.weeklyTraffic

      // Vendas combinadas (Hubla + Pagtrust)
      const salesData = buildSalesData(hublaSummary, pagtrustSales)

      setData({
        kpis,
        campaigns,
        weeklyTraffic,
        salesData,
        trafficOverview: mockData.trafficOverview, // Mantém mock por enquanto
        trafficSources: mockData.trafficSources,
        socialMediaMetrics: mockData.socialMediaMetrics,
        conversionFunnel: buildFunnel(metaInsights, hublaSummary, pagtrustSales),
        topPages: mockData.topPages,
      })
    } catch (err) {
      console.error('[Dashboard]', err)
      setError(err.message)
      // Fallback para mock data
      setData({
        kpis: mockData.kpis,
        campaigns: mockData.campaignPerformance,
        weeklyTraffic: mockData.weeklyTraffic,
        salesData: null,
        trafficOverview: mockData.trafficOverview,
        trafficSources: mockData.trafficSources,
        socialMediaMetrics: mockData.socialMediaMetrics,
        conversionFunnel: mockData.conversionFunnel,
        topPages: mockData.topPages,
      })
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { data, loading, error, sources, refetch: loadData }
}

function buildKpis(meta, hubla, pagtrust) {
  const hasReal = meta || hubla || pagtrust

  if (!hasReal) return mockData.kpis

  // Receita total = Hubla + Pagtrust
  const receitaHubla = hubla?.receitaLiquida || 0
  const receitaPagtrust = pagtrust?.receitaLiquida || 0
  const receitaTotal = receitaHubla + receitaPagtrust

  // Vendas totais
  const vendasHubla = hubla?.totalVendas || 0
  const vendasPagtrust = pagtrust?.totalVendas || 0

  return {
    visitantes: {
      valor: meta?.reach || mockData.kpis.visitantes.valor,
      variacao: 0,
      anterior: 0,
    },
    taxaConversao: {
      valor: meta ? parseFloat(meta.ctr.toFixed(2)) : mockData.kpis.taxaConversao.valor,
      variacao: 0,
      anterior: 0,
    },
    custoAquisicao: {
      valor: meta ? parseFloat(meta.cpa.toFixed(2)) : mockData.kpis.custoAquisicao.valor,
      variacao: 0,
      anterior: 0,
    },
    receitaCampanhas: {
      valor: meta?.spend || mockData.kpis.receitaCampanhas.valor,
      variacao: 0,
      anterior: 0,
    },
    roasMedio: {
      valor: meta ? parseFloat(meta.roas.toFixed(2)) : mockData.kpis.roasMedio.valor,
      variacao: 0,
      anterior: 0,
    },
    sessaoMedia: {
      valor: receitaTotal > 0
        ? `R$ ${receitaTotal.toLocaleString('pt-BR')}`
        : mockData.kpis.sessaoMedia.valor,
      variacao: 0,
      anterior: 0,
    },
    // Dados extras de vendas
    vendasTotal: vendasHubla + vendasPagtrust,
    receitaTotal,
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
