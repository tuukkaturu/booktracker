export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204 };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  const railwayApiUrl = (process.env.RAILWAY_API_URL ?? '').replace(/\/$/, '');
  const railwayApiToken = (process.env.RAILWAY_API_TOKEN ?? '').trim();

  if (!railwayApiUrl || !railwayApiToken) {
    return {
      statusCode: 503,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Backend proxy is not configured.' }),
    };
  }

  try {
    const upstream = await fetch(`${railwayApiUrl}/api/identify-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': railwayApiToken,
      },
      body: event.body ?? '{}',
    });

    const bodyText = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: { 'content-type': 'application/json' },
      body: bodyText,
    };
  } catch {
    return {
      statusCode: 502,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Could not reach backend API.' }),
    };
  }
}
