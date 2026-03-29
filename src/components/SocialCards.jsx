import { TrendingUp } from 'lucide-react'

const redeIcons = {
  Instagram: '📸',
  Facebook: '👤',
  LinkedIn: '💼',
  TikTok: '🎵',
}

export default function SocialCards({ data }) {
  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Redes Sociais</h3>
      <div className="grid grid-cols-2 gap-3">
        {data.map((rede) => (
          <div key={rede.rede} className="bg-dark/50 rounded-xl p-4 border border-dark-border/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{redeIcons[rede.rede]}</span>
              <span className="text-sm font-semibold text-text-primary">{rede.rede}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-secondary">Seguidores</span>
                <span className="text-xs font-medium text-text-primary">
                  {(rede.seguidores / 1000).toFixed(1)}k
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-secondary">Engajamento</span>
                <span className="text-xs font-medium text-accent">{rede.engajamento}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-secondary">Alcance</span>
                <span className="text-xs font-medium text-text-primary">
                  {(rede.alcance / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">+{rede.crescimento}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
