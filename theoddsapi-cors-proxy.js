// SUREBET//MX — proxy para el Radar de TheOddsAPI
//
// Qué hace: recibe la petición de la página, la reenvía a TheOddsAPI desde
// aquí (un servidor, donde CORS no aplica) y regresa la respuesta con los
// encabezados que sí permiten que el navegador la lea.
//
// Cómo desplegarlo: ve a dash.cloudflare.com -> Workers & Pages ->
// Create application -> plantilla "Hello World" -> Deploy. Luego abre
// "Edit code", borra TODO el contenido de ejemplo, pega este archivo
// completo, y dale Deploy otra vez. Copia la URL que te asigna
// (termina en .workers.dev) y pégala en el Radar de la herramienta.
//
// No necesitas escribir tu API key aquí — la página se la sigue mandando
// a este proxy en cada consulta, y este proxy solo la reenvía tal cual.

export default {
  async fetch(request) {
    var CORS_HEADERS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type',
      'Access-Control-Expose-Headers': 'X-RateLimit-Remaining'
    };

    // El navegador manda esta petición de verificación antes de la real.
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    var url = new URL(request.url);
    var targetUrl = 'https://api.theoddsapi.com' + url.pathname + url.search;
    var apiKey = request.headers.get('x-api-key') || '';

    try {
      var apiResp = await fetch(targetUrl, {
        headers: { 'x-api-key': apiKey }
      });
      var body = await apiResp.text();
      var remaining = apiResp.headers.get('X-RateLimit-Remaining') || '';

      var headers = new Headers(CORS_HEADERS);
      headers.set('Content-Type', 'application/json');
      headers.set('X-RateLimit-Remaining', remaining);

      return new Response(body, { status: apiResp.status, headers: headers });
    } catch (err) {
      var errHeaders = new Headers(CORS_HEADERS);
      errHeaders.set('Content-Type', 'application/json');
      return new Response(
        JSON.stringify({ error: 'proxy_error', message: String(err) }),
        { status: 502, headers: errHeaders }
      );
    }
  }
};
