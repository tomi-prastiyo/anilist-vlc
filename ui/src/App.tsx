import { useState, useEffect } from 'react';
import { MonitorPlay, LogOut, MessageSquare, Check, X, AlertTriangle, Key } from 'lucide-react';
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
      setSaveStatus('Saving settings...');
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
      setSaveStatus('Settings saved successfully!');
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
        setAuthMode(true);
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
          setAuthError('Invalid PIN code or Redirect URI mismatch.');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Error verifying PIN code.');
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
            Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="panel">
        {activeTab === 'dashboard' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div className="connection-list">
              
              {/* VLC Connection */}
              <div className="connection-item">
                <div className="connection-info">
                  <div className="connection-icon vlc">
                    <MonitorPlay size={22} />
                  </div>
                  <div className="connection-details">
                    <h3>VLC Media Player</h3>
                    <p>{status?.vlc.configured ? `Monitoring port ${status.vlc.port}` : 'Not configured'}</p>
                  </div>
                </div>
                <div className={`status-indicator ${status?.vlc.configured ? 'online' : 'warning'}`}>
                  <div className="pulse-dot"></div>
                  {status?.vlc.configured ? 'Connected' : 'Missing Config'}
                </div>
              </div>

              {/* Discord Connection */}
              <div className="connection-item">
                <div className="connection-info">
                  <div className="connection-icon discord">
                    <MessageSquare size={22} />
                  </div>
                  <div className="connection-details">
                    <h3>Discord Presence</h3>
                    <p>{status?.discord.connected ? `Playing as ${status.discord.username}` : (status?.discord.error ? status.discord.error : 'Searching for Discord...')}</p>
                  </div>
                </div>
                <div className={`status-indicator ${status?.discord.connected ? 'online' : 'offline'}`}>
                  <div className="pulse-dot"></div>
                  {status?.discord.connected ? 'Active' : 'Disconnected'}
                </div>
              </div>

              {/* AniList Connection */}
              <div className="connection-item">
                <div className="connection-info">
                  <div className="connection-icon anilist">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 4"/></svg>
                  </div>
                  <div className="connection-details">
                    <h3>AniList Sync</h3>
                    <p>{status?.anilist.authenticated ? `Logged in as ${status.anilist.username}` : 'Action required to sync progress'}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {status?.anilist.authenticated ? (
                    <>
                      <div className="status-indicator online">
                        <div className="pulse-dot"></div>
                        Synced
                      </div>
                      <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Logout
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={handleLogin} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      <Key size={16} /> Login
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Inline Auth Modal */}
            {authMode && (
              <div className="auth-overlay">
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="var(--accent)" /> Authentication Required
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Please authorize the application in your browser, then paste the PIN code below.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={authCode} 
                    onChange={e => setAuthCode(e.target.value)} 
                    placeholder="Enter PIN code..."
                    style={{ flex: 1, marginBottom: 0 }}
                  />
                  <button className="btn btn-primary" onClick={handleSubmitCode}>
                    <Check size={18} /> Verify
                  </button>
                  <button className="btn btn-secondary" onClick={() => setAuthMode(false)}>
                    <X size={18} />
                  </button>
                </div>
                {authError && <p style={{ color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.85rem' }}>{authError}</p>}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => window.api?.quitApp()}>
                <LogOut size={16} /> Quit Application
              </button>
            </div>
            
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            
            <div className="settings-section">
              <h3><MonitorPlay size={20} /> VLC Player Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>HTTP Port</label>
                  <input type="text" className="form-input" value={vlcPort} onChange={e => setVlcPort(e.target.value)} placeholder="8080" />
                </div>
                <div className="form-group">
                  <label>HTTP Password</label>
                  <input type="password" className="form-input" value={vlcPw} onChange={e => setVlcPw(e.target.value)} placeholder="Password (if set)" />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3><MessageSquare size={20} /> Discord Integration</h3>
              <div className="form-group">
                <label>Discord App Client ID</label>
                <input type="text" className="form-input" value={discordId} onChange={e => setDiscordId(e.target.value)} placeholder="Optional: Use custom Discord App" />
                <span className="form-hint">Leave this blank to use the default AniList VLC Sync presence.</span>
              </div>
            </div>

            <div className="settings-section">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 4"/></svg>
                AniList API Configuration
              </h3>
              
              <div className="form-group">
                <label>AniList Username</label>
                <input type="text" className="form-input" value={anilistUsername} onChange={e => setAnilistUsername(e.target.value)} placeholder="e.g. PdBear" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Client ID</label>
                  <input type="text" className="form-input" value={anilistClientId} onChange={e => setAnilistClientId(e.target.value)} placeholder="Developer Client ID" />
                </div>
                <div className="form-group">
                  <label>Redirect URI</label>
                  <input type="text" className="form-input" value={anilistRedirectUri} onChange={e => setAnilistRedirectUri(e.target.value)} placeholder="e.g. pdbear555" />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Client Secret</label>
                <input type="password" className="form-input" value={anilistClientSecret} onChange={e => setAnilistClientSecret(e.target.value)} placeholder="Developer Client Secret" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              {saveStatus && <span style={{ color: 'var(--success)', fontSize: '0.9rem', animation: 'fadeIn 0.3s' }}>{saveStatus}</span>}
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                <Check size={18} /> Save Changes
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
