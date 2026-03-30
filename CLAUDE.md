# Regras do Projeto - Dashboard Analitico

## REGRA CRITICA: ARQUIVOS BLINDADOS (NUNCA MODIFICAR)

Os seguintes arquivos controlam webhooks e vendas. Eles estao **100% corretos e testados**.
**NUNCA modifique estes arquivos**, independente do que for solicitado:

- `server/routes/hubla.js` - Webhook Hubla (comissao seller)
- `server/routes/pagtrust.js` - Webhook Pagtrust V2 (PURCHASE_APPROVED only)
- `server/services/attribution.js` - Atribuicao UTM, sales.json, dedup
- `server/services/hubla.js` - Servico Hubla
- `server/services/pagtrust.js` - Servico Pagtrust
- `server/services/csvImport.js` - Import CSV/XLSX

## COMANDOS PROIBIDOS

- `curl -X DELETE /api/import/clear` - APAGA TODAS AS VENDAS
- Qualquer comando que delete ou modifique `sales.json` em producao
- `git checkout` ou `git reset` nos arquivos blindados

## REGRAS PARA NOVAS FUNCIONALIDADES

1. Criar NOVOS arquivos para novas features (nunca modificar os blindados)
2. No `server/index.js`, apenas ADICIONAR novas rotas (app.use), nunca alterar existentes
3. No `src/App.jsx`, apenas adicionar novas abas/componentes
4. Testar localmente antes de fazer deploy
5. Fazer deploy somente na branch `conectar-dados-reais` (usada pelo EasyPanel)

## STACK

- Frontend: React + Vite + Tailwind CSS + Recharts
- Backend: Express.js + Node.js
- Deploy: EasyPanel (Docker) - branch `conectar-dados-reais`
- Dados: sales.json (volume persistente /app/server/data)
- Integracoes: Meta Ads API, Hubla Webhook, Pagtrust Webhook V2
