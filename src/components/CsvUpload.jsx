import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'

export default function CsvUpload({ onImported }) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [platform, setPlatform] = useState('pagtrust')

  async function handleClear() {
    if (!confirm('Limpar todos os dados de vendas? Você precisará reimportar.')) return
    await fetch('/api/import/clear', { method: 'DELETE' })
    setResult({ success: true, message: 'Dados limpos. Reimporte as planilhas.' })
    onImported?.()
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      const endpoint = isXlsx ? '/api/import/xlsx' : '/api/import/csv'
      const contentType = isXlsx ? 'application/octet-stream' : 'text/csv'

      let body
      if (isXlsx) {
        body = await file.arrayBuffer()
      } else {
        body = await file.text()
      }

      const res = await fetch(`${endpoint}?platform=${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      })
      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          message: `${data.data.imported} vendas importadas, ${data.data.skipped} puladas (de ${data.data.totalRows} linhas)`,
          details: data.data,
        })
        onImported?.()
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch (err) {
      setResult({ success: false, message: err.message })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="bg-dark-card rounded-2xl p-5 border border-dark-border">
      <h3 className="text-lg font-semibold text-text-primary mb-2">Importar Vendas (CSV / Excel)</h3>
      <p className="text-xs text-text-secondary mb-4">
        Exporte o CSV da Pagtrust ou XLSX da Hubla para cruzar vendas com campanhas do Meta Ads
      </p>

      <div className="flex items-center gap-3">
        <div className="flex bg-dark rounded-lg border border-dark-border p-0.5">
          {['pagtrust', 'hubla'].map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                platform === p
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
          uploading
            ? 'bg-dark-border/50 border-dark-border text-text-secondary cursor-wait'
            : 'bg-primary/10 border-primary/30 text-primary-light hover:bg-primary/20'
        }`}>
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">
            {uploading ? 'Importando...' : platform === 'hubla' ? 'Selecionar XLSX' : 'Selecionar CSV'}
          </span>
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Limpar dados
        </button>
      </div>

      {result && (
        <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
          result.success
            ? 'bg-success/10 border border-success/30'
            : 'bg-danger/10 border border-danger/30'
        }`}>
          {result.success
            ? <CheckCircle className="w-4 h-4 text-success mt-0.5" />
            : <AlertCircle className="w-4 h-4 text-danger mt-0.5" />
          }
          <div>
            <p className={`text-sm font-medium ${result.success ? 'text-success' : 'text-danger'}`}>
              {result.message}
            </p>
            {result.details?.errors?.length > 0 && (
              <p className="text-xs text-text-secondary mt-1">
                Erros: {result.details.errors.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
