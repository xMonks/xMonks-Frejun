import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { endpoint, method, headers, body, authType, token, email, version = 'v1' } = await request.json();
    
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`https://api.frejun.com/api/${version}${normalizedEndpoint}`);
    
    if (email) {
      url.searchParams.append('email', email);
    }

    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (authType === 'oauth' && token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`;
    } else if (authType === 'apikey') {
      const apiKey = process.env.FREJUN_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'FREJUN_API_KEY not configured in environment variables' }, { status: 500 });
      }
      fetchHeaders['Authorization'] = `Api-Key ${apiKey}`;
    } else {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const options: RequestInit = {
      method: method || 'GET',
      headers: fetchHeaders,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    
    // Handle rate limiting
    if (response.status === 429) {
      return NextResponse.json({ 
        status: 429,
        data: { error: 'Rate limit exceeded', details: await response.text() }
      }, { status: 429 });
    }

    const data = await response.json().catch(() => null);
    
    return NextResponse.json({
      status: response.status,
      data: data || { message: 'No JSON response body' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
