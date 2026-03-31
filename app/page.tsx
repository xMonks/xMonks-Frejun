'use client';

import { useState, useEffect } from 'react';
import { Key, Lock, RefreshCw, Send, AlertCircle, CheckCircle2, LayoutDashboard, Terminal } from 'lucide-react';
import FreJunDashboard from '@/components/FreJunDashboard';

export default function FreJunExplorer() {
  const [activeTab, setActiveTab] = useState<'oauth' | 'apikey'>('oauth');
  const [mainView, setMainView] = useState<'tester' | 'dashboard'>('dashboard');
  
  // OAuth State
  const [oauthCode, setOauthCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [oauthEmail, setOauthEmail] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [oauthError, setOauthError] = useState('');

  // API Tester State
  const [endpoint, setEndpoint] = useState('/users'); // Example endpoint
  const [method, setMethod] = useState('GET');
  const [apiEmail, setApiEmail] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [apiVersion, setApiVersion] = useState('v1');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow localhost for dev and FreJun origin
      if (event.origin !== 'https://product.frejun.com' && !event.origin.includes('localhost') && !event.origin.includes('.run.app')) return;
      
      const eventData = event.data;
      if (eventData?.eventName === "oauth-code") {
        const { code, email } = eventData.data;
        if (code) {
          setOauthCode(code);
          if (email) {
            setOauthEmail(email);
            setApiEmail(email); // Auto-fill API email
          }
          exchangeCodeForTokens(code);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    setOauthError('');
    
    try {
      const clientId = process.env.NEXT_PUBLIC_FREJUN_CLIENT_ID;
      if (!clientId) {
        throw new Error('NEXT_PUBLIC_FREJUN_CLIENT_ID is not configured in environment variables.');
      }

      const redirectUri = `${window.location.origin}/api/auth/callback`;
      const authUrl = `https://product.frejun.com/oauth/authorize/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      const authWindow = window.open(
        authUrl,
        'frejun_oauth',
        'width=600,height=700'
      );

      if (!authWindow) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }
    } catch (err: any) {
      setOauthError(err.message);
      setIsAuthenticating(false);
    }
  };

  const exchangeCodeForTokens = async (code: string) => {
    try {
      const res = await fetch('/api/frejun/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to exchange code');
      
      if (data.access_token) setAccessToken(data.access_token);
      if (data.refresh_token) setRefreshToken(data.refresh_token);
      
    } catch (err: any) {
      setOauthError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!refreshToken) return;
    setIsAuthenticating(true);
    setOauthError('');
    
    try {
      const res = await fetch('/api/frejun/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to refresh token');
      
      if (data.access) setAccessToken(data.access);
      if (data.refresh) setRefreshToken(data.refresh);
      
    } catch (err: any) {
      setOauthError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleApiRequest = async () => {
    setIsRequesting(true);
    setApiResponse(null);
    
    try {
      let parsedBody = undefined;
      if (requestBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }

      const res = await fetch('/api/frejun/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          method,
          email: apiEmail,
          body: parsedBody,
          authType: activeTab,
          token: activeTab === 'oauth' ? accessToken : undefined,
          version: apiVersion
        })
      });
      
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">FreJun API Explorer</h1>
            <p className="text-neutral-500">Test and integrate with FreJun APIs using OAuth 2.0 or API Keys.</p>
          </div>
          <div className="flex bg-neutral-200 p-1 rounded-lg">
            <button
              onClick={() => setMainView('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${mainView === 'dashboard' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setMainView('tester')}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${mainView === 'tester' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <Terminal className="w-4 h-4" />
              Raw API Tester
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Auth */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-neutral-200">
                <button
                  onClick={() => setActiveTab('oauth')}
                  className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'oauth' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-neutral-500 hover:bg-neutral-50'}`}
                >
                  <Lock className="w-4 h-4" />
                  OAuth 2.0
                </button>
                <button
                  onClick={() => setActiveTab('apikey')}
                  className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'apikey' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-neutral-500 hover:bg-neutral-50'}`}
                >
                  <Key className="w-4 h-4" />
                  API Key
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'oauth' ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <p className="text-sm text-neutral-600">
                        Connect your FreJun account to generate access and refresh tokens.
                      </p>
                      
                      {!accessToken ? (
                        <button
                          onClick={handleConnect}
                          disabled={isAuthenticating}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isAuthenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                          {isAuthenticating ? 'Connecting...' : 'Connect with FreJun'}
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-green-900">Authenticated</h4>
                              {oauthEmail && <p className="text-xs text-green-700 mt-1 truncate" title={oauthEmail}>{oauthEmail}</p>}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Access Token</label>
                            <div className="p-2 bg-neutral-100 rounded border border-neutral-200 font-mono text-xs break-all text-neutral-700 max-h-24 overflow-y-auto">
                              {accessToken}
                            </div>
                          </div>

                          <button
                            onClick={handleRefreshToken}
                            disabled={isAuthenticating}
                            className="w-full py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isAuthenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Refresh Tokens
                          </button>
                        </div>
                      )}

                      {oauthError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p className="break-words">{oauthError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-600">
                      API Key authentication is configured via environment variables.
                    </p>
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-neutral-900">Required Environment Variable:</p>
                      <code className="text-xs bg-neutral-200 px-2 py-1 rounded text-neutral-800 break-all">FREJUN_API_KEY</code>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Make sure this is set in your AI Studio Secrets or .env file.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Setup Instructions */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 text-sm text-blue-900 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Setup Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                <li>Go to FreJun Settings &gt; Developer</li>
                <li>Create an OAuth App or API Key</li>
                <li>Set OAuth Callback URL to: <br/><code className="bg-blue-100 px-1 py-0.5 rounded break-all mt-1 block">{origin ? origin + '/api/auth/callback' : ''}</code></li>
                <li>Configure your environment variables</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Main View */}
          <div className="lg:col-span-8 xl:col-span-9">
            {mainView === 'dashboard' ? (
              <FreJunDashboard 
                authType={activeTab} 
                accessToken={accessToken} 
                apiEmail={apiEmail || oauthEmail} 
              />
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                  <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Raw API Request Tester
                  </h2>
                </div>
                
                <div className="p-6 space-y-5 flex-1">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>PATCH</option>
                      <option>DELETE</option>
                    </select>
                    <select 
                      value={apiVersion}
                      onChange={(e) => setApiVersion(e.target.value)}
                      className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="v1">v1</option>
                      <option value="v2">v2</option>
                    </select>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">/api/{apiVersion}</span>
                      <input 
                        type="text" 
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        placeholder="/endpoint"
                        className="w-full pl-16 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-700">Email Query Parameter (Optional)</label>
                    <input 
                      type="email" 
                      value={apiEmail}
                      onChange={(e) => setApiEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-neutral-500">Specifies which user is performing the action.</p>
                  </div>

                  {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-700">Request Body (JSON)</label>
                      <textarea 
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleApiRequest}
                    disabled={isRequesting || (activeTab === 'oauth' && !accessToken)}
                    className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRequesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Request
                  </button>

                  {/* Response Area */}
                  <div className="mt-6 space-y-2">
                    <label className="text-xs font-semibold text-neutral-700 flex justify-between items-center">
                      Response
                      {apiResponse?.status && (
                        <span className={`px-2 py-0.5 rounded text-xs ${apiResponse.status >= 200 && apiResponse.status < 300 ? 'bg-green-100 text-green-800' : apiResponse.status === 429 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                          Status: {apiResponse.status}
                        </span>
                      )}
                    </label>
                    <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto min-h-[200px] max-h-[400px] overflow-y-auto">
                      {apiResponse ? (
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                          {JSON.stringify(apiResponse.data || apiResponse, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex items-center justify-center text-neutral-600 text-sm italic">
                          Response will appear here
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
