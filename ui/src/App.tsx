import { useState, useEffect } from 'react';
import { Settings, LayoutDashboard, MonitorPlay, LogOut, MessageSquare } from 'lucide-react';
import './index.css';

interface ServiceStatus {
  discord: { connected: boolean; username: string; error?: string };
  vlc: { configured: boolean; host: string; port: string };
  anilist: { authenticated: boolean; username: string };
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState<ServiceStatus | null>(null);

  // Settings State
  const [vlcPort, setVlcPort] = useState('');
  const [vlcPw, setVlcPw] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [anilistUsername, setAnilistUsername] = useState('');
  const [anilistClientId, setAnilistClientId] = useState('');
  const [anilistClientSecret, setAnilistClientSecret] = useState('');
  const [anilistRedirectUri, setAnilistRedirectUri] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Auth State
  const [authCode, setAuthCode] = useState('');
  const [authMode, setAuthMode] = useState(false);
  const [authError, setAuthError] = useState('');

  const fetchStatus = async () => {
    if (window.api) {
      const s = await window.api.getServiceStatus();
      setStatus(s);
    }
  };

  useEffect(() => {
    // Initial load
    if (window.api) {
      window.api.getConfig().then(cfg => {
        setVlcPort(cfg.vlc?.port || '8080');
        setVlcPw(cfg.vlc?.password || '');
        setDiscordId(cfg.discord?.clientId || '');
        setAnilistUsername(cfg.anilist?.username || '');
        setAnilistClientId(cfg.anilist?.clientId || '');
        setAnilistClientSecret(cfg.anilist?.clientSecret || '');
        setAnilistRedirectUri(cfg.anilist?.redirectUri || 'pdbear555');
      });
      fetchStatus();
    }

    // Auto-poll status every 3 seconds
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = async () => {
    if (window.api) {
      setSaveStatus('Saving and restarting services...');
      const newConfig = {
        vlc: { port: parseInt(vlcPort), password: vlcPw },
        discord: { clientId: discordId },
        anilist: { 
          username: anilistUsername,
          clientId: anilistClientId,
          clientSecret: anilistClientSecret,
          redirectUri: anilistRedirectUri
        }
      };
      await window.api.updateConfig(newConfig);
      await fetchStatus();
      setSaveStatus('Settings saved! Services are running with new config.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleLogin = async () => {
    if (window.api) {
      try {
        setAuthError('');
        await window.api.loginAnilist();
        setAuthMode(true);
      } catch (err: any) {
        setAuthError(err.message || 'Failed to start login. Make sure Client ID is set in Settings.');
        setAuthMode(true); // Show the auth mode panel so they can see the error
      }
    }
  };

  const handleLogout = async () => {
    if (window.api) {
      await window.api.logoutAnilist();
      await fetchStatus();
    }
  };

  const handleSubmitCode = async () => {
    if (window.api && authCode) {
      setAuthError('');
      try {
        const success = await window.api.generateToken(authCode);
        if (success) {
          setAuthMode(false);
          setAuthCode('');
          await fetchStatus();
        } else {
          setAuthError('Failed to verify code. Please ensure Client ID, Secret, and Redirect URI are correct in Settings.');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Error occurred while verifying code.');
      }
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>
          <MonitorPlay className="text-accent" />
          AniList VLC Sync
        </h1>
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <LayoutDashboard size={18} />
              Dashboard
            </div>
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <Settings size={18} />
              Settings
            </div>
          </button>
        </div>
      </div>

      <div className="panel">
        {activeTab === 'dashboard' ? (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Live System Status</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* VLC Card */}
              <div className="status-card">
                <div className="status-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
                  <MonitorPlay size={24} />
                </div>
                <div className="status-info">
                  <h3>VLC Media Player</h3>
                  <p>
                    <span className={`indicator ${status?.vlc.configured ? 'online' : 'offline'}`}></span>
                    {status?.vlc.configured ? `Monitoring on ${status.vlc.host}:${status.vlc.port}` : 'Not configured'}
                  </p>
                </div>
              </div>

              {/* Discord Card */}
              <div className="status-card">
                <div className="status-icon" style={{ background: 'rgba(88, 101, 242, 0.1)', color: '#5865F2' }}>
                  <MessageSquare size={24} />
                </div>
                <div className="status-info">
                  <h3>Discord RPC</h3>
                  <p>
                    <span className={`indicator ${status?.discord.connected ? 'online' : 'offline'}`}></span>
                    {status?.discord.connected ? `Connected as ${status.discord.username}` : (status?.discord.error ? `Error: ${status.discord.error}` : 'Disconnected (Retrying...)')}
                  </p>
                </div>
              </div>

              {/* AniList Card */}
              <div className="status-card">
                <div className="status-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 4"/></svg>
                </div>
                <div className="status-info" style={{ flex: 1 }}>
                  <h3>AniList Connection</h3>
                  <p>
                    <span className={`indicator ${status?.anilist.authenticated ? 'online' : 'offline'}`}></span>
                    {status?.anilist.authenticated ? `Logged in as ${status.anilist.username}` : 'Authentication Required'}
                  </p>
                </div>
                {status?.anilist.authenticated && (
                  <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    Logout
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              {status && !status.anilist.authenticated && !authMode && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>You need to authenticate with AniList to sync progress.</p>
                  <button className="btn btn-primary" onClick={handleLogin}>Authenticate with AniList</button>
                </div>
              )}

              {authMode && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '1rem' }}>Your browser should have opened the AniList authorization page. Please approve it, then paste the code below:</p>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={authCode} 
                    onChange={e => setAuthCode(e.target.value)} 
                    placeholder="Paste authorization code here..."
                    style={{ marginBottom: '1rem' }}
                  />
                  {authError && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{authError}</p>}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={handleSubmitCode}>Verify Code</button>
                    <button className="btn btn-secondary" onClick={() => setAuthMode(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => window.api?.quitApp()}>
                <LogOut size={18} /> Quit App
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Configuration</h2>
            
            <div className="form-group">
              <label>VLC HTTP Port</label>
              <input 
                type="text" 
                className="form-input" 
                value={vlcPort} 
                onChange={e => setVlcPort(e.target.value)} 
                placeholder="8080"
              />
            </div>

            <div className="form-group">
              <label>VLC Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={vlcPw} 
                onChange={e => setVlcPw(e.target.value)} 
                placeholder="Leave blank if none"
              />
            </div>

            <div className="form-group">
              <label>Discord Client ID (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                value={discordId} 
                onChange={e => setDiscordId(e.target.value)} 
                placeholder="Discord App ID"
              />
            </div>

            <div className="form-group">
              <label>AniList Username (Required)</label>
              <input 
                type="text" 
                className="form-input" 
                value={anilistUsername} 
                onChange={e => setAnilistUsername(e.target.value)} 
                placeholder="e.g. PdBear"
              />
            </div>

            <div className="form-group">
              <label>AniList Client ID (Required)</label>
              <input 
                type="text" 
                className="form-input" 
                value={anilistClientId} 
                onChange={e => setAnilistClientId(e.target.value)} 
                placeholder="e.g. 16101"
              />
            </div>

            <div className="form-group">
              <label>AniList Client Secret (Required)</label>
              <input 
                type="password" 
                className="form-input" 
                value={anilistClientSecret} 
                onChange={e => setAnilistClientSecret(e.target.value)} 
                placeholder="Enter your Client Secret"
              />
            </div>

            <div className="form-group">
              <label>AniList Redirect URI</label>
              <input 
                type="text" 
                className="form-input" 
                value={anilistRedirectUri} 
                onChange={e => setAnilistRedirectUri(e.target.value)} 
                placeholder="e.g. pdbear555 or https://anilist.co/api/v2/oauth/pin"
              />
              <small style={{ color: 'var(--text-muted)' }}>Must match the Redirect URI in your AniList Developer settings.</small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <span style={{ color: 'var(--success)' }}>{saveStatus}</span>
              <button className="btn btn-primary" onClick={handleSaveSettings}>Save & Restart Services</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
