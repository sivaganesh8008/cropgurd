import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sprout, CloudSun, MapPin, Leaf, MessageCircle, History, LogOut, Plus, RefreshCw, Send, CheckCircle2, AlertTriangle, Droplets, Sun, Thermometer, Wind, ChevronDown, Database } from 'lucide-react';

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

async function api(path, token, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

const initialFarm = {
  farm_name: '',
  location: '',
  latitude: '14.4673',
  longitude: '78.8242',
  land_area: '',
  soil_type: 'Unknown',
  water_availability: 'Limited / rainfed',
  season: 'Kharif / monsoon',
  current_crop: '',
};

const languageOptions = ['English', 'Telugu', 'Hindi', 'Kannada', 'Tamil'];

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem('farmpulse_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [farmForm, setFarmForm] = useState(initialFarm);
  const [showFarmForm, setShowFarmForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [weather, setWeather] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [language, setLanguage] = useState('English');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I can explain your farm information and crop suggestions. Ask a question to get started.' },
  ]);
  const [chatBusy, setChatBusy] = useState(false);
  const [health, setHealth] = useState(null);

  const token = session?.access_token;
  const selectedFarm = useMemo(() => farms.find((farm) => farm.farm_id === selectedFarmId), [farms, selectedFarmId]);

  useEffect(() => {
    api('/api/health')
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', ai_model_loaded: false, database_configured: false }));
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const [farmData, historyData] = await Promise.all([
        api('/api/farms', token),
        api('/api/recommendations', token),
      ]);
      setFarms(farmData.farms || []);
      setHistory(historyData.recommendations || []);
      setSelectedFarmId((current) =>
        current && farmData.farms.some((f) => f.farm_id === current) ? current : farmData.farms?.[0]?.farm_id || ''
      );
    } catch (e) {
      if (e.message && e.message.includes('session')) {
        logout();
      }
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setWeather(null);
    setRecommendation(null);
  }, [selectedFarmId]);

  async function handleAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setError('');
    setNotice('');
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const result = await api(endpoint, null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('farmpulse_session', JSON.stringify(result.session));
      setSession(result.session);
      setNotice(authMode === 'signup' ? 'Account created! Welcome to FarmPulse.' : 'Signed in successfully.');
    } catch (e) {
      setError(e.message || 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem('farmpulse_session');
    setSession(null);
    setFarms([]);
    setSelectedFarmId('');
    setRecommendation(null);
    setWeather(null);
  }

  async function createFarm(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...farmForm,
        latitude: farmForm.latitude === '' ? null : Number(farmForm.latitude),
        longitude: farmForm.longitude === '' ? null : Number(farmForm.longitude),
        land_area: farmForm.land_area === '' ? null : Number(farmForm.land_area),
      };
      const result = await api('/api/farms', token, { method: 'POST', body: JSON.stringify(payload) });
      setFarms((current) => [result.farm, ...current]);
      setSelectedFarmId(result.farm.farm_id);
      setShowFarmForm(false);
      setFarmForm(initialFarm);
      setNotice('Farm profile saved to local SQLite database.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadWeather() {
    if (!selectedFarmId) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api(`/api/weather?farm_id=${encodeURIComponent(selectedFarmId)}`, token);
      setWeather(result);
      setNotice('Weather loaded. Check the update time before using it for decisions.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function generateRecommendations() {
    if (!selectedFarmId) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/api/recommendations', token, {
        method: 'POST',
        body: JSON.stringify({ farm_id: selectedFarmId }),
      });
      setRecommendation(result.recommendation);
      setNotice('Suggestions generated and saved to your history.');
      const h = await api('/api/recommendations', token);
      setHistory(h.recommendations || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendChat(event) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatBusy) return;
    setChatMessages((current) => [...current, { role: 'user', text: message }]);
    setChatInput('');
    setChatBusy(true);
    setError('');
    try {
      const result = await api('/api/chat', token, {
        method: 'POST',
        body: JSON.stringify({ message, language, farm_id: selectedFarmId || null }),
      });
      setChatMessages((current) => [...current, { role: 'assistant', text: result.answer, model: result.model }]);
    } catch (e) {
      setChatMessages((current) => [
        ...current,
        { role: 'assistant', text: `I couldn't reach the local AI model: ${e.message}` },
      ]);
    } finally {
      setChatBusy(false);
    }
  }

  if (!authReady) {
    return (
      <div className="center-screen">
        <div className="loading-mark">
          <Sprout size={30} />
        </div>
        <p>Preparing your farm workspace…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-layout">
        <div className="auth-visual">
          <Brand light />
          <div className="auth-hero">
            <div className="eyebrow">SMART AGRICULTURE · TEAM VAJRA</div>
            <h1>Better farm decisions start with better information.</h1>
            <p>Bring farm details, local weather and explainable crop suggestions into one simple workspace.</p>
            <div className="auth-points">
              <span><CloudSun size={18} /> Local weather</span>
              <span><Leaf size={18} /> Crop suggestions</span>
              <span><MessageCircle size={18} /> Local AI assistant</span>
              <span><Database size={18} /> SQLite local storage</span>
            </div>
          </div>
          <div className="auth-foot">Prototype · Problem ID IC26-01-10</div>
        </div>
        <div className="auth-panel">
          <form className="auth-form" onSubmit={handleAuth}>
            <div className="eyebrow">YOUR FARM WORKSPACE</div>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="muted">
              {authMode === 'login'
                ? 'Sign in to view your farm profiles and saved recommendations.'
                : 'Create a local account to save your farm details securely in SQLite.'}
            </p>
            {error && <Notice type="error" text={error} />}
            {notice && <Notice text={notice} />}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
            <button className="button primary full" disabled={authBusy}>
              {authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            <p className="switch-auth">
              {authMode === 'login' ? 'New to FarmPulse?' : 'Already have an account?'}{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setError('');
                  setNotice('');
                }}
              >
                {authMode === 'login' ? 'Create an account' : 'Sign in'}
              </button>
            </p>
            <p className="tiny muted">
              Data is stored locally in <code>backend/farmpulse.db</code> (SQLite). No cloud database setup required.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">WORKSPACE</div>
        <button className="nav-item active">
          <Sprout size={18} /> Overview
        </button>
        <button className="nav-item" onClick={() => setShowFarmForm(true)}>
          <MapPin size={18} /> Farm profiles
        </button>
        <button
          className="nav-item"
          onClick={() => document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Leaf size={18} /> Crop suggestions
        </button>
        <button
          className="nav-item"
          onClick={() => document.getElementById('assistant')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <MessageCircle size={18} /> AI assistant
        </button>
        <button
          className="nav-item"
          onClick={() => document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <History size={18} /> History
        </button>

        <div className="sidebar-bottom">
          <div className="connection">
            <span className={`status-dot ${health?.status === 'ok' ? 'online' : ''}`} />
            <div>
              <strong>Local AI</strong>
              <small>{health?.status === 'ok' ? health.ai_model : 'Not connected'}</small>
            </div>
          </div>
          <div className="connection">
            <span className={`status-dot ${health?.database_configured ? 'online' : ''}`} />
            <div>
              <strong>Database</strong>
              <small>{health?.database || 'SQLite'}</small>
            </div>
          </div>
          <button className="nav-item logout" onClick={logout}>
            <LogOut size={17} /> Sign out
          </button>
          <div className="team-label">
            TEAM VAJRA <span>IC26-01-10</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">FARM MANAGEMENT</div>
            <h1>Farm overview</h1>
          </div>
          <div className="user-pill">
            <div className="avatar">{(session.user?.email || 'F')[0].toUpperCase()}</div>
            <div>
              <strong>{session.user?.email}</strong>
              <small>Farmer account · SQLite</small>
            </div>
            <button className="icon-button" title="Sign out" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {error && <Notice type="error" text={error} onClose={() => setError('')} />}
        {notice && <Notice text={notice} onClose={() => setNotice('')} />}

        <section className="welcome-banner">
          <div className="welcome-copy">
            <div className="eyebrow light-eyebrow">YOUR FIELD, YOUR INFORMATION</div>
            <h2>Make your next farm decision with more confidence.</h2>
            <p>Review local conditions, compare possible crops and ask questions in your preferred language.</p>
            <button
              className="button light-button"
              onClick={() => {
                setShowFarmForm(true);
                document.getElementById('farm-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Plus size={17} /> Add farm profile
            </button>
          </div>
          <div className="banner-art">
            <div className="sun-disc">
              <Sun size={30} />
            </div>
            <div className="field field-one" />
            <div className="field field-two" />
            <div className="field field-three" />
            <Sprout className="banner-sprout" size={72} strokeWidth={1.2} />
          </div>
        </section>

        <div className="section-heading">
          <div>
            <h2>Your farms</h2>
            <p>Farm details power your weather and crop suggestions.</p>
          </div>
          <button className="button secondary" onClick={() => setShowFarmForm(!showFarmForm)}>
            <Plus size={16} /> Add farm
          </button>
        </div>

        {showFarmForm && (
          <section className="panel farm-form-panel" id="farm-form">
            <div className="panel-heading">
              <div>
                <h3>New farm profile</h3>
                <p>Leave unknown fields as they are; add coordinates for weather.</p>
              </div>
              <button className="icon-button" onClick={() => setShowFarmForm(false)}>
                ×
              </button>
            </div>
            <form className="farm-form" onSubmit={createFarm}>
              <label>
                Farm name *
                <input
                  required
                  value={farmForm.farm_name}
                  onChange={(e) => setFarmForm({ ...farmForm, farm_name: e.target.value })}
                  placeholder="e.g. Family farm"
                />
              </label>
              <label>
                Village / location
                <input
                  value={farmForm.location}
                  onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
                  placeholder="Village, district"
                />
              </label>
              <label>
                Latitude
                <input
                  type="number"
                  step="any"
                  value={farmForm.latitude}
                  onChange={(e) => setFarmForm({ ...farmForm, latitude: e.target.value })}
                  placeholder="14.4673"
                />
              </label>
              <label>
                Longitude
                <input
                  type="number"
                  step="any"
                  value={farmForm.longitude}
                  onChange={(e) => setFarmForm({ ...farmForm, longitude: e.target.value })}
                  placeholder="78.8242"
                />
              </label>
              <label>
                Land area (acres)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={farmForm.land_area}
                  onChange={(e) => setFarmForm({ ...farmForm, land_area: e.target.value })}
                  placeholder="e.g. 2.5"
                />
              </label>
              <label>
                Soil type
                <select
                  value={farmForm.soil_type}
                  onChange={(e) => setFarmForm({ ...farmForm, soil_type: e.target.value })}
                >
                  <option>Unknown</option>
                  <option>Sandy soil</option>
                  <option>Loamy soil</option>
                  <option>Black soil</option>
                  <option>Clay soil</option>
                  <option>Red soil</option>
                  <option>Alluvial soil</option>
                </select>
              </label>
              <label>
                Water availability
                <select
                  value={farmForm.water_availability}
                  onChange={(e) => setFarmForm({ ...farmForm, water_availability: e.target.value })}
                >
                  <option>Unknown</option>
                  <option>Limited / rainfed</option>
                  <option>Moderate</option>
                  <option>Good / assured irrigation</option>
                </select>
              </label>
              <label>
                Season
                <select
                  value={farmForm.season}
                  onChange={(e) => setFarmForm({ ...farmForm, season: e.target.value })}
                >
                  <option>Unknown</option>
                  <option>Kharif / monsoon</option>
                  <option>Rabi / winter</option>
                  <option>Summer</option>
                </select>
              </label>
              <label>
                Current crop
                <input
                  value={farmForm.current_crop}
                  onChange={(e) => setFarmForm({ ...farmForm, current_crop: e.target.value })}
                  placeholder="Optional"
                />
              </label>
              <div className="form-actions">
                <button type="button" className="button secondary" onClick={() => setShowFarmForm(false)}>
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save farm profile'}
                </button>
              </div>
            </form>
          </section>
        )}

        {farms.length === 0 ? (
          <section className="empty-state panel">
            <div className="empty-icon">
              <Sprout size={28} />
            </div>
            <h3>Your first farm starts here</h3>
            <p>Add a farm profile to connect weather, crop suggestions and the AI assistant to your farm details.</p>
            <button className="button primary" onClick={() => setShowFarmForm(true)}>
              <Plus size={17} /> Create farm profile
            </button>
          </section>
        ) : (
          <>
            <section className="farm-selector panel">
              <div className="farm-icon">
                <MapPin size={21} />
              </div>
              <div className="farm-select-copy">
                <span className="small-label">SELECTED FARM</span>
                <div className="select-wrap">
                  <select
                    aria-label="Selected farm"
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                  >
                    {farms.map((farm) => (
                      <option key={farm.farm_id} value={farm.farm_id}>
                        {farm.farm_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
                <p>
                  {selectedFarm?.location || 'Location not added'}{' '}
                  {selectedFarm?.land_area ? `· ${selectedFarm.land_area} acres` : ''}
                </p>
              </div>
              <div className="farm-tags">
                <span>{selectedFarm?.soil_type || 'Soil unknown'}</span>
                <span>{selectedFarm?.season || 'Season unknown'}</span>
              </div>
            </section>

            <div className="section-heading compact">
              <div>
                <h2>Field conditions</h2>
                <p>Latest weather is fetched from Open-Meteo.</p>
              </div>
              <button className="button secondary" disabled={busy || !selectedFarm} onClick={loadWeather}>
                <RefreshCw size={15} /> Load weather
              </button>
            </div>

            <section className="weather-grid">
              {weather ? (
                <>
                  <div className="weather-main panel">
                    <div className="weather-top">
                      <div>
                        <span className="small-label">CURRENT CONDITIONS</span>
                        <h3>{selectedFarm?.location || selectedFarm?.farm_name}</h3>
                      </div>
                      <CloudSun size={28} />
                    </div>
                    <div className="temperature">
                      {Math.round(weather.weather.current.temperature_2m)}
                      <span>°C</span>
                    </div>
                    <p className="weather-caption">
                      Feels like {weather.weather.current.apparent_temperature}°C · Open-Meteo
                    </p>
                    <div className="weather-metrics">
                      <Metric
                        icon={<Droplets size={17} />}
                        label="Humidity"
                        value={`${weather.weather.current.relative_humidity_2m}%`}
                      />
                      <Metric
                        icon={<Wind size={17} />}
                        label="Wind"
                        value={`${weather.weather.current.wind_speed_10m} km/h`}
                      />
                      <Metric
                        icon={<Thermometer size={17} />}
                        label="Precipitation"
                        value={`${weather.weather.current.precipitation} mm`}
                      />
                    </div>
                    <div className="freshness">Updated {new Date(weather.weather.fetched_at).toLocaleString()}</div>
                  </div>
                  <div className="forecast panel">
                    <span className="small-label">3-DAY OUTLOOK</span>
                    <h3>Forecast summary</h3>
                    <div className="forecast-list">
                      {weather.weather.daily.time.map((day, i) => (
                        <div className="forecast-row" key={day}>
                          <span>
                            {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
                              weekday: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <Sun size={17} />
                          <strong>{weather.weather.daily.temperature_2m_max[i]}°</strong>
                          <span className="muted">{weather.weather.daily.temperature_2m_min[i]}°</span>
                          <span className="rain-chip">
                            {weather.weather.daily.precipitation_probability_max[i]}% rain
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="tiny muted">Forecasts can change. Confirm conditions before farm operations.</p>
                  </div>
                </>
              ) : (
                <div className="weather-placeholder panel">
                  <div className="weather-placeholder-icon">
                    <CloudSun size={25} />
                  </div>
                  <div>
                    <h3>Weather for your farm</h3>
                    <p>Load current conditions and a 3-day forecast for the selected farm.</p>
                  </div>
                  <button className="button primary" disabled={busy || !selectedFarm} onClick={loadWeather}>
                    Load weather
                  </button>
                </div>
              )}
            </section>

            <section id="recommendations">
              <div className="section-heading compact">
                <div>
                  <h2>Crop suggestions</h2>
                  <p>Ranked using a simple, transparent prototype rule set.</p>
                </div>
                <button
                  className="button primary"
                  disabled={busy || !selectedFarm}
                  onClick={generateRecommendations}
                >
                  <Leaf size={16} /> Generate suggestions
                </button>
              </div>
              {recommendation ? (
                <>
                  <div className="recommendation-grid">
                    {recommendation.items.map((item, i) => (
                      <article className={`crop-card panel ${i === 0 ? 'top-crop' : ''}`} key={item.crop}>
                        <div className="crop-card-top">
                          <div className="crop-icon">
                            <Sprout size={21} />
                          </div>
                          <span className="rank-label">OPTION {i + 1}</span>
                        </div>
                        <h3>{item.crop}</h3>
                        <div className="score-line">
                          <div className="score-track">
                            <div style={{ width: `${item.score * 10}%` }} />
                          </div>
                          <span>{item.score}/10 demo score</span>
                        </div>
                        <div className="reason-block">
                          <strong>Why compare it?</strong>
                          <ul>
                            {item.reasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="caution-block">
                          <AlertTriangle size={15} />
                          <span>{item.cautions.join(' ')}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="disclaimer">
                    <AlertTriangle size={17} />
                    <p>
                      <strong>Decision support only.</strong> {recommendation.warnings.join(' ')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="suggestion-empty panel">
                  <div className="crop-icon">
                    <Leaf size={22} />
                  </div>
                  <div>
                    <h3>Compare possible crops</h3>
                    <p>Generate suggestions to see a ranked list, the factors considered and cautions to verify locally.</p>
                  </div>
                  <button className="button secondary" disabled={busy || !selectedFarm} onClick={generateRecommendations}>
                    Generate now
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        <section className="lower-grid">
          <div className="panel assistant-panel" id="assistant">
            <div className="panel-heading">
              <div className="heading-with-icon">
                <div className="assistant-icon">
                  <MessageCircle size={19} />
                </div>
                <div>
                  <h3>FarmPulse assistant</h3>
                  <p>Text chat powered by a local Hugging Face model</p>
                </div>
              </div>
              <label className="language-select">
                <span className="sr-only">Response language</span>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {languageOptions.map((lang) => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ai-status">
              <span className={`status-dot ${health?.status === 'ok' ? 'online' : ''}`} />
              {health?.status === 'ok'
                ? `Connected · ${health.ai_model}`
                : 'Local AI backend is unavailable — check Flask and model setup'}
            </div>
            <div className="chat-transcript">
              {chatMessages.map((message, i) => (
                <div className={`chat-bubble ${message.role}`} key={`${i}-${message.role}`}>
                  <span>{message.role === 'assistant' ? 'FarmPulse' : 'You'}</span>
                  <p>{message.text}</p>
                </div>
              ))}
              {chatBusy && (
                <div className="chat-bubble assistant">
                  <span>FarmPulse</span>
                  <p className="typing">Thinking locally…</p>
                </div>
              )}
            </div>
            <form className="chat-form" onSubmit={sendChat}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your farm or suggestions…"
                maxLength={3000}
              />
              <button
                className="send-button"
                disabled={chatBusy || !chatInput.trim()}
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>
            <p className="tiny muted">
              AI responses may be wrong. Verify important crop decisions with a local agricultural expert.
            </p>
          </div>

          <div className="panel history-panel" id="history">
            <div className="panel-heading">
              <div>
                <h3>Recommendation history</h3>
                <p>Your recent saved crop comparisons</p>
              </div>
              <History size={20} className="heading-muted" />
            </div>
            {history.length ? (
              <div className="history-list">
                {history.slice(0, 6).map((item) => {
                  const first = Array.isArray(item.candidate_crops) ? item.candidate_crops[0] : null;
                  return (
                    <div className="history-item" key={item.recommendation_id}>
                      <div className="history-icon">
                        <Leaf size={17} />
                      </div>
                      <div className="history-copy">
                        <strong>{first?.crop || 'Crop comparison'}</strong>
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      <CheckCircle2 size={16} className="history-check" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="history-empty">
                <History size={24} />
                <p>Saved comparisons will appear here after you generate crop suggestions.</p>
              </div>
            )}
          </div>
        </section>

        <footer className="page-footer">
          <span>FarmPulse · Team VAJRA · IC26-01-10</span>
          <span>Prototype with local SQLite storage and Open-Meteo weather.</span>
        </footer>
      </main>
    </div>
  );
}

function Brand({ light = false }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <div className="brand-mark">
        <Sprout size={22} strokeWidth={2.2} />
      </div>
      <div>
        <strong>FarmPulse</strong>
        <span>SMART AGRICULTURE</span>
      </div>
    </div>
  );
}

function Notice({ text, type = 'success', onClose }) {
  return (
    <div className={`notice ${type}`}>
      <span>{type === 'error' ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}</span>
      <p>{text}</p>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="weather-metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
