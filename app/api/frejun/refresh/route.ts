import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();
    const clientId = process.env.NEXT_PUBLIC_FREJUN_CLIENT_ID;
    const clientSecret = process.env.FREJUN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing Client ID or Secret in environment variables' }, { status: 500 });
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`https://api.frejun.com/api/v2/oauth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refresh_token })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to refresh token' }, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
