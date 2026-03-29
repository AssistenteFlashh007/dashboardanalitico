import { useState } from 'react'
import { Users, Target, DollarSign, MousePointerClick, TrendingUp, Clock } from 'lucide-react'
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
import LoadingSkeleton from './components/LoadingSkeleton'
import useDashboardData from './hooks/useDashboardData'

export default function App() {
  const [period, setPeriod] = useState('last_30d')
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
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            titulo="Alcance"
            valor={kpis.visitantes.valor}
            variacao={kpis.visitantes.variacao}
            icone={Users}
          />
          <KpiCard
            titulo="CTR"
            valor={kpis.taxaConversao.valor}
            variacao={kpis.taxaConversao.variacao}
            icone={Target}
            sufixo="%"
          />
          <KpiCard
            titulo="CPA"
            valor={kpis.custoAquisicao.valor}
            variacao={kpis.custoAquisicao.variacao}
            icone={DollarSign}
            prefixo="R$ "
          />
          <KpiCard
            titulo="Investido (Ads)"
            valor={kpis.receitaCampanhas.valor}
            variacao={kpis.receitaCampanhas.variacao}
            icone={MousePointerClick}
            prefixo="R$ "
          />
          <KpiCard
            titulo="ROAS"
            valor={kpis.roasMedio.valor}
            variacao={kpis.roasMedio.variacao}
            icone={TrendingUp}
            sufixo="x"
          />
          <KpiCard
            titulo={data.salesData ? 'Receita Vendas' : 'Sessão Média'}
            valor={kpis.sessaoMedia.valor}
            variacao={kpis.sessaoMedia.variacao}
            icone={Clock}
          />
        </div>

        {/* Gráficos de Tráfego */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrafficChart data={data.trafficOverview} />
          </div>
          <SourcesChart data={data.trafficSources} />
        </div>

        {/* Tabela de Campanhas */}
        <CampaignTable data={data.campaigns} />

        {/* Vendas (só aparece se Hubla ou Pagtrust configurados) */}
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
