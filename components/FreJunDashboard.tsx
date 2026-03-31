'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneCall, List, Users, Send, RefreshCw, AlertCircle, Terminal, BookOpen, UserCog, BarChart3, Tags, Hash, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as htmlToImage from 'html-to-image';

export default function FreJunDashboard({ 
  authType, 
  accessToken, 
  apiEmail 
}: { 
  authType: string, 
  accessToken: string, 
  apiEmail: string 
}) {
  const [activeTab, setActiveTab] = useState('analytics');
  
  const makeApiCall = useCallback(async (endpoint: string, method: string, body?: any, version: string = 'v1') => {
    const res = await fetch('/api/frejun/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        method,
        email: apiEmail,
        body,
        authType,
        token: accessToken,
        version
      })
    });
    return await res.json();
  }, [apiEmail, authType, accessToken]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex border-b border-neutral-200 overflow-x-auto">
        {[
          { id: 'analytics', label: 'Analytics Overview', icon: BarChart3 },
          { id: 'calling', label: 'Calling (API)', icon: Phone },
          { id: 'dialer', label: 'Dialer Widget', icon: PhoneCall },
          { id: 'logs', label: 'Call Logs', icon: List },
          { id: 'contacts', label: 'Contact Lists', icon: Users },
          { id: 'users', label: 'User Management', icon: UserCog },
          { id: 'attributes', label: 'Call Attributes', icon: Tags },
          { id: 'numbers', label: 'Number Management', icon: Hash },
          { id: 'reference', label: 'Call Reference', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[150px] py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-neutral-500 hover:bg-neutral-50'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {activeTab === 'analytics' && <AnalyticsOverviewPanel makeApiCall={makeApiCall} />}
        {activeTab === 'calling' && <CallingPanel makeApiCall={makeApiCall} apiEmail={apiEmail} />}
        {activeTab === 'dialer' && <DialerWidget accessToken={accessToken} apiEmail={apiEmail} />}
        {activeTab === 'logs' && <CallLogsPanel makeApiCall={makeApiCall} />}
        {activeTab === 'contacts' && <ContactsPanel makeApiCall={makeApiCall} apiEmail={apiEmail} />}
        {activeTab === 'users' && <UserManagementPanel makeApiCall={makeApiCall} apiEmail={apiEmail} />}
        {activeTab === 'attributes' && <CallAttributesPanel makeApiCall={makeApiCall} apiEmail={apiEmail} />}
        {activeTab === 'numbers' && <NumberManagementPanel makeApiCall={makeApiCall} />}
        {activeTab === 'reference' && <CallReferencePanel />}
      </div>
    </div>
  );
}

function CallingPanel({ makeApiCall, apiEmail }: { makeApiCall: any, apiEmail: string }) {
  const [callType, setCallType] = useState<'network' | 'voip'>('network');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  
  // Form state
  const [candidateNumber, setCandidateNumber] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [virtualNumber, setVirtualNumber] = useState('');
  const [agentId, setAgentId] = useState('');

  const handleCall = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let endpoint = '';
      let body: any = {};

      if (callType === 'network') {
        endpoint = '/integrations/create-call/';
        body = {
          user_email: apiEmail,
          candidate_number: candidateNumber,
          candidate_name: candidateName || undefined,
          virtual_number: virtualNumber || undefined
        };
      } else {
        endpoint = '/integrations/call-to-voip/';
        body = {
          agent_id: agentId,
          dstn_number: candidateNumber,
          candidate_name: candidateName || undefined,
          virtual_number: virtualNumber || undefined
        };
      }

      const res = await makeApiCall(endpoint, 'POST', body, 'v1');
      setResponse(res);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={callType === 'network'} onChange={() => setCallType('network')} className="text-blue-600" />
          <span className="text-sm font-medium">Network-based Call</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={callType === 'voip'} onChange={() => setCallType('voip')} className="text-blue-600" />
          <span className="text-sm font-medium">VoIP Call</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {callType === 'voip' && (
          <div className="space-y-1 col-span-2">
            <label className="text-xs font-semibold text-neutral-700">Agent ID *</label>
            <input type="text" value={agentId} onChange={e => setAgentId(e.target.value)} placeholder="Agent ID" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">Candidate Number *</label>
          <input type="text" value={candidateNumber} onChange={e => setCandidateNumber(e.target.value)} placeholder="+91XXXXXXXXXX" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">Candidate Name</label>
          <input type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="John Doe" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-semibold text-neutral-700">Virtual Number (Optional)</label>
          <input type="text" value={virtualNumber} onChange={e => setVirtualNumber(e.target.value)} placeholder="+91XXXXXXXXXX" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <button onClick={handleCall} disabled={loading || !candidateNumber || (callType === 'voip' && !agentId)} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex justify-center items-center gap-2">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
        Initiate {callType === 'network' ? 'Network' : 'VoIP'} Call
      </button>

      {response && (
        <div className="mt-4 p-4 bg-neutral-900 rounded-lg overflow-auto text-xs text-green-400 font-mono">
          {JSON.stringify(response, null, 2)}
        </div>
      )}
    </div>
  );
}

function DialerWidget({ accessToken, apiEmail }: { accessToken: string, apiEmail: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState('Waiting for iframe...');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://dialer.frejun.com') return;
      
      const { eventName, detail } = event.data || {};
      addLog(`Received event: ${eventName} ${detail ? `(${detail})` : ''}`);

      if (eventName === 'ready' || eventName === 'unauthorized') {
        setStatus(eventName === 'ready' ? 'Iframe Ready. Authorizing...' : 'Unauthorized. Re-authorizing...');
        
        if (iframeRef.current && accessToken && apiEmail) {
          iframeRef.current.contentWindow?.postMessage({
            eventName: 'authorize',
            data: { access_token: accessToken, user_email: apiEmail }
          }, 'https://dialer.frejun.com/');
          addLog('Sent authorize message');
        } else {
          addLog('Missing access token or email for authorization');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [accessToken, apiEmail]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Dialer Interface</h3>
        <div className="border-4 border-neutral-200 rounded-3xl overflow-hidden w-[370px] h-[600px] shadow-xl relative bg-neutral-100">
          <iframe 
            ref={iframeRef}
            id="frejun-dialer-iframe" 
            height="600" 
            width="370" 
            src="https://dialer.frejun.com/"
            allow="microphone"
            className="absolute inset-0"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Widget Status & Logs</h3>
        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium">
          Status: {status}
        </div>
        <div className="bg-neutral-900 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-xs text-green-400 space-y-1">
          {logs.length === 0 ? <span className="text-neutral-500">No logs yet...</span> : logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}

function CallLogsPanel({ makeApiCall }: { makeApiCall: any }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await makeApiCall('/integrations/calls/', 'GET', undefined, 'v1');
      setResponse(res);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <button onClick={fetchLogs} disabled={loading} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium flex items-center gap-2">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
          Fetch Call Logs
        </button>
      </div>

      {response && (
        <div className="p-4 bg-neutral-900 rounded-lg overflow-auto text-xs text-green-400 font-mono max-h-[500px]">
          {JSON.stringify(response, null, 2)}
        </div>
      )}
    </div>
  );
}

function ContactsPanel({ makeApiCall, apiEmail }: { makeApiCall: any, apiEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [contactsJson, setContactsJson] = useState('[\n  {\n    "name": "John Doe",\n    "number": "+919876543210",\n    "custom_data": { "email": "john@example.com" }\n  }\n]');

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await makeApiCall('/integrations/contact-list/', 'GET', undefined, 'v1');
      setResponse(res);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    setLoading(true);
    try {
      const contacts = JSON.parse(contactsJson);
      const res = await makeApiCall('/integrations/contact-list/', 'POST', {
        user: apiEmail,
        title,
        contacts
      }, 'v1');
      setResponse(res);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="space-y-4 p-4 border rounded-xl bg-neutral-50">
          <h3 className="font-semibold">Create Contact List</h3>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="List Title" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <textarea value={contactsJson} onChange={e => setContactsJson(e.target.value)} rows={6} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="Contacts JSON Array" />
          <button onClick={createList} disabled={loading || !title} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            Create List
          </button>
        </div>
        
        <button onClick={fetchLists} disabled={loading} className="w-full py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Fetch All Contact Lists
        </button>
      </div>

      <div className="bg-neutral-900 rounded-lg p-4 overflow-auto text-xs text-green-400 font-mono h-[500px]">
        {response ? JSON.stringify(response, null, 2) : <span className="text-neutral-500">Response will appear here...</span>}
      </div>
    </div>
  );
}

function UserManagementPanel({ makeApiCall, apiEmail }: { makeApiCall: any, apiEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [action, setAction] = useState<'create' | 'retrieve' | 'update' | 'delete' | 'list' | 'roles'>('list');

  // Form states
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [number, setNumber] = useState('');
  const [roles, setRoles] = useState('');
  const [license, setLicense] = useState('Plan');
  const [isActive, setIsActive] = useState(true);
  const [browserCalls, setBrowserCalls] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let endpoint = '';
      let method = '';
      let body: any = undefined;

      switch (action) {
        case 'create':
          endpoint = '/integrations/users/';
          method = 'POST';
          body = {
            creator: apiEmail,
            email,
            roles: roles.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r)),
            license,
            number,
            first_name: firstName,
            last_name: lastName || undefined
          };
          break;
        case 'retrieve':
          endpoint = `/integrations/user/?email=${encodeURIComponent(email)}`;
          method = 'GET';
          break;
        case 'update':
          endpoint = `/integrations/user/?email=${encodeURIComponent(email)}`;
          method = 'PATCH';
          body = {
            number: number || undefined,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            is_active: isActive,
            roles: roles ? roles.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r)) : undefined,
            browser_calls: browserCalls
          };
          // Remove undefined fields
          Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
          break;
        case 'delete':
          endpoint = `/integrations/user/?email=${encodeURIComponent(email)}`;
          method = 'DELETE';
          break;
        case 'list':
          endpoint = '/integrations/users/';
          method = 'GET';
          break;
        case 'roles':
          endpoint = '/integrations/roles/';
          method = 'GET';
          break;
      }

      const res = await makeApiCall(endpoint, method, body, 'v1');
      setResponse(res);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          {['list', 'roles', 'create', 'retrieve', 'update', 'delete'].map(a => (
            <button
              key={a}
              onClick={() => setAction(a as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${action === a ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-4 border rounded-xl bg-neutral-50">
          <h3 className="font-semibold capitalize">{action} User{action === 'roles' ? 's' : ''}</h3>
          
          {['create', 'retrieve', 'update', 'delete'].includes(action) && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Target Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          )}

          {['create', 'update'].includes(action) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">First Name {action === 'create' && '*'}</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Phone Number (E.164) {action === 'create' && '*'}</label>
                <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="+91XXXXXXXXXX" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Roles (comma separated IDs) {action === 'create' && '*'}</label>
                <input type="text" value={roles} onChange={e => setRoles(e.target.value)} placeholder="1, 2, 3" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              {action === 'create' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">License *</label>
                  <select value={license} onChange={e => setLicense(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="Plan">Plan</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              )}

              {action === 'update' && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded text-blue-600" />
                    <span className="text-sm font-medium text-neutral-700">Is Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={browserCalls} onChange={e => setBrowserCalls(e.target.checked)} className="rounded text-blue-600" />
                    <span className="text-sm font-medium text-neutral-700">Browser Calls</span>
                  </label>
                </div>
              )}
            </>
          )}

          <button 
            onClick={handleAction} 
            disabled={loading || (['create', 'retrieve', 'update', 'delete'].includes(action) && !email)} 
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Execute {action}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-4 overflow-auto text-xs text-green-400 font-mono h-[500px]">
        {response ? JSON.stringify(response, null, 2) : <span className="text-neutral-500">Response will appear here...</span>}
      </div>
    </div>
  );
}

function CallReferencePanel() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Call Statuses</h2>
        <p className="text-sm text-neutral-600">
          When retrieving call logs or receiving webhook events, each call includes a status field that indicates the current or final state of the call.
        </p>
        
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-neutral-100 text-neutral-700">
              <tr>
                <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Status</th>
                <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Explanation</th>
                <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Call Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {[
                { status: 'call-initiating...', exp: 'The call is being initiated and has not yet connected.', dir: 'Inbound / Outbound' },
                { status: 'answered', exp: 'The call was successfully answered by the recipient.', dir: 'Inbound / Outbound' },
                { status: 'not-answered', exp: 'The client did not answer the call, resulting in a missed call.', dir: 'Outbound' },
                { status: 'not-initiated', exp: 'The call failed to initiate, typically due to a server issue. This status is rare and should not be relied upon for application logic.', dir: 'Inbound / Outbound' },
                { status: 'ongoing..', exp: 'The call is currently active, with both the client and the FreJun user connected.', dir: 'Inbound / Outbound' },
                { status: 'user-busy', exp: 'The FreJun user associated with the Virtual Number did not answer the incoming call.', dir: 'Inbound' },
                { status: 'busy', exp: 'The client rejected the call, either because they were on another call or chose to decline.', dir: 'Outbound' },
                { status: 'not_available', exp: 'A fallback status for outbound calls when no other valid response is received from the carrier.', dir: 'Outbound' },
                { status: 'user-not-available / not-reachable', exp: 'The client was unable to reach the FreJun user, possibly due to network issues or the user being offline.', dir: 'Inbound' },
                { status: 'user-not-answered', exp: 'A fallback status for inbound calls when no other valid response is received.', dir: 'Inbound' },
                { status: 'blocked', exp: "The client's number has been added to the block list by the FreJun user, preventing the call from connecting.", dir: 'Inbound' },
                { status: 'DND / DNCR', exp: 'The dialed number is registered on the Do Not Call Registry (DNCR). This status is specific to UAE regulations.', dir: 'Outbound' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{row.status}</td>
                  <td className="px-4 py-3 text-neutral-600">{row.exp}</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">{row.dir}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2">
          <BookOpen className="w-5 h-5 shrink-0 mt-0.5" />
          <p><strong>Tip:</strong> You can use these statuses to filter and categorize calls in your application.</p>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900">Call Creator</h2>
        <p className="text-sm text-neutral-600">
          The creator field in call logs identifies which FreJun user is associated with a particular call. The value of this field depends on how your Virtual Number (VN) is configured and how the call was routed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-neutral-800">Single User</h3>
            <p className="text-sm text-neutral-600">When a single user is assigned to handle inbound calls for a Virtual Number, that user&apos;s email address is automatically set as the creator for all calls to that number.</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-neutral-800">Team</h3>
            <p className="text-sm text-neutral-600">When a team is configured for a Virtual Number, the creator is determined based on the call routing method:</p>
            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
              <li><strong>Simultaneous Ring:</strong> All team members receive the call at the same time. The creator is set to the email address of the user who actually answers the call.</li>
              <li><strong>Other Routing Methods:</strong> For round-robin or sequential routing, the creator is set to the email address of the user who received the call — regardless of whether they answered it or not.</li>
            </ul>
            <div className="bg-neutral-100 p-2 rounded text-xs text-neutral-700 mt-2">
              <strong>Info:</strong> If no team member answers the call, the creator field remains empty.
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <h3 className="font-semibold text-neutral-800">IVR</h3>
            <p className="text-sm text-neutral-600">When calls are routed through an IVR (Interactive Voice Response) menu, the creator is determined as follows:</p>
            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
              <li><strong>User Connected:</strong> If the IVR flow eventually connects the caller to a specific FreJun user, that user&apos;s email address becomes the creator.</li>
              <li><strong>Team Connected:</strong> If the IVR routes the call to a team, the creator is determined using the same rules described in the Team section above.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsOverviewPanel({ makeApiCall }: { makeApiCall: any }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const agentPerformanceRef = useRef<HTMLDivElement>(null);
  const durationSummaryRef = useRef<HTMLDivElement>(null);

  const downloadAsImage = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to save image:', err);
    }
  };

  const fetchAnalyticsInternal = useCallback(async (start: string, end: string) => {
    if (!start || !end) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch analytics first as it's the primary data
      const analyticsRes = await makeApiCall(`/integrations/call-analytics/?date_start=${start}&date_end=${end}`, 'GET', undefined, 'v1');
      
      if (analyticsRes.error || analyticsRes.data?.success === false) {
        throw new Error(analyticsRes.error || analyticsRes.data?.message || 'Failed to fetch analytics data');
      }

      // Fetch call logs for pivot table - try with different date parameters if needed
      let rawCalls: any[] = [];
      let page = 1;
      let hasNext = true;
      
      const extractCalls = (res: any) => {
        const resData = res?.data;
        if (Array.isArray(resData)) return resData;
        if (resData && typeof resData === 'object') {
          return resData.results || resData.data || resData.calls || resData.call_logs || 
                 (resData.data && Array.isArray(resData.data) ? resData.data : (resData.data?.results || []));
        }
        return [];
      };

      // Try to fetch up to 30 pages to get all calls for the date range
      // We pass multiple common date parameters to maximize chances of the API applying the filter
      while (hasNext && page <= 30) {
        const callsRes = await makeApiCall(`/integrations/calls/?page=${page}&limit=100&page_size=100&date_start=${start}&date_end=${end}&start_date=${start}&end_date=${end}&created_at__gte=${start}&created_at__lte=${end}`, 'GET', undefined, 'v1');
        
        const pageCalls = extractCalls(callsRes);
        if (pageCalls.length > 0) {
          rawCalls = [...rawCalls, ...pageCalls];
        }
        
        const resData = callsRes?.data;
        if (resData && typeof resData === 'object' && resData.next) {
          page++;
        } else if (pageCalls.length >= 10) { 
          // If it returned at least 10 (default page size), there might be more
          page++;
        } else {
          hasNext = false;
        }
      }
      
      if (!Array.isArray(rawCalls)) {
        rawCalls = [];
      }
      
      // Client-side filtering to ensure calls are within the selected date range
      // and only include answered calls to match agent performance details
      const startDateTime = new Date(start).getTime();
      const endDateTime = new Date(end);
      endDateTime.setHours(23, 59, 59, 999);
      const endDateTimeMs = endDateTime.getTime();

      rawCalls = rawCalls.filter((rawCall: any) => {
        const call = rawCall.call || rawCall.node || rawCall.data || rawCall;
        
        // Filter for answered calls only
        const status = (call.status || '').toLowerCase();
        const duration = parseInt(call.call_duration || call['Total Minutes'] || call.total_minutes || call.duration || '0', 10);
        
        const isAnswered = status === 'answered' || status === 'ongoing..' || duration > 0;
        if (!isAnswered) return false;

        const startTimeStr = call.call_start_time || call['Start Time'] || call.start_time || call.created_at || call.date || call.timestamp || call.call_time || call.call_date || call.startTime || call.createdAt || call.time || call.Date || call['Date'] || call.start;
        
        if (!startTimeStr) return false;
        
        try {
          const callTime = new Date(startTimeStr).getTime();
          if (isNaN(callTime)) return false;
          return callTime >= startDateTime && callTime <= endDateTimeMs;
        } catch (e) {
          return false;
        }
      });
      
      const pivotMap: Record<string, any> = {};
      let processedCount = 0;
      let skippedCount = 0;
      
      rawCalls.forEach((rawCall: any) => {
        const call = rawCall.call || rawCall.node || rawCall.data || rawCall;
        
        // Extract caller and date
        let caller = call.recruiter || call.creator_number || call.virtual_number || call.Caller || call.caller || call.agent_email || call.user || call.agent_name || call.agent || call.from || call.creator;
        if (!caller || caller === 'null') {
          caller = call.candidate_number || call.id || 'Unknown';
        }
        
        let startTimeStr = call.call_start_time || call['Start Time'] || call.start_time || call.created_at || call.date || call.timestamp || call.call_time || call.call_date || call.startTime || call.createdAt || call.time || call.Date || call['Date'] || call.start;
        
        if (!startTimeStr) {
          skippedCount++;
          return; // Skip if no start time
        } else {
          // Ensure it's a valid date string, otherwise skip
          try {
            new Date(startTimeStr).toISOString();
          } catch (e) {
            skippedCount++;
            return;
          }
        }
        
        processedCount++;
        const date = new Date(startTimeStr).toISOString().split('T')[0];
        
        // Parse duration
        const durationValue = call.call_duration || call['Total Minutes'] || call.total_minutes || call.duration || call.billsec || call.Duration || call['Duration'] || call.total_duration || '0';
        let seconds = 0;
        
        if (typeof durationValue === 'number') {
          seconds = durationValue; 
        } else {
          const str = String(durationValue).toLowerCase();
          let m = 0, s = 0;
          const mMatch = str.match(/(\d+)\s*m/);
          const sMatch = str.match(/(\d+)\s*s/);
          
          if (mMatch) m = parseInt(mMatch[1], 10);
          if (sMatch) s = parseInt(sMatch[1], 10);
          
          if (!mMatch && !sMatch) {
            // Check for HH:MM:SS or MM:SS format
            const parts = str.split(':');
            if (parts.length === 3) {
              seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
            } else if (parts.length === 2) {
              seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            } else if (!isNaN(Number(str))) {
              seconds = Number(str);
            }
          } else {
            seconds = m * 60 + s;
          }
        }
        
        // Categorize
        let category = '> 90s';
        if (seconds < 30) category = '< 30s';
        else if (seconds <= 90) category = '30s - 90s';
        
        const key = `${caller}_${date}`;
        if (!pivotMap[key]) {
          pivotMap[key] = { caller, date, '< 30s': 0, '30s - 90s': 0, '> 90s': 0, total: 0 };
        }
        pivotMap[key][category] += 1;
        pivotMap[key].total += 1;
      });
      
      const pivotData = Object.values(pivotMap).sort((a: any, b: any) => 
        a.date.localeCompare(b.date) || a.caller.localeCompare(b.caller)
      );

      setData({
        analytics: analyticsRes.data || {},
        pivotData,
        debug: {
          rawCallsCount: rawCalls.length,
          processedCount,
          skippedCount,
          pivotRows: pivotData.length,
          sampleKeys: rawCalls.length > 0 ? Object.keys(rawCalls[0]).join(', ') : 'none'
        }
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Analytics Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  const fetchAnalytics = () => {
    fetchAnalyticsInternal(dateStart, dateEnd);
  };

  const applyQuickFilter = (filter: 'today' | 'yesterday' | 'this_week') => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (filter === 'today') {
      // start and end are already today
    } else if (filter === 'yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (filter === 'this_week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      start = new Date(today.setDate(diff));
      end = new Date(); // end is today
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    setDateStart(startStr);
    setDateEnd(endStr);
    fetchAnalyticsInternal(startStr, endStr);
  };

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const start = lastWeek.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];
    
    setDateStart(start);
    setDateEnd(end);
    
    // Initial fetch
    const timer = setTimeout(() => {
      fetchAnalyticsInternal(start, end);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fetchAnalyticsInternal]);

  // Transform data for charts
  const rawAnalyticsArray = Array.isArray(data?.analytics) 
    ? data.analytics 
    : (Array.isArray(data?.analytics?.data) 
        ? data.analytics.data 
        : (data?.analytics?.agent_analytics || []));

  const chartData = rawAnalyticsArray.map((item: any) => ({
    name: item.user || item.agent_name || item.agent_email || 'Unknown',
    email: item.user || item.agent_email || 'N/A',
    totalCalls: item.total_calls || 0,
    answered: item.answered_calls || 0,
    missed: item.missed_calls ?? ((item.total_calls || 0) - (item.answered_calls || 0)),
    duration: Math.round(parseFloat(item.total_minutes || '0') || ((item.total_duration || 0) / 60)) // in minutes
  }));

  const agentsList = rawAnalyticsArray;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">Start Date</label>
          <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">End Date</label>
          <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white" />
        </div>
        <button onClick={fetchAnalytics} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 h-[38px]">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Analyze Performance
        </button>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => applyQuickFilter('today')} disabled={loading} className="px-3 py-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium h-[38px]">
            Today
          </button>
          <button onClick={() => applyQuickFilter('yesterday')} disabled={loading} className="px-3 py-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium h-[38px]">
            Yesterday
          </button>
          <button onClick={() => applyQuickFilter('this_week')} disabled={loading} className="px-3 py-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium h-[38px]">
            This Week
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
              <h4 className="text-sm font-medium text-neutral-500 mb-1">Total Agents</h4>
              <p className="text-3xl font-bold text-neutral-900">{agentsList.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
              <h4 className="text-sm font-medium text-neutral-500 mb-1">Total Calls</h4>
              <p className="text-3xl font-bold text-neutral-900">
                {chartData.reduce((acc: number, curr: any) => acc + curr.totalCalls, 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
              <h4 className="text-sm font-medium text-neutral-500 mb-1">Total Duration (mins)</h4>
              <p className="text-3xl font-bold text-neutral-900">
                {chartData.reduce((acc: number, curr: any) => acc + curr.duration, 0)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Agent Performance (Calls)</h3>
            <div className="h-[400px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                    <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="answered" name="Answered" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="missed" name="Missed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                  No analytics data available for the selected period.
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm" ref={agentPerformanceRef}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-neutral-900">Agent Performance Details</h3>
              <button 
                onClick={() => downloadAsImage(agentPerformanceRef, 'agent-performance-details')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                title="Save as Image"
              >
                <Download className="w-3.5 h-3.5" />
                Save as Image
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-neutral-50 text-neutral-700">
                  <tr>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Name</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Email</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Total Calls</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Answered</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Missed</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {chartData.map((agent: any, i: number) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{agent.name}</td>
                      <td className="px-4 py-3 text-neutral-600">{agent.email}</td>
                      <td className="px-4 py-3 text-neutral-600 font-mono">{agent.totalCalls}</td>
                      <td className="px-4 py-3 text-green-600 font-mono">{agent.answered}</td>
                      <td className="px-4 py-3 text-red-600 font-mono">{agent.missed}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {agent.duration} mins
                        </span>
                      </td>
                    </tr>
                  ))}
                  {chartData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">No agents found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm mt-8" ref={durationSummaryRef}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-neutral-900">Duration Summary (Pivot Table)</h3>
              <button 
                onClick={() => downloadAsImage(durationSummaryRef, 'duration-summary')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                title="Save as Image"
              >
                <Download className="w-3.5 h-3.5" />
                Save as Image
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-neutral-50 text-neutral-700">
                  <tr>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Caller</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold">Date</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold text-center">&lt; 30s</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold text-center">30s - 90s</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold text-center">&gt; 90s</th>
                    <th className="px-4 py-3 border-b border-neutral-200 font-semibold text-center">Total Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {(data?.pivotData || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900 max-w-xs truncate" title={row.caller}>{row.caller}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.date}</td>
                      <td className="px-4 py-3 text-center font-mono text-neutral-700">{row['< 30s']}</td>
                      <td className="px-4 py-3 text-center font-mono text-neutral-700">{row['30s - 90s']}</td>
                      <td className="px-4 py-3 text-center font-mono text-neutral-700">{row['> 90s']}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-neutral-900">{row.total}</td>
                    </tr>
                  ))}
                  {(!data?.pivotData || data.pivotData.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">No call duration data found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Raw API Response (Debug)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Analytics Data</h4>
                <pre className="bg-neutral-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(data.analytics, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Calls Data (Sample)</h4>
                <pre className="bg-neutral-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(data.callsRes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CallAttributesPanel({ makeApiCall, apiEmail }: { makeApiCall: any, apiEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [action, setAction] = useState<'retrieve' | 'create' | 'delete'>('retrieve');

  const [outcomes, setOutcomes] = useState('');
  const [reasons, setReasons] = useState('');
  const [tags, setTags] = useState('');

  const handleAction = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let endpoint = `/integrations/organization-detail-api/?email=${encodeURIComponent(apiEmail)}`;
      let method = 'GET';
      let body: any = undefined;

      const parseList = (str: string) => str.split(',').map(s => s.trim()).filter(s => s);

      if (action === 'create') {
        method = 'POST';
        body = {
          call_outcomes: parseList(outcomes),
          call_reasons: parseList(reasons),
          tags: parseList(tags)
        };
      } else if (action === 'delete') {
        method = 'PATCH';
        body = {
          call_outcomes_to_remove: parseList(outcomes),
          call_reasons_to_remove: parseList(reasons),
          tags_to_remove: parseList(tags)
        };
      }

      const res = await makeApiCall(endpoint, method, body, 'v1');
      setResponse(res);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex gap-2">
          {['retrieve', 'create', 'delete'].map(a => (
            <button
              key={a}
              onClick={() => setAction(a as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${action === a ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {a} Attributes
            </button>
          ))}
        </div>

        <div className="space-y-4 p-4 border rounded-xl bg-neutral-50">
          <h3 className="font-semibold capitalize">{action} Call Attributes</h3>
          
          {['create', 'delete'].includes(action) && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Call Outcomes (comma separated)</label>
                <input type="text" value={outcomes} onChange={e => setOutcomes(e.target.value)} placeholder="Interested, Not Interested" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Call Reasons (comma separated)</label>
                <input type="text" value={reasons} onChange={e => setReasons(e.target.value)} placeholder="Sales, Support" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Tags (comma separated)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="VIP, Follow-up" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </>
          )}

          <button 
            onClick={handleAction} 
            disabled={loading} 
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Execute {action}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-4 overflow-auto text-xs text-green-400 font-mono h-[500px]">
        {response ? JSON.stringify(response, null, 2) : <span className="text-neutral-500">Response will appear here...</span>}
      </div>
    </div>
  );
}

function NumberManagementPanel({ makeApiCall }: { makeApiCall: any }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [action, setAction] = useState<'retrieve' | 'assign'>('retrieve');

  const [userId, setUserId] = useState('');
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [outboundIds, setOutboundIds] = useState('');
  const [inboundIds, setInboundIds] = useState('');

  const handleAction = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let endpoint = '';
      let method = '';
      let body: any = undefined;

      if (action === 'retrieve') {
        endpoint = '/integrations/retrieve-virtual-numbers/';
        method = 'GET';
      } else {
        endpoint = '/integrations/assign-virtual-numbers/';
        method = 'POST';
        body = {
          user_id: userId,
          operation,
          outbound_cvn_ids: outboundIds ? outboundIds.split(',').map(s => s.trim()) : [],
          inbound_cvn_ids: inboundIds ? inboundIds.split(',').map(s => s.trim()) : []
        };
      }

      const res = await makeApiCall(endpoint, method, body, 'v1');
      setResponse(res);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setAction('retrieve')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${action === 'retrieve' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            Retrieve Numbers
          </button>
          <button
            onClick={() => setAction('assign')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${action === 'assign' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            Assign Numbers
          </button>
        </div>

        <div className="space-y-4 p-4 border rounded-xl bg-neutral-50">
          <h3 className="font-semibold">{action === 'retrieve' ? 'Retrieve Virtual Numbers' : 'Assign Virtual Numbers'}</h3>
          
          {action === 'assign' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">User ID *</label>
                <input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder="user123" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Operation *</label>
                <select value={operation} onChange={e => setOperation(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="add">Add (Assign)</option>
                  <option value="remove">Remove (Unassign)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Outbound CVN IDs (comma separated)</label>
                <input type="text" value={outboundIds} onChange={e => setOutboundIds(e.target.value)} placeholder="vn_abc123, vn_def456" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Inbound CVN IDs (comma separated)</label>
                <input type="text" value={inboundIds} onChange={e => setInboundIds(e.target.value)} placeholder="vn_abc123" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </>
          )}

          <button 
            onClick={handleAction} 
            disabled={loading || (action === 'assign' && !userId)} 
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {action === 'retrieve' ? 'Retrieve' : 'Execute Assignment'}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-4 overflow-auto text-xs text-green-400 font-mono h-[500px]">
        {response ? JSON.stringify(response, null, 2) : <span className="text-neutral-500">Response will appear here...</span>}
      </div>
    </div>
  );
}
