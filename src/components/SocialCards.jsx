import { TrendingUp } from 'lucide-react'

const redeConfig = {
  Instagram: { icon: '📸', color: 'from-pink-500/20 to-purple-500/10', border: 'border-pink-500/20' },
  Facebook: { icon: '👤', color: 'from-blue-500/20 to-blue-700/10', border: 'border-blue-500/20' },
  LinkedIn: { icon: '💼', color: 'from-sky-500/20 to-sky-700/10', border: 'border-sky-500/20' },
  TikTok: { icon: '🎵', color: 'from-cyan-500/20 to-purple-500/10', border: 'border-cyan-500/20' },
}

export default function SocialCards({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border/60 hover:border-purple-500/20 transition-all duration-300">
      <h3 className="text-base font-bold text-text-primary mb-4">Redes Sociais</h3>
      <div className="grid grid-cols-2 gap-3">
        {data.map((rede) => {
          const config = redeConfig[rede.rede] || { icon: '🌐', color: 'from-gray-500/20 to-gray-700/10', border: 'border-gray-500/20' }
          return (
            <div key={rede.rede} className={`bg-gradient-to-br ${config.color} rounded-xl p-4 border ${config.border} hover:scale-[1.02] transition-all duration-200`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{config.icon}</span>
                <span className="text-sm font-bold text-text-primary">{rede.rede}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-text-secondary">Seguidores</span>
                  <span className="text-xs font-bold text-text-primary">
                    {(rede.seguidores / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-text-secondary">Engajamento</span>
                  <span className="text-xs font-bold text-cyan-400">{rede.engajamento}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-text-secondary">Alcance</span>
                  <span className="text-xs font-bold text-text-primary">
                    {(rede.alcance / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-bold">+{rede.crescimento}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
