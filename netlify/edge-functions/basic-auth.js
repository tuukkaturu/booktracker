export default async (request, context) => {
  const user = Netlify.env.get('BASIC_AUTH_USER');
  const pass = Netlify.env.get('BASIC_AUTH_PASS');

  // If credentials are not configured, do not block traffic.
  if (!user || !pass) return context.next();

  const authHeader = request.headers.get('authorization') ?? '';
  const expected = `Basic ${btoa(`${user}:${pass}`)}`;

  if (authHeader !== expected) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="BookTracker"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return context.next();
};
