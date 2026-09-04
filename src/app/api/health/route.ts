export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, endpoint, apiKey } = body as {
      provider: string;
      endpoint?: string;
      apiKey?: string;
    };

    if (provider === 'builtin') {
      return new Response(JSON.stringify({
        status: 'healthy',
        provider: 'builtin',
        message: 'Edge NLP Engine running on V8 Isolate. Zero external dependencies.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (provider === 'ollama') {
      const url = endpoint || 'http://localhost:11434';
      try {
        const res = await fetch(`${url}/api/version`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          return new Response(JSON.stringify({
            status: 'connected',
            provider: 'ollama',
            version: data.version || 'active',
            message: `Connected to local Ollama daemon successfully.`
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
          return new Response(JSON.stringify({
            status: 'unreachable',
            provider: 'ollama',
            message: `Ollama returned HTTP ${res.status}`
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to connect';
        return new Response(JSON.stringify({
          status: 'unreachable',
          provider: 'ollama',
          message: `Cannot reach Ollama at ${url}. Ensure "ollama serve" is running. (Fallback: Built-in Edge Engine is active)`
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (provider === 'groq') {
      if (!apiKey) {
        return new Response(JSON.stringify({
          status: 'missing_key',
          provider: 'groq',
          message: 'Groq API Key is not set.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (res.ok) {
          return new Response(JSON.stringify({
            status: 'connected',
            provider: 'groq',
            message: 'Groq Free Tier connected successfully!'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
          return new Response(JSON.stringify({
            status: 'invalid_key',
            provider: 'groq',
            message: `Groq auth failed with status ${res.status}`
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error reaching Groq';
        return new Response(JSON.stringify({
          status: 'unreachable',
          provider: 'groq',
          message: msg
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ status: 'unknown' }), { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
