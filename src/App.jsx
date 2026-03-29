import { useState } from 'react'
import { Wallet, TrendingUp, Target, BarChart2, DollarSign, Receipt } from 'lucide-react'
import Header from './components/Header'
import KpiCard from './components/KpiCard'
import TrafficChart from './components/TrafficChart'
import SourcesChart from './components/SourcesChart'
import CampaignTable from './components/CampaignTable'
import SocialCards from './components/SocialCards'
import FunnelChart from './components/FunnelChart'
import WeeklyChart from './components/WeeklyChart'
import TopPages from './components/TopPages'
import SalesTable from './components/SalesTable'
import AttributionTable from './components/AttributionTable'
import CsvUpload from './components/CsvUpload'
import LoadingSkeleton from './components/LoadingSkeleton'
import useDashboardData from './hooks/useDashboardData'

export default function App() {
  const [period, setPeriod] = useState({ preset: 'last_30d' })
  const { data, loading, error, sources, refetch } = useDashboardData(period)

  if (loading && !data) return <LoadingSkeleton />

  const kpis = data?.kpis
  if (!kpis) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-dark">
      <Header
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={refetch}
        sources={sources}
        loading={loading}
      />

      {error && (
        <div className="mx-6 mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
          Erro ao carregar dados: {error} — exibindo dados de demonstração
        </div>
      )}

      <main className="p-6 max-w-[1440px] mx-auto space-y-6">
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            titulo="Faturamento"
            valor={kpis.faturamento.valor}
            variacao={kpis.faturamento.variacao}
            icone={Wallet}
            prefixo="R$ "
          />
          <KpiCard
            titulo="Investimento"
            valor={kpis.investimento.valor}
            variacao={kpis.investimento.variacao}
            icone={BarChart2}
            prefixo="R$ "
          />
          <KpiCard
            titulo="CPA IniciaShop"
            valor={kpis.cpaIniciaShop.valor}
            variacao={kpis.cpaIniciaShop.variacao}
            icone={Target}
            prefixo="R$ "
          />
          <KpiCard
            titulo="ROAS"
            valor={kpis.roas.valor}
            variacao={kpis.roas.variacao}
            icone={TrendingUp}
            sufixo="x"
          />
          <KpiCard
            titulo="Lucro"
            valor={kpis.lucro.valor}
            variacao={kpis.lucro.variacao}
            icone={DollarSign}
            prefixo="R$ "
          />
          <KpiCard
            titulo="Ticket Médio"
            valor={kpis.ticketMedio.valor}
            variacao={kpis.ticketMedio.variacao}
            icone={Receipt}
            prefixo="R$ "
          />
        </div>

        {/* Gráficos de Tráfego */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrafficChart data={data.trafficOverview} />
          </div>
          <SourcesChart data={data.trafficSources} />
        </div>

        {/* Tabela de Campanhas — com vendas reais via UTM */}
        <CampaignTable data={data.campaigns} attribution={data.attribution} />

        {/* Importar CSV + Atribuição UTM */}
        <CsvUpload onImported={refetch} />
        <AttributionTable data={data.attribution} />

        {/* Vendas */}
        {data.salesData && <SalesTable salesData={data.salesData} />}

        {/* Linha inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FunnelChart data={data.conversionFunnel} />
          <WeeklyChart data={data.weeklyTraffic} />
          <SocialCards data={data.socialMediaMetrics} />
        </div>

        {/* Top Pages */}
        <TopPages data={data.topPages} />
      </main>
    </div>
  )
}
