addEventListener('fetch', function (event) {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  var CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'x-api-key, Content-Type',
    'Access-Control-Expose-Headers': 'X-RateLimit-Remaining'
  };

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
