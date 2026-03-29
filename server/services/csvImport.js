import { parse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'
import { addSaleWithUtm } from './attribution.js'

// Mapeamento de colunas — cobre Pagtrust e Hubla
const COLUMN_MAPS = {
  valor: ['valor_liquido', 'valor', 'value', 'amount', 'price', 'preco', 'preço', 'receita', 'revenue', 'total', 'net_amount', 'valor_transacionado', 'preco_base_do_produto', 'gross_amount'],
  produto: ['produtos', 'produto', 'nome_do_produto', 'nome do produto', 'product', 'product_name', 'nome_produto', 'item', 'nome_oferta', 'nome da oferta'],
  comprador: ['comprador', 'nome_do_cliente', 'nome do cliente', 'buyer', 'buyer_name', 'nome', 'name', 'cliente', 'customer', 'customer_name'],
  email: ['email', 'email_do_cliente', 'email do cliente', 'buyer_email', 'email_comprador', 'customer_email', 'e-mail'],
  data: ['data', 'data_de_pagamento', 'data de pagamento', 'data_de_criacao', 'data de criação', 'date', 'created_at', 'paid_at', 'approved_date', 'data_aprovacao', 'data_pagamento', 'payment_date'],
  status: ['status', 'status_da_fatura', 'status da fatura', 'payment_status', 'status_pagamento', 'transaction_status'],
  utm_source: ['utmsource', 'utm_source', 'utm_origem', 'utm origem', 'source', 'fonte', 'src'],
  utm_medium: ['utmmedium', 'utm_medium', 'utm_midia', 'utm mídia', 'medium', 'meio'],
  utm_campaign: ['utmcampaign', 'utm_campaign', 'campaign', 'campanha'],
  utm_content: ['utmcontent', 'utm_content', 'content', 'conteudo', 'conteúdo'],
  utm_term: ['utmterm', 'utm_term', 'term', 'termo'],
  id: ['codigo_da_venda', 'id', 'transaction_id', 'invoice_id', 'order_id', 'pedido', 'codigo', 'code'],
}

function findColumn(headers, fieldNames) {
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'))
  for (const name of fieldNames) {
    const idx = normalized.indexOf(name.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    if (idx !== -1) return headers[idx]
  }
  for (const name of fieldNames) {
    const idx = normalized.findIndex(h => h.includes(name.toLowerCase().replace(/[^a-z0-9_]/g, '_')))
    if (idx !== -1) return headers[idx]
  }
  return null
}

function parseValue(val) {
  if (val == null || val === '') return 0
  const cleaned = String(val).replace(/[R$US\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseDate(val) {
  if (!val) return null
  const str = String(val).trim()

  // DD/MM/YYYY HH:MM:SS (formato Hubla)
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})/)
  if (brMatch) {
    const [, day, month, year, time] = brMatch
    return `${year}-${month}-${day}T${time}.000Z`
  }

  // DD/MM/YYYY (sem hora)
  const brDateOnly = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brDateOnly) {
    const [, day, month, year] = brDateOnly
    return `${year}-${month}-${day}T00:00:00.000Z`
  }

  // ISO 8601 (formato Pagtrust: 2026-03-29T02:25:06.408Z)
  if (str.includes('T') && str.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return str
  }

  // Tentar parse nativo
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function processRecords(records, platform) {
  if (records.length === 0) {
    return { imported: 0, skipped: 0, errors: ['Arquivo vazio ou sem dados'], totalRows: 0 }
  }

  const headers = Object.keys(records[0])
  const colMap = {}
  for (const [field, names] of Object.entries(COLUMN_MAPS)) {
    colMap[field] = findColumn(headers, names)
  }

  console.log(`[CSV Import] Colunas: ${headers.join(', ')}`)
  console.log(`[CSV Import] Mapeamento:`, JSON.stringify(colMap))

  let imported = 0
  let skipped = 0
  const errors = []

  for (const row of records) {
    try {
      // Filtrar por status
      if (colMap.status) {
        const status = (row[colMap.status] || '').toLowerCase()
        const approved = ['aprovado', 'approved', 'pago', 'paga', 'paid', 'completo', 'completed']
        if (!approved.some(a => status.includes(a))) {
          skipped++
          continue
        }
      }

      const valor = parseValue(row[colMap.valor])
      if (valor <= 0) {
        skipped++
        continue
      }

      const dataVenda = parseDate(row[colMap.data])
      if (!dataVenda) {
        skipped++
        continue
      }

      // Extrair UTM campaign — limpar pipes e IDs do Meta
      let utmCampaign = row[colMap.utm_campaign] || null
      if (utmCampaign) {
        // Pagtrust às vezes coloca "NomeCampanha|ID" — pegar só o nome
        const parts = utmCampaign.split('|')
        utmCampaign = parts[0].trim()
      }

      const utm = {
        utm_source: row[colMap.utm_source] || null,
        utm_medium: row[colMap.utm_medium] || null,
        utm_campaign: utmCampaign,
        utm_content: row[colMap.utm_content] || null,
        utm_term: row[colMap.utm_term] || null,
      }

      // Produto — pegar o primeiro se tiver múltiplos separados por |
      let produto = row[colMap.produto] || 'Produto importado'
      if (produto.includes('|')) {
        produto = produto.split('|')[0].trim()
      }

      addSaleWithUtm({
        id: row[colMap.id] || `csv_${platform}_${imported}`,
        plataforma: platform,
        produto,
        valor,
        data: dataVenda,
        comprador: row[colMap.comprador] || '',
        email: row[colMap.email] || '',
        utm,
      })

      imported++
    } catch (e) {
      errors.push(`Linha ${imported + skipped + 1}: ${e.message}`)
    }
  }

  console.log(`[CSV Import] ${platform}: ${imported} importadas | ${skipped} puladas | ${errors.length} erros`)

  return {
    imported,
    skipped,
    errors: errors.slice(0, 10),
    totalRows: records.length,
    columnsDetected: colMap,
    headers,
  }
}

export function importCsv(csvContent, platform = 'pagtrust') {
  const firstLine = csvContent.split('\n')[0]
  const delimiter = firstLine.includes(';') ? ';' : ','

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    trim: true,
    bom: true,
    relax_column_count: true,
    relax_quotes: true,
    quote: false,
  })

  return processRecords(records, platform)
}

export function importXlsx(buffer, platform = 'hubla') {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const records = XLSX.utils.sheet_to_json(sheet)

  return processRecords(records, platform)
}
