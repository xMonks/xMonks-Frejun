import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const email = searchParams.get('email');
  
  // Return HTML that posts message to opener
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Authentication Successful</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
          .card { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
          .spinner { border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h2>Authentication Successful</h2>
          <p>Completing setup... this window will close automatically.</p>
        </div>
        <script>
          // The FreJun OAuth page already posts a message to the opener,
          // but we also post one here as a fallback in case the user was redirected.
          if (window.opener) {
            window.opener.postMessage({ 
              eventName: 'oauth-code',
              data: { code: '${code || ''}', email: '${email || ''}' }
            }, '*');
            setTimeout(() => window.close(), 1000);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
