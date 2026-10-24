import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudSnow,
  Navigation,
  Search,
  Droplets,
  Wind,
  Thermometer,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function WeatherIcon({ name, size = 24, className = '' }) {
  switch (name) {
    case 'Sun':
      return <Sun size={size} className={className} />;
    case 'Cloud':
      return <Cloud size={size} className={className} />;
    case 'CloudRain':
      return <CloudRain size={size} className={className} />;
    case 'CloudLightning':
      return <CloudLightning size={size} className={className} />;
    case 'CloudDrizzle':
      return <CloudDrizzle size={size} className={className} />;
    case 'CloudSnow':
      return <CloudSnow size={size} className={className} />;
    case 'CloudSun':
    default:
      return <CloudSun size={size} className={className} />;
  }
}

export default function LandingWeather({ language = 'en', languageLabel = 'English', t, token }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('Kadapa, Andhra Pradesh');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchWeather = useCallback(async (lat, lon, name) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = `${API_BASE}/api/weather?latitude=${lat}&longitude=${lon}&location=${encodeURIComponent(name || 'Current Field')}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch meteorological data');
      setWeatherData(data);
      if (name) setLocationName(name);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load for default location
  useEffect(() => {
    fetchWeather(14.4673, 78.8242, 'Kadapa, Andhra Pradesh');
  }, [fetchWeather]);

  // Autocomplete search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/location/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowDropdown((data.results || []).length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const detectLocation = async () => {
    setDetecting(true);
    setErrorMsg('');

    const getGPS = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('GPS not supported'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 4000,
          enableHighAccuracy: false
        });
      });

    try {
      const pos = await getGPS();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Reverse geocode
      try {
        const rev = await fetch(`${API_BASE}/api/location/reverse?lat=${lat}&lon=${lon}`);
        const rData = await rev.json();
        const display = rData.display_name || `${rData.city || 'Field'}, ${rData.state || ''}`;
        await fetchWeather(lat, lon, display);
      } catch {
        await fetchWeather(lat, lon, `Field Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`);
      }
    } catch {
      // Fallback to IP location
      try {
        const ipRes = await fetch(`${API_BASE}/api/location/auto`);
        const ipData = await ipRes.json();
        if (ipData.latitude && ipData.longitude) {
          await fetchWeather(ipData.latitude, ipData.longitude, ipData.display_name || ipData.city);
        } else {
          throw new Error('Auto location fallback failed');
        }
      } catch (e) {
        setErrorMsg('Could not detect location. Please search your district manually.');
      }
    } finally {
      setDetecting(false);
    }
  };

  const current = weatherData?.current || {};
  const daily = weatherData?.daily_forecast || [];
  const advisories = weatherData?.advisories || [];

  return (
    <div className="landing-weather-box">
      <div className="landing-weather-header">
        <div>
          <span className="small-label" style={{ color: '#2b7d4a', fontWeight: 700 }}>
            🛰️ HYPERLOCAL OPEN-METEO TELEMETRY
          </span>
          <h2 style={{ margin: '4px 0 0', fontSize: '24px', color: '#163821' }}>
            {locationName}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#597061' }}>
            {t('weatherSubtitle') || 'Real-time field telemetry and predictive agricultural advisories without static data'}
          </p>
        </div>

        <div className="landing-weather-controls">
          <button
            type="button"
            className="button secondary"
            onClick={detectLocation}
            disabled={detecting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Navigation size={14} className={detecting ? 'spin' : ''} />
            <span>{detecting ? 'Locating...' : (t('useMyLocation') || 'Use My Field GPS')}</span>
          </button>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <input
                type="text"
                className="weather-search-input"
                placeholder={t('searchCity') || 'Search district or town...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              />
              <Search size={15} style={{ position: 'absolute', right: '12px', color: '#688070' }} />
            </div>

            {showDropdown && suggestions.length > 0 && (
              <div className="location-dropdown" style={{ top: '100%', right: 0, width: '320px', zIndex: 100 }}>
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="location-item"
                    onMouseDown={() => {
                      fetchWeather(item.latitude, item.longitude, item.display_name || item.name);
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <strong>{item.name}</strong>
                    <small>{item.display_name}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '12px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#2b7d4a' }}>
          <Sparkles className="spin" size={24} style={{ margin: '0 auto 8px' }} />
          <p>Syncing live meteorological sensors & field telemetry...</p>
        </div>
      )}

      {!loading && weatherData && (
        <>
          {/* Main Telemetry Stats */}
          <div className="weather-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            <div className="weather-metric-card" style={{ background: '#f8faf7', border: '1px solid #e0eae0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e9f5ec', display: 'grid', placeItems: 'center', color: '#2b7d4a' }}>
                <WeatherIcon name={current.icon || 'Sun'} size={24} />
              </div>
              <div>
                <small style={{ fontSize: '11px', color: '#657b6d', fontWeight: 600 }}>{t('temp') || 'Temperature'}</small>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#163821' }}>{current.temperature_2m ?? '--'}°C</div>
                <span style={{ fontSize: '11px', color: '#446b52' }}>{current.condition || 'Clear'}</span>
              </div>
            </div>

            <div className="weather-metric-card" style={{ background: '#f8faf7', border: '1px solid #e0eae0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e6f3fa', display: 'grid', placeItems: 'center', color: '#0284c7' }}>
                <Droplets size={24} />
              </div>
              <div>
                <small style={{ fontSize: '11px', color: '#657b6d', fontWeight: 600 }}>{t('humidity') || 'Relative Humidity'}</small>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#163821' }}>{current.relative_humidity_2m ?? '--'}%</div>
                <span style={{ fontSize: '11px', color: '#0284c7' }}>Foliar Moisture</span>
              </div>
            </div>

            <div className="weather-metric-card" style={{ background: '#f8faf7', border: '1px solid #e0eae0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f1f5f9', display: 'grid', placeItems: 'center', color: '#475569' }}>
                <Wind size={24} />
              </div>
              <div>
                <small style={{ fontSize: '11px', color: '#657b6d', fontWeight: 600 }}>{t('wind') || 'Wind Velocity'}</small>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#163821' }}>{current.wind_speed_10m ?? '--'} km/h</div>
                <span style={{ fontSize: '11px', color: current.wind_speed_10m >= 15 ? '#b91c1c' : '#16a34a' }}>
                  {current.wind_speed_10m >= 15 ? 'Drift Hazard' : 'Safe for Spraying'}
                </span>
              </div>
            </div>

            <div className="weather-metric-card" style={{ background: '#f8faf7', border: '1px solid #e0eae0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f5f3ff', display: 'grid', placeItems: 'center', color: '#7c3aed' }}>
                <CloudRain size={24} />
              </div>
              <div>
                <small style={{ fontSize: '11px', color: '#657b6d', fontWeight: 600 }}>{t('rainChance') || 'Precipitation'}</small>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#163821' }}>
                  {daily[0]?.precipitation_probability ?? 0}%
                </div>
                <span style={{ fontSize: '11px', color: '#7c3aed' }}>Today's Risk</span>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast Row */}
          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '14px', margin: '0 0 10px', color: '#1b3824', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} /> 7-Day Field Outlook
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {daily.slice(0, 7).map((day, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    background: dIdx === 0 ? '#eaf4eb' : '#fff',
                    border: `1px solid ${dIdx === 0 ? '#b6deb8' : '#e2ebe2'}`,
                    borderRadius: '12px',
                    padding: '12px 8px',
                    textAlign: 'center'
                  }}
                >
                  <strong style={{ fontSize: '12px', color: '#163821', display: 'block' }}>{day.day}</strong>
                  <span style={{ fontSize: '10px', color: '#6d8274', display: 'block', marginBottom: '8px' }}>{day.formatted_date}</span>
                  <div style={{ color: '#2b7d4a', margin: '0 auto 6px', display: 'grid', placeItems: 'center' }}>
                    <WeatherIcon name={day.icon} size={22} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#183822' }}>
                    {day.max_temp}° <small style={{ fontSize: '10px', color: '#6d8274' }}>{day.min_temp}°</small>
                  </div>
                  {day.precipitation_probability > 0 && (
                    <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700 }}>
                      🌧️ {day.precipitation_probability}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Agricultural Advisories */}
          {advisories.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', margin: '0 0 10px', color: '#1b3824', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: '#2b7d4a' }} /> Dynamic Agricultural Weather Advisories
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {advisories.map((adv, aIdx) => (
                  <div
                    key={aIdx}
                    style={{
                      background: adv.level === 'warning' ? '#fffbeb' : adv.level === 'caution' ? '#fefce8' : '#f0fdf4',
                      border: `1px solid ${adv.level === 'warning' ? '#fde68a' : adv.level === 'caution' ? '#fef08a' : '#bbf7d0'}`,
                      borderRadius: '12px',
                      padding: '14px',
                      fontSize: '12px',
                      lineHeight: '1.45'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      {adv.level === 'warning' ? (
                        <AlertTriangle size={15} style={{ color: '#b45309' }} />
                      ) : (
                        <CheckCircle2 size={15} style={{ color: '#15803d' }} />
                      )}
                      <strong style={{ color: adv.level === 'warning' ? '#92400e' : '#166534', fontSize: '12px' }}>
                        {adv.title}
                      </strong>
                    </div>
                    <p style={{ margin: 0, color: '#374151' }}>{adv.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
