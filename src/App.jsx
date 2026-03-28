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
import { kpis } from './data/mockData'

export default function App() {
  return (
    <div className="min-h-screen bg-dark">
      <Header />
      <main className="p-6 max-w-[1440px] mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            titulo="Visitantes"
            valor={kpis.visitantes.valor}
            variacao={kpis.visitantes.variacao}
            icone={Users}
          />
          <KpiCard
            titulo="Taxa de Conversão"
            valor={kpis.taxaConversao.valor}
            variacao={kpis.taxaConversao.variacao}
            icone={Target}
            sufixo="%"
          />
          <KpiCard
            titulo="Custo Aquisição"
            valor={kpis.custoAquisicao.valor}
            variacao={kpis.custoAquisicao.variacao}
            icone={DollarSign}
            prefixo="R$ "
          />
          <KpiCard
            titulo="Receita Campanhas"
            valor={kpis.receitaCampanhas.valor}
            variacao={kpis.receitaCampanhas.variacao}
            icone={MousePointerClick}
            prefixo="R$ "
          />
          <KpiCard
            titulo="ROAS Médio"
            valor={kpis.roasMedio.valor}
            variacao={kpis.roasMedio.variacao}
            icone={TrendingUp}
            sufixo="x"
          />
          <KpiCard
            titulo="Sessão Média"
            valor={kpis.sessaoMedia.valor}
            variacao={kpis.sessaoMedia.variacao}
            icone={Clock}
          />
        </div>

        {/* Gráficos de Tráfego */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrafficChart />
          </div>
          <SourcesChart />
        </div>

        {/* Tabela de Campanhas */}
        <CampaignTable />

        {/* Linha inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FunnelChart />
          <WeeklyChart />
          <SocialCards />
        </div>

        {/* Top Pages */}
        <TopPages />
      </main>
    </div>
  )
}
