import { parse } from 'csv-parse/sync'
import { addSaleWithUtm } from './attribution.js'

// Mapeamento flexível de colunas — suporta diferentes formatos de CSV
const COLUMN_MAPS = {
  // Valor da venda
  valor: ['valor', 'value', 'amount', 'price', 'preco', 'preço', 'receita', 'revenue', 'total', 'net_amount', 'valor_liquido', 'gross_amount'],
  // Nome do produto
  produto: ['produto', 'product', 'product_name', 'nome_produto', 'item', 'offer', 'oferta', 'nome_oferta'],
  // Nome do comprador
  comprador: ['comprador', 'buyer', 'buyer_name', 'nome', 'name', 'cliente', 'customer', 'customer_name'],
  // Email
  email: ['email', 'buyer_email', 'email_comprador', 'customer_email', 'e-mail'],
  // Data
  data: ['data', 'date', 'created_at', 'paid_at', 'approved_date', 'data_aprovacao', 'data_pagamento', 'payment_date', 'data_compra', 'purchase_date'],
  // Status
  status: ['status', 'payment_status', 'status_pagamento', 'transaction_status'],
  // UTMs
  utm_source: ['utm_source', 'source', 'fonte', 'src'],
  utm_medium: ['utm_medium', 'medium', 'meio'],
  utm_campaign: ['utm_campaign', 'campaign', 'campanha'],
  utm_content: ['utm_content', 'content', 'conteudo', 'conteúdo'],
  utm_term: ['utm_term', 'term', 'termo'],
  // ID
  id: ['id', 'transaction_id', 'invoice_id', 'order_id', 'pedido', 'codigo', 'code'],
}

function findColumn(headers, fieldNames) {
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'))
  for (const name of fieldNames) {
    const idx = normalized.indexOf(name.toLowerCase())
    if (idx !== -1) return headers[idx]
  }
  // Tentar match parcial
  for (const name of fieldNames) {
    const idx = normalized.findIndex(h => h.includes(name.toLowerCase()))
    if (idx !== -1) return headers[idx]
  }
  return null
}

function parseValue(val) {
  if (val == null || val === '') return 0
  // Remover R$, US$, etc
  const cleaned = String(val).replace(/[R$US\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseDate(val) {
  if (!val) return new Date().toISOString()
  // Tentar formatos comuns: DD/MM/YYYY, YYYY-MM-DD, etc
  const str = String(val).trim()

  // DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/)
  if (brMatch) {
    const [, day, month, year, rest] = brMatch
    return new Date(`${year}-${month}-${day}${rest || 'T00:00:00'}`).toISOString()
  }

  // Tentar parse nativo
  const d = new Date(str)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export function importCsv(csvContent, platform = 'hubla') {
  // Detectar delimitador
  const firstLine = csvContent.split('\n')[0]
  const delimiter = firstLine.includes(';') ? ';' : ','

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    trim: true,
    bom: true,
    relax_column_count: true,
  })

  if (records.length === 0) {
    return { imported: 0, skipped: 0, errors: ['CSV vazio ou sem dados'] }
  }

  const headers = Object.keys(records[0])

  // Mapear colunas
  const colMap = {}
  for (const [field, names] of Object.entries(COLUMN_MAPS)) {
    colMap[field] = findColumn(headers, names)
  }

  let imported = 0
  let skipped = 0
  const errors = []

  // Log das colunas encontradas
  console.log(`[CSV Import] Colunas detectadas:`, headers.join(', '))
  console.log(`[CSV Import] Mapeamento:`, JSON.stringify(colMap, null, 2))

  for (const row of records) {
    try {
      // Verificar status — pular se não for venda aprovada
      if (colMap.status) {
        const status = (row[colMap.status] || '').toLowerCase()
        const rejected = ['refunded', 'reembolsado', 'canceled', 'cancelado', 'refused', 'recusado', 'chargeback', 'expired', 'expirado', 'pending', 'pendente']
        if (rejected.some(r => status.includes(r))) {
          skipped++
          continue
        }
      }

      const valor = parseValue(row[colMap.valor])
      if (valor <= 0) {
        skipped++
        continue
      }

      const utm = {
        utm_source: row[colMap.utm_source] || null,
        utm_medium: row[colMap.utm_medium] || null,
        utm_campaign: row[colMap.utm_campaign] || null,
        utm_content: row[colMap.utm_content] || null,
        utm_term: row[colMap.utm_term] || null,
      }

      addSaleWithUtm({
        id: row[colMap.id] || `csv_${platform}_${imported}`,
        plataforma: platform,
        produto: row[colMap.produto] || 'Produto importado',
        valor,
        data: parseDate(row[colMap.data]),
        comprador: row[colMap.comprador] || '',
        email: row[colMap.email] || '',
        utm,
      })

      imported++
    } catch (e) {
      errors.push(`Linha ${imported + skipped + 1}: ${e.message}`)
    }
  }

  console.log(`[CSV Import] Importado: ${imported} | Pulado: ${skipped} | Erros: ${errors.length}`)

  return {
    imported,
    skipped,
    errors: errors.slice(0, 10),
    totalRows: records.length,
    columnsDetected: colMap,
    headers,
  }
}
