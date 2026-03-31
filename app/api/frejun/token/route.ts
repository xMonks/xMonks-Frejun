import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const clientId = process.env.NEXT_PUBLIC_FREJUN_CLIENT_ID;
    const clientSecret = process.env.FREJUN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing Client ID or Secret in environment variables' }, { status: 500 });
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`https://api.frejun.com/api/v2/oauth/token/?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${basicAuth}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to get token' }, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
