import { useState } from 'react'
import { Wallet, TrendingUp, Target, BarChart2, DollarSign, Receipt, LayoutDashboard, Megaphone, GitBranch, Palette, FlaskConical, Users, Database, ChevronLeft, ChevronRight, Settings, Radio } from 'lucide-react'
import Header from './components/Header'
import KpiCard from './components/KpiCard'
import TrafficChart from './components/TrafficChart'
import SourcesChart from './components/SourcesChart'
import CampaignTable from './components/CampaignTable'
import SalesTable from './components/SalesTable'
import AttributionTable from './components/AttributionTable'
import CsvUpload from './components/CsvUpload'
import ProductSales from './components/ProductSales'
import LoadingSkeleton from './components/LoadingSkeleton'
import FunnelAnalytics from './components/FunnelAnalytics'
import CreativeAnalytics from './components/CreativeAnalytics'
import ABTesting from './components/ABTesting'
import Debriefing from './components/Debriefing'
import Segments from './components/Segments'
import WhatsAppReport from './components/WhatsAppReport'
import DataSources from './components/DataSources'
import Webinario from './components/Webinario'
import useDashboardData from './hooks/useDashboardData'

const navItems = [
  { id: 'dashboard', label: 'Resumo', icon: LayoutDashboard },
  { id: 'campanhas', label: 'Campanhas', icon: Megaphone },
  { id: 'funil', label: 'Funil', icon: GitBranch },
  { id: 'criativos', label: 'Criativos', icon: Palette },
  { id: 'webinario', label: 'Webnario', icon: Radio },
  { id: 'abtesting', label: 'Testes A/B', icon: FlaskConical },
  { id: 'segmentos', label: 'Segmentos', icon: Users },
]

const bottomItems = [
  { id: 'config', label: 'Configuracoes', icon: Settings },
]

export default function App() {
  const [period, setPeriod] = useState({ preset: 'today' })
  const [platform, setPlatform] = useState('todas')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data, loading, error, sources, refetch } = useDashboardData(period, platform)

  if (loading && !data) return <LoadingSkeleton />

  const kpis = data?.kpis
  if (!kpis) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 bg-dark-card border-r border-dark-border/50 flex flex-col transition-all duration-300 sticky top-0 h-screen z-40`}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-dark-border/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && <span className="text-sm font-bold text-text-primary truncate">Dashboard</span>}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-purple-600/20 to-purple-800/10 text-purple-400 border border-purple-500/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-border/20 border border-transparent'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-purple-400' : 'text-text-secondary group-hover:text-text-primary'}`} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Bottom Items */}
        <div className="px-2 py-3 border-t border-dark-border/30 space-y-1">
          {bottomItems.map(item => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-purple-600/20 to-purple-800/10 text-purple-400 border border-purple-500/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-border/20 border border-transparent'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-purple-400' : 'text-text-secondary group-hover:text-text-primary'}`} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-dark-border/20 transition-all"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            {sidebarOpen && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          period={period}
          onPeriodChange={setPeriod}
          platform={platform}
          onPlatformChange={setPlatform}
          onRefresh={refetch}
          sources={sources}
          loading={loading}
        />

        {error && (
          <div className="mx-6 mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
            Erro ao carregar dados: {error}
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <main className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard titulo="Faturamento" valor={kpis.faturamento.valor} variacao={kpis.faturamento.variacao} icone={Wallet} prefixo="R$ " index={0} />
              <KpiCard titulo="Investimento" valor={kpis.investimento.valor} variacao={kpis.investimento.variacao} icone={BarChart2} prefixo="R$ " index={1} />
              <KpiCard titulo="CPA IniciaShop" valor={kpis.cpaIniciaShop.valor} variacao={kpis.cpaIniciaShop.variacao} icone={Target} prefixo="R$ " index={2} />
              <KpiCard titulo="ROAS" valor={kpis.roas.valor} variacao={kpis.roas.variacao} icone={TrendingUp} sufixo="x" index={3} />
              <KpiCard titulo="Lucro" valor={kpis.lucro.valor} variacao={kpis.lucro.variacao} icone={DollarSign} prefixo="R$ " index={4} />
              <KpiCard titulo="Ticket Medio" valor={kpis.ticketMedio.valor} variacao={kpis.ticketMedio.variacao} icone={Receipt} prefixo="R$ " index={5} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><TrafficChart data={data.trafficOverview} /></div>
              <SourcesChart data={data.trafficSources} />
            </div>

            <ProductSales data={data.attribution} />
            <CsvUpload onImported={refetch} />
            {data.salesData && <SalesTable salesData={data.salesData} />}

            <div className="flex gap-3">
              <WhatsAppReport period={period} />
              <Debriefing period={period} platform={platform} mode="button" />
            </div>
          </main>
        )}

        {/* Campanhas */}
        {activeTab === 'campanhas' && (
          <main className="p-6 space-y-6 overflow-y-auto">
            <CampaignTable data={data.campaigns} attribution={data.attribution} />
            <AttributionTable data={data.attribution} />
          </main>
        )}

        {/* Funil & Conversao */}
        {activeTab === 'funil' && (
          <main className="p-6 overflow-y-auto">
            <FunnelAnalytics period={period} platform={platform} />
          </main>
        )}

        {/* Criativos */}
        {activeTab === 'criativos' && (
          <main className="p-6 overflow-y-auto">
            <CreativeAnalytics period={period} platform={platform} />
          </main>
        )}

        {/* Testes A/B */}
        {activeTab === 'abtesting' && (
          <main className="p-6 overflow-y-auto">
            <ABTesting period={period} platform={platform} />
          </main>
        )}

        {/* Segmentos */}
        {activeTab === 'segmentos' && (
          <main className="p-6 overflow-y-auto">
            <Segments period={period} />
          </main>
        )}

        {/* Webinario */}
        {activeTab === 'webinario' && (
          <main className="p-6 overflow-y-auto">
            <Webinario />
          </main>
        )}

        {/* Config */}
        {activeTab === 'config' && (
          <main className="p-6 overflow-y-auto">
            <DataSources sources={sources} />
          </main>
        )}
      </div>
    </div>
  )
}
