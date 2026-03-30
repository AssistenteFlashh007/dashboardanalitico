// HotWebinar API Service
// API nao documentada - descoberta via network inspection
// Base: https://admin-api.hotwebinar.com.br
// Auth: Bearer token (JWT)

const API_BASE = 'https://admin-api.hotwebinar.com.br'

// Mapeamento de IDs de metricas do HotWebinar
const METRIC_IDS = {
  VISITANTES: '9',         // Visitou pagina de login
  ACESSOU: '10',           // Acessou o Webinar
  CLICOU_VIDEO: '26',      // Clicou no Video
  ASSISTIU_15MIN: '21',    // Chegou nos 15 minutos
  ASSISTIU_30MIN: '22',    // Chegou nos 30 minutos
  ASSISTIU_45MIN: '23',    // Chegou nos 45 minutos
  ASSISTIU_60MIN: '24',    // Chegou nos 60 minutos
  PITCH: '25',             // Estava no momento do pitch
  OFERTA: '12',            // Estava no momento da oferta
  CLICOU_OFERTA: '1',      // Clicou no botao da oferta
  CHAT: '16',              // Enviou mensagem no chat
}

function getMetricCount(metrics, id) {
  const m = metrics.find(m => String(m._id) === String(id))
  return m?.count || 0
}

export async function fetchWebinarStats(webinarId, token, dateRange) {
  if (!webinarId || !token) {
    return { error: true, message: 'WebinarId ou token nao configurado' }
  }

  try {
    let url = `${API_BASE}/stats/${webinarId}`
    if (dateRange?.since && dateRange?.until) {
      url += `?startDate=${dateRange.since}T00:00:00&endDate=${dateRange.until}T23:59:59`
    }

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      const status = res.status
      let message = `API retornou status ${status}`
      if (status === 401 || status === 403) message = 'Token expirado ou invalido'
      else if (status === 404) message = 'Webinar nao encontrado (ID invalido)'
      console.warn(`[HotWebinar] API error: ${status}`)
      return { error: true, status, message }
    }

    const data = await res.json()
    const payload = data?.payload
    if (!payload) {
      return { error: true, message: 'Resposta da API sem payload' }
    }

    const metrics = payload.metrics || []
    const videoMetrics = payload.videoMetrics || []

    // Pico de audiencia = maior valor de pv nos videoMetrics
    const peakAudience = videoMetrics.reduce((max, v) => Math.max(max, v.pv || 0), 0)

    return {
      webinarName: payload.webinar?.webinar_name || 'Webinar',
      sessionCount: payload.sessionCount || 0,
      visitantes: getMetricCount(metrics, METRIC_IDS.VISITANTES),
      acessaram: getMetricCount(metrics, METRIC_IDS.ACESSOU),
      clicouVideo: getMetricCount(metrics, METRIC_IDS.CLICOU_VIDEO),
      assistiu15min: getMetricCount(metrics, METRIC_IDS.ASSISTIU_15MIN),
      assistiu30min: getMetricCount(metrics, METRIC_IDS.ASSISTIU_30MIN),
      assistiu45min: getMetricCount(metrics, METRIC_IDS.ASSISTIU_45MIN),
      assistiu60min: getMetricCount(metrics, METRIC_IDS.ASSISTIU_60MIN),
      pitch: getMetricCount(metrics, METRIC_IDS.PITCH),
      oferta: getMetricCount(metrics, METRIC_IDS.OFERTA),
      clicouOferta: getMetricCount(metrics, METRIC_IDS.CLICOU_OFERTA),
      chat: getMetricCount(metrics, METRIC_IDS.CHAT),
      peakAudience,
    }
  } catch (err) {
    console.error(`[HotWebinar] Erro ao buscar stats:`, err.message)
    return { error: true, message: err.message }
  }
}
