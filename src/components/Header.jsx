import { BarChart3, Bell, Search } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-dark-card border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Dashboard Analítico</h1>
            <p className="text-xs text-text-secondary">Marketing & Tráfego</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-dark border border-dark-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 w-64"
            />
          </div>
          <button className="relative w-10 h-10 rounded-xl bg-dark border border-dark-border flex items-center justify-center hover:border-primary/40 transition-colors">
            <Bell className="w-5 h-5 text-text-secondary" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">3</span>
            </div>
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary-light">LC</span>
          </div>
        </div>
      </div>
    </header>
  )
}
