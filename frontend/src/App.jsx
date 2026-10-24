import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sprout,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudSnow,
  MapPin,
  Leaf,
  MessageCircle,
  History,
  LogOut,
  Plus,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  ChevronDown,
  Database,
  Navigation,
  Search,
  Sparkles,
  Info,
  Check,
  ShieldCheck,
  Calendar,
  Activity,
  ArrowRight,
  Trash2,
  Cpu,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  UploadCloud,
  Bug,
  FileText,
  TrendingUp,
  TrendingDown,
  Layers,
  Wifi,
  WifiOff,
  DollarSign,
  AlertOctagon,
  Clock,
  FlaskConical,
} from 'lucide-react';


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
  latitude: '',
  longitude: '',
  land_area: '',
  soil_type: 'Loamy soil',
  water_availability: 'Moderate / borewell',
  season: 'Kharif / monsoon',
  current_crop: '',
};

const languageOptions = ['English', 'Telugu', 'Hindi', 'Kannada', 'Tamil'];

function WeatherIcon({ name, size = 20, className = '' }) {
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

function LocationSearchInput({ value, onChange, onSelectLocation, onDetectLocation, detectingLocation, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api(`/api/location/search?query=${encodeURIComponent(query)}`);
        setSuggestions(res.results || []);
        setShowDropdown((res.results || []).length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="location-search-wrap">
      <div className="location-input-group">
        <div className="input-with-icon">
          <Search size={16} className="search-icon" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder={placeholder || "Type city, village, or district (e.g. Kadapa, Guntur, Pune)..."}
          />
        </div>
        <button
          type="button"
          className="button secondary detect-btn"
          onClick={onDetectLocation}
          disabled={detectingLocation}
          title="Auto-detect current location (GPS or Network IP)"
        >
          <Navigation size={14} className={detectingLocation ? 'spin' : ''} />
          {detectingLocation ? 'Locating...' : 'Detect Location'}
        </button>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="location-dropdown">
          {suggestions.map((item, idx) => (
            <div
              key={item.id || idx}
              className="location-item"
              onMouseDown={() => {
                onSelectLocation(item);
                setShowDropdown(false);
              }}
            >
              <MapPin size={15} />
              <div className="location-info">
                <strong>{item.name}</strong>
                <small>{item.display_name}</small>
              </div>
              <span className="coord-chip">
                {item.latitude?.toFixed(2)}°, {item.longitude?.toFixed(2)}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem('farmpulse_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
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
  const [weatherAnalysis, setWeatherAnalysis] = useState(null);
  const [analyzingWeather, setAnalyzingWeather] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [weatherHistory, setWeatherHistory] = useState([]);
  const [historyTab, setHistoryTab] = useState('weather');
  const [cropCategoryFilter, setCropCategoryFilter] = useState('all');
  const [language, setLanguage] = useState('English');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am FarmPulse AI, your weather-aware smart agricultural advisor. I analyze real-time Open-Meteo field telemetry and soil data to recommend irrigation schedules, spraying windows, and optimal crops. How can I help your farm today?',
    },
  ]);
  const [chatBusy, setChatBusy] = useState(false);
  const [health, setHealth] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [customWeatherLocation, setCustomWeatherLocation] = useState('');

  // Features 22-37 State Variables
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [diagnosisCrop, setDiagnosisCrop] = useState('Paddy');
  const [diagnosisSymptoms, setDiagnosisSymptoms] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [diagnosisImage, setDiagnosisImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [diagnosingBusy, setDiagnosingBusy] = useState(false);
  const [diagnosesHistory, setDiagnosesHistory] = useState([]);
  const [fertCrop, setFertCrop] = useState('Cotton');
  const [fertArea, setFertArea] = useState('2');
  const [fertSoil, setFertSoil] = useState('Black soil');
  const [fertStage, setFertStage] = useState('Basal / Sowing');
  const [fertilizerPlan, setFertilizerPlan] = useState(null);
  const [fertBusy, setFertBusy] = useState(false);
  const [seedVarieties, setSeedVarieties] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityType, setActivityType] = useState('Irrigation');
  const [activityCrop, setActivityCrop] = useState('');
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activityNotes, setActivityNotes] = useState('');
  const [activityCost, setActivityCost] = useState('');
  const [activityBusy, setActivityBusy] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const token = session?.access_token;
  const selectedFarm = useMemo(() => farms.find((f) => f.farm_id === selectedFarmId), [farms, selectedFarmId]);

  // Network monitor for offline access
  useEffect(() => {
    const onOnline = () => { setIsOnline(true); setNotice('🌐 Connected to live network.'); };
    const onOffline = () => { setIsOnline(false); setNotice('📡 Offline mode: cached field data active.'); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    api('/api/health')
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', ai_model_loaded: false, database_configured: false }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('farmpulse_session');
    setSession(null);
    setFarms([]);
    setSelectedFarmId('');
    setRecommendation(null);
    setWeather(null);
    setWeatherAnalysis(null);
    setActiveTab('overview');
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
  }, [token, logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Alerts & Irrigation Reminders
  const loadAlerts = useCallback(async () => {
    try {
      const targetLat = selectedFarm?.latitude || weather?.weather?.latitude;
      const targetLon = selectedFarm?.longitude || weather?.weather?.longitude;
      const q = targetLat && targetLon ? `?latitude=${targetLat}&longitude=${targetLon}` : '';
      const res = await api(`/api/alerts${q}`, token);
      setAlerts(res.alerts || []);
    } catch (e) {
      console.warn('Could not load alerts:', e);
    }
  }, [selectedFarm, weather, token]);

  // Load Mandi Market Prices
  const loadMarketPrices = useCallback(async () => {
    try {
      const res = await api('/api/market-prices');
      setMarketPrices(res.market_prices || []);
    } catch (e) {
      console.warn('Could not load market prices:', e);
    }
  }, []);

  // Load Seed Varieties
  const loadSeedVarieties = useCallback(async () => {
    try {
      const res = await api('/api/seed-varieties');
      setSeedVarieties(res.varieties || []);
    } catch (e) {
      console.warn('Could not load seed varieties:', e);
    }
  }, []);

  // Load Activities
  const loadActivities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api('/api/activities', token);
      setActivities(res.activities || []);
    } catch (e) {
      console.warn('Could not load activities:', e);
    }
  }, [token]);

  // Load Disease Diagnoses History
  const loadDiagnoses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api('/api/diagnoses', token);
      setDiagnosesHistory(res.diagnoses || []);
    } catch (e) {
      console.warn('Could not load diagnoses:', e);
    }
  }, [token]);

  const loadWeatherAnalysesHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api('/api/weather/analyses', token);
      setWeatherHistory(res.analyses || []);
    } catch (e) {
      console.warn('Could not load weather analyses history:', e);
    }
  }, [token]);

  useEffect(() => {
    loadAlerts();
    loadMarketPrices();
    loadSeedVarieties();
  }, [loadAlerts, loadMarketPrices, loadSeedVarieties]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadWeatherAnalysesHistory();
      loadDiagnoses();
    } else if (activeTab === 'activities') {
      loadActivities();
    } else if (activeTab === 'disease') {
      loadDiagnoses();
    }
  }, [activeTab, loadWeatherAnalysesHistory, loadDiagnoses, loadActivities]);

  // Voice Speech-to-Text (STT)
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition not supported in your browser. You can type your question.');
      return;
    }
    try {
      const rec = new SpeechRecognition();
      const langMap = { English: 'en-IN', Telugu: 'te-IN', Hindi: 'hi-IN', Kannada: 'kn-IN', Tamil: 'ta-IN' };
      rec.lang = langMap[language] || 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      setIsListening(true);
      setNotice(`🎤 Listening in ${language}... Speak clearly now.`);

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setChatInput(text);
        setIsListening(false);
        setNotice(`Heard: "${text}"`);
      };
      rec.onerror = (e) => {
        setIsListening(false);
        setError(`Voice input error: ${e.error}`);
      };
      rec.onend = () => setIsListening(false);
      rec.start();
    } catch (err) {
      setIsListening(false);
      setError(`Voice recognition failed: ${err.message}`);
    }
  };

  // Voice Text-to-Speech (TTS)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      setError('Speech audio output not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langMap = { English: 'en-IN', Telugu: 'te-IN', Hindi: 'hi-IN', Kannada: 'kn-IN', Tamil: 'ta-IN' };
    utterance.lang = langMap[language] || 'en-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Submit Crop Disease Diagnosis
  const handleDiseaseDiagnose = async (e) => {
    e?.preventDefault?.();
    setDiagnosingBusy(true);
    setError('');
    try {
      const allSymptoms = [...selectedSymptoms, diagnosisSymptoms].filter(Boolean).join(', ');
      const res = await api('/api/diagnose/disease', token, {
        method: 'POST',
        body: JSON.stringify({
          crop: diagnosisCrop,
          symptoms: allSymptoms || 'Leaf discoloration and wilting',
          image_data: diagnosisImage,
          farm_id: selectedFarmId || undefined,
          language,
        }),
      });
      setDiagnosisResult(res.diagnosis);
      setDiagnosesHistory((prev) => [res.diagnosis, ...prev]);
      setNotice(`✅ Crop Doctor: Diagnosed ${res.diagnosis.disease_name} with ${Math.round(res.diagnosis.confidence * 100)}% confidence.`);
    } catch (err) {
      setError(`Disease scan error: ${err.message}`);
    } finally {
      setDiagnosingBusy(false);
    }
  };

  // Run Fertilizer Dosage Calculation
  const handleCalculateFertilizer = async (e) => {
    e?.preventDefault?.();
    setFertBusy(true);
    try {
      const res = await api('/api/fertilizer/calculate', token, {
        method: 'POST',
        body: JSON.stringify({
          crop: fertCrop,
          land_area: Number(fertArea) || 1,
          soil_type: fertSoil,
          stage: fertStage,
        }),
      });
      setFertilizerPlan(res.fertilizer_plan);
      setNotice('Fertilizer N-P-K recommendation calculated.');
    } catch (err) {
      setError(`Fertilizer calculation error: ${err.message}`);
    } finally {
      setFertBusy(false);
    }
  };

  // Add Activity Log
  const handleAddActivity = async (e) => {
    e.preventDefault();
    setActivityBusy(true);
    try {
      const res = await api('/api/activities', token, {
        method: 'POST',
        body: JSON.stringify({
          activity_type: activityType,
          crop: activityCrop || selectedFarm?.current_crop || 'Field Crop',
          activity_date: activityDate,
          notes: activityNotes,
          cost: Number(activityCost) || 0,
          farm_id: selectedFarmId || undefined,
        }),
      });
      setActivities((prev) => [res.activity, ...prev]);
      setActivityNotes('');
      setActivityCost('');
      setNotice(`Recorded activity: ${activityType}`);
    } catch (err) {
      setError(`Activity log error: ${err.message}`);
    } finally {
      setActivityBusy(false);
    }
  };

  // Delete Activity Log
  const handleDeleteActivity = async (id) => {
    try {
      await api(`/api/activities/${id}`, token, { method: 'DELETE' });
      setActivities((prev) => prev.filter((a) => a.activity_id !== id));
      setNotice('Activity removed.');
    } catch (err) {
      setError(`Could not delete activity: ${err.message}`);
    }
  };

  // Update Preferred Language in Profile
  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    if (token) {
      try {
        await api('/api/profile', token, {
          method: 'PATCH',
          body: JSON.stringify({ preferred_language: newLang }),
        });
        setNotice(`Language updated to ${newLang}.`);
      } catch (err) {
        console.warn('Could not save language to profile:', err);
      }
    }
  };


  const loadWeather = useCallback(async (farmTarget = selectedFarm) => {
    if (!farmTarget) return;
    setBusy(true);
    setError('');
    try {
      let endpoint = '';
      if (farmTarget.latitude && farmTarget.longitude) {
        endpoint = `/api/weather?latitude=${farmTarget.latitude}&longitude=${farmTarget.longitude}&location=${encodeURIComponent(
          farmTarget.location || farmTarget.farm_name || ''
        )}`;
      } else if (farmTarget.farm_id) {
        endpoint = `/api/weather?farm_id=${farmTarget.farm_id}`;
      } else {
        endpoint = '/api/weather';
      }
      const data = await api(endpoint, token);
      setWeather(data);
    } catch (e) {
      setError(`Weather sync notice: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }, [selectedFarm, token]);

  const generateRecommendations = useCallback(async (farmTarget = selectedFarm) => {
    if (!farmTarget) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        farm_id: farmTarget.farm_id,
        latitude: farmTarget.latitude,
        longitude: farmTarget.longitude,
        farm_name: farmTarget.farm_name,
        location: farmTarget.location,
        soil_type: farmTarget.soil_type,
        water_availability: farmTarget.water_availability,
        season: farmTarget.season,
        current_crop: farmTarget.current_crop,
        language,
      };
      const data = await api('/api/recommendations/ai', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setRecommendation(data.recommendation);
      if (data.recommendation?.recommendation_id) {
        setHistory((current) => [data.recommendation, ...current]);
      }
      setNotice('AI Crop recommendations successfully generated with live weather calibration.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [selectedFarm, token, language]);

  const runWeatherAnalysis = useCallback(async () => {
    const targetLat = weather?.weather?.latitude || selectedFarm?.latitude;
    const targetLon = weather?.weather?.longitude || selectedFarm?.longitude;
    const targetLoc = weather?.weather?.location_name || selectedFarm?.location || 'Current Field';

    if (!targetLat || !targetLon) {
      setError('Please select a farm or search a location with valid coordinates first.');
      return;
    }

    setAnalyzingWeather(true);
    setError('');
    try {
      const payload = {
        latitude: Number(targetLat),
        longitude: Number(targetLon),
        location_name: targetLoc,
        farm_id: selectedFarmId || undefined,
        language,
      };
      const res = await api('/api/weather/analyze', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setWeatherAnalysis(res.analysis);
      if (res.weather) {
        setWeather((prev) => ({ ...prev, weather: res.weather }));
      }
      setNotice('Local AI Meteorological Analysis & Predictions generated successfully.');
    } catch (e) {
      setError(`AI analysis error: ${e.message}`);
    } finally {
      setAnalyzingWeather(false);
    }
  }, [weather, selectedFarm, selectedFarmId, token, language]);

  useEffect(() => {
    if (selectedFarm) {
      loadWeather(selectedFarm);
      generateRecommendations(selectedFarm);
    }
  }, [selectedFarmId]); // eslint-disable-line react-hooks/exhaustive-deps

  const detectLiveLocation = useCallback(async () => {
    setDetectingLocation(true);
    setError('');
    setNotice('Detecting your current location...');

    let lat = null;
    let lon = null;
    let locName = '';
    let source = 'GPS';

    // Tier 1: Fast browser geolocation (with 3.5s timeout and false high accuracy for desktop compatibility)
    const getBrowserPosition = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 3500,
          enableHighAccuracy: false,
          maximumAge: 60000,
        });
      });

    try {
      const pos = await getBrowserPosition();
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      source = 'Browser GPS';
      try {
        const rev = await api(`/api/location/reverse?latitude=${lat}&longitude=${lon}`);
        locName = rev.display_name || rev.name || rev.city || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      } catch {
        locName = `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
      }
    } catch {
      // Tier 2: Instant Network IP Geolocation Fallback
      try {
        const auto = await api('/api/location/auto');
        lat = auto.latitude;
        lon = auto.longitude;
        locName = auto.display_name || auto.city || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
        source = 'Network';
      } catch (ipErr) {
        setError(`Could not detect current location automatically (${ipErr.message}). You can type your city or village in the search bar.`);
        setDetectingLocation(false);
        return;
      }
    }

    if (lat != null && lon != null) {
      const shortCity = locName.split(',')[0].trim();
      setFarmForm((prev) => ({
        ...prev,
        latitude: String(lat),
        longitude: String(lon),
        location: locName,
        farm_name: prev.farm_name || `Field in ${shortCity}`,
      }));
      setCustomWeatherLocation(locName);

      setNotice(`📍 Current location detected (${source}): ${locName}`);

      if (selectedFarmId && token) {
        try {
          await api(`/api/farms/${selectedFarmId}`, token, {
            method: 'PATCH',
            body: JSON.stringify({
              latitude: lat,
              longitude: lon,
              location: locName,
            }),
          });
          setFarms((prev) =>
            prev.map((f) => (f.farm_id === selectedFarmId ? { ...f, latitude: lat, longitude: lon, location: locName } : f))
          );
        } catch (patchErr) {
          console.warn('Could not auto-update farm in DB:', patchErr);
        }
      }

      const locationTarget = {
        latitude: lat,
        longitude: lon,
        location: locName,
        farm_name: shortCity || 'Current Location',
      };

      await loadWeather(locationTarget);

      await generateRecommendations({
        ...locationTarget,
        farm_id: selectedFarmId || undefined,
        soil_type: selectedFarm?.soil_type || farmForm.soil_type || 'Loamy soil',
        water_availability: selectedFarm?.water_availability || farmForm.water_availability || 'Moderate / borewell',
        season: selectedFarm?.season || farmForm.season || 'Kharif / monsoon',
      });
    }

    setDetectingLocation(false);
  }, [selectedFarm, selectedFarmId, farmForm, loadWeather, generateRecommendations]);

  // Auto-detect location on load if no farm exists yet
  useEffect(() => {
    if (session && !weather && farms.length === 0 && !detectingLocation) {
      detectLiveLocation();
    }
  }, [session, weather, farms.length, detectLiveLocation]);

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
      setNotice('Farm profile saved with live weather coordinates.');
      setActiveTab('overview');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteFarm(farmId) {
    if (!confirm('Are you sure you want to remove this farm profile?')) return;
    try {
      await api(`/api/farms/${farmId}`, token, { method: 'DELETE' });
      setFarms((current) => current.filter((f) => f.farm_id !== farmId));
      if (selectedFarmId === farmId) {
        const remaining = farms.filter((f) => f.farm_id !== farmId);
        setSelectedFarmId(remaining[0]?.farm_id || '');
      }
      setNotice('Farm profile deleted.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function sendChat(event) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatBusy) return;
    setChatInput('');
    setChatBusy(true);
    setChatMessages((current) => [...current, { role: 'user', text: message }]);
    try {
      const result = await api('/api/chat', token, {
        method: 'POST',
        body: JSON.stringify({
          message,
          language,
          farm_id: selectedFarmId || undefined,
        }),
      });
      setChatMessages((current) => [...current, { role: 'assistant', text: result.answer }]);
    } catch (e) {
      setChatMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: `Local AI guidance: ${e.message}`,
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  }

  const filteredCrops = useMemo(() => {
    if (!recommendation?.items) return [];
    if (cropCategoryFilter === 'all') return recommendation.items;
    return recommendation.items.filter((item) => {
      const text = `${item.crop} ${item.description || ''}`.toLowerCase();
      if (cropCategoryFilter === 'cereals') return text.includes('millet') || text.includes('paddy') || text.includes('maize') || text.includes('sorghum');
      if (cropCategoryFilter === 'oilseeds') return text.includes('groundnut') || text.includes('sunflower') || text.includes('mustard') || text.includes('soybean');
      if (cropCategoryFilter === 'pulses') return text.includes('pulse') || text.includes('gram') || text.includes('pea');
      if (cropCategoryFilter === 'cash') return text.includes('cotton') || text.includes('sugarcane') || text.includes('chilli');
      return true;
    });
  }, [recommendation, cropCategoryFilter]);

  if (!authReady) {
    return (
      <div className="center-screen">
        <div className="loading-mark">
          <Sprout size={28} />
        </div>
        <p>Connecting to FarmPulse...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-layout">
        <div className="auth-visual">
          <Brand light />
          <div className="auth-hero">
            <span className="eyebrow light-eyebrow">SMART AGRICULTURE PLATFORM</span>
            <h1>Real-time weather insights & tailored crop decisions.</h1>
            <p>
              Connect your field location dynamically via Open-Meteo weather API to receive hyper-local crop
              suitability, 7-day outlooks, and local LLM agricultural predictions without static data.
            </p>
            <div className="auth-points">
              <span>
                <Navigation size={15} /> Dynamic GPS & Location Search
              </span>
              <span>
                <CloudSun size={15} /> Real-Time Open-Meteo Weather
              </span>
              <span>
                <Sparkles size={15} /> Local LLM Agronomic Reasoning
              </span>
            </div>
          </div>
          <div className="auth-foot">Team VAJRA · IC26-01-10 · Powered by Open-Meteo & Local PyTorch LLM</div>
        </div>

        <div className="auth-panel">
          <form className="auth-form" onSubmit={handleAuth}>
            <Brand />
            <h2>{authMode === 'signup' ? 'Create farmer account' : 'Welcome back'}</h2>
            <p className="muted">
              {authMode === 'signup'
                ? 'Sign up to monitor your fields with live weather data & local AI.'
                : 'Sign in to access your farm profiles and weather insights.'}
            </p>

            {error && <Notice type="error" text={error} onClose={() => setError('')} />}
            {notice && <Notice text={notice} onClose={() => setNotice('')} />}

            <label>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              />
            </label>

            <button className="button primary full" type="submit" disabled={authBusy}>
              {authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'}
            </button>

            <div className="switch-auth">
              {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                  setError('');
                  setNotice('');
                }}
              >
                {authMode === 'signup' ? 'Sign in' : 'Create one'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR NAVIGATION TABS */}
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">SMART AGRICULTURE TABS</div>
        <nav>
          <button
            type="button"
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Sprout size={17} /> Overview
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'weather' ? 'active' : ''}`}
            onClick={() => setActiveTab('weather')}
          >
            <CloudSun size={17} /> Live Weather Center
            {weather?.weather && <span className="nav-badge">{Math.round(weather.weather.current.temperature_2m)}°</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <Leaf size={17} /> Crop & Seed Hub
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'disease' ? 'active' : ''}`}
            onClick={() => setActiveTab('disease')}
          >
            <Bug size={17} /> Crop Doctor (AI)
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'fertilizer_market' ? 'active' : ''}`}
            onClick={() => setActiveTab('fertilizer_market')}
          >
            <FlaskConical size={17} /> Nutrients & Mandi
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            <Calendar size={17} /> Farm Activities ({activities.length})
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveTab('assistant')}
          >
            <MessageCircle size={17} /> AI Voice Advisor
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={17} /> Analysis Reports
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'farms' ? 'active' : ''}`}
            onClick={() => setActiveTab('farms')}
          >
            <MapPin size={17} /> Farm Profiles ({farms.length})
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection">
            <span className={`status-dot ${health?.status === 'ok' ? 'online' : ''}`} />
            <div>
              <strong>Weather Telemetry</strong>
              <small>Open-Meteo Live API</small>
            </div>
          </div>
          <div className="connection">
            <Cpu size={16} className="heading-muted" />
            <div>
              <strong>Local LLM Engine</strong>
              <small>{health?.ai_model ? `${health.ai_model.split('/')[1] || health.ai_model}` : 'Local AI'}</small>
            </div>
          </div>
          <div className="connection">
            <Database size={16} className="heading-muted" />
            <div>
              <strong>Database</strong>
              <small>SQLite (farmpulse.db)</small>
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

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title-block">
            <div className="eyebrow">LOCAL LLM & REAL-TIME OPEN-METEO WEATHER</div>
            <h1>
              {activeTab === 'overview' && 'Farm Dashboard Overview'}
              {activeTab === 'weather' && 'Live Weather Center & AI Predictions'}
              {activeTab === 'recommendations' && 'AI Crop Recommendations & Seed Varieties'}
              {activeTab === 'disease' && 'Crop Doctor: Disease & Stress Diagnosis'}
              {activeTab === 'fertilizer_market' && 'NPK Nutrient Calculator & APMC Mandi Rates'}
              {activeTab === 'activities' && 'Farming Activity Log & Irrigation Schedule'}
              {activeTab === 'assistant' && 'AI Voice Agronomist (STT & TTS)'}
              {activeTab === 'history' && 'Reports, Past Predictions & Diagnostic Scans'}
              {activeTab === 'farms' && 'Farm Management & Profile Settings'}
            </h1>
          </div>
          <div className="topbar-actions">
            {/* Offline / Online Sync Status Pill */}
            <span className={`offline-pill ${!isOnline ? 'offline' : ''}`} title={isOnline ? 'Connected to live network' : 'Using cached offline data'}>
              {isOnline ? <Wifi size={12} style={{ color: '#2b824c' }} /> : <WifiOff size={12} style={{ color: '#b33918' }} />}
              {isOnline ? 'Live Synced' : 'Offline Cached'}
            </span>

            {/* Weather Alerts counter */}
            {alerts.length > 0 && (
              <span
                className="outlook-tag"
                style={{ background: '#fdf0ed', color: '#a42c1b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setActiveTab('overview')}
                title="Active weather alerts"
              >
                <AlertTriangle size={12} /> {alerts.length} Alerts
              </span>
            )}

            <button
              type="button"
              className="location-badge-btn"
              onClick={detectLiveLocation}
              disabled={detectingLocation}
              title="Detect current location via GPS or Network IP"
            >
              <Navigation size={13} className={detectingLocation ? 'spin' : ''} />
              {detectingLocation ? 'Locating...' : (customWeatherLocation ? `📍 ${customWeatherLocation.split(',')[0]}` : '📍 Current Location')}
            </button>
            <div className="user-pill">
              <div className="avatar">{(session.user?.email || 'F')[0].toUpperCase()}</div>
              <div>
                <strong>{session.user?.email}</strong>
                <small>Active: {selectedFarm?.farm_name || customWeatherLocation?.split(',')[0] || 'Live Location'}</small>
              </div>
              <button className="icon-button" title="Sign out" onClick={logout}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>



        {error && <Notice type="error" text={error} onClose={() => setError('')} />}
        {notice && <Notice text={notice} onClose={() => setNotice('')} />}

        {/* ------------------------------------------------------------- */}
        {/* PAGE 1: OVERVIEW DASHBOARD */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="page-container">
            {/* Live Weather Alerts & Irrigation Reminders Banner */}
            {alerts.length > 0 && (
              <div className="alerts-hub-banner">
                {alerts.map((alt, idx) => (
                  <div key={idx} className={`alert-pill-box ${alt.severity || 'info'}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>{alt.title}</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', opacity: 0.9 }}>{alt.message}</p>
                      </div>
                    </div>
                    {alt.action && (
                      <span className="outlook-tag" style={{ background: '#fff', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                        💡 {alt.action}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stat Tiles */}
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-icon orange">
                  <Thermometer size={22} />
                </div>
                <div className="stat-info">
                  <small>Field Temp</small>
                  <strong>{weather?.weather ? `${Math.round(weather.weather.current.temperature_2m)}°C` : '--'}</strong>
                  <span>{weather?.weather?.current?.condition || 'Awaiting sync'}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">
                  <Droplets size={22} />
                </div>
                <div className="stat-info">
                  <small>Humidity</small>
                  <strong>{weather?.weather ? `${weather.weather.current.relative_humidity_2m}%` : '--'}</strong>
                  <span>{weather?.weather ? `${weather.weather.current.wind_speed_10m} km/h wind` : 'Ambient air'}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <CloudRain size={22} />
                </div>
                <div className="stat-info">
                  <small>7-Day Rain Outlook</small>
                  <strong>
                    {weather?.weather?.daily_forecast
                      ? `${weather.weather.daily_forecast.reduce((acc, d) => acc + (d.precipitation_sum || 0), 0).toFixed(1)} mm`
                      : '--'}
                  </strong>
                  <span>{weather?.weather?.forecast_summary || 'Weekly outlook'}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Leaf size={22} />
                </div>
                <div className="stat-info">
                  <small>Top Crop Match</small>
                  <strong>{recommendation?.items?.[0]?.crop ? recommendation.items[0].crop.split('(')[0] : 'Calculate'}</strong>
                  <span>{recommendation?.items?.[0] ? `${recommendation.items[0].score}/10 suitability` : 'AI Ranked'}</span>
                </div>
              </div>
            </div>

            {/* Welcome banner */}
            <section className="welcome-banner">
              <div className="welcome-copy">
                <div className="eyebrow light-eyebrow">FIELD INTELLIGENCE DASHBOARD</div>
                <h2>Live Meteorological Telemetry & Agro-Decisions</h2>
                <p>
                  Your crops are actively monitored using real-time Open-Meteo satellite & radar feeds. Our local LLM
                  evaluates micro-climate shifts, soil moisture, and pest risks dynamically.
                </p>
                <div className="banner-buttons">
                  <button className="button light-button" onClick={() => setActiveTab('weather')}>
                    <CloudSun size={16} /> Open Weather Center
                  </button>
                  <button className="button ghost-light-button" onClick={() => setActiveTab('recommendations')}>
                    <Sparkles size={15} /> View Crop Recommendations
                  </button>
                  <button className="button ghost-light-button" onClick={detectLiveLocation} disabled={detectingLocation}>
                    <Navigation size={14} className={detectingLocation ? 'spin' : ''} />
                    {detectingLocation ? 'Detecting GPS...' : 'Sync GPS'}
                  </button>
                </div>
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

            {/* Active Farm Switcher bar */}
            {farms.length > 0 && (
              <section className="farm-selector panel" style={{ marginTop: '16px' }}>
                <div className="farm-icon">
                  <MapPin size={21} />
                </div>
                <div className="farm-select-copy">
                  <div className="selector-header-line">
                    <span className="small-label">ACTIVE FIELD PROFILE</span>
                    <span className="live-status-pill">
                      <span className="pulse-dot" /> Live Open-Meteo Stream
                    </span>
                  </div>
                  <div className="select-wrap">
                    <select
                      aria-label="Selected farm"
                      value={selectedFarmId}
                      onChange={(e) => setSelectedFarmId(e.target.value)}
                    >
                      {farms.map((f) => (
                        <option key={f.farm_id} value={f.farm_id}>
                          {f.farm_name} ({f.location || 'Coordinates saved'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                  <p>
                    📍 {selectedFarm?.location || 'Live coordinates active'} ·{' '}
                    {selectedFarm?.land_area ? `${selectedFarm.land_area} acres · ` : ''}
                    {selectedFarm?.soil_type} · {selectedFarm?.season}
                  </p>
                </div>
                <div className="farm-tags">
                  <span>{selectedFarm?.soil_type}</span>
                  <span>{selectedFarm?.water_availability}</span>
                  <button className="button secondary" onClick={() => setActiveTab('farms')}>
                    Manage Farms
                  </button>
                </div>
              </section>
            )}

            {/* Overview Quick Action Cards */}
            <div className="overview-sections">
              {/* Weather preview card */}
              <div className="overview-card">
                <div>
                  <div className="overview-card-header">
                    <h3>Current Field Weather</h3>
                    <span className="live-status-pill">
                      <span className="pulse-dot" /> Live API
                    </span>
                  </div>
                  {weather?.weather ? (
                    <div>
                      <div className="temp-row" style={{ margin: '8px 0' }}>
                        <div className="temperature" style={{ fontSize: '38px' }}>
                          {Math.round(weather.weather.current.temperature_2m)}
                          <span>°C</span>
                        </div>
                        <div className="temp-details">
                          <span className="feels-like">
                            {weather.weather.current.condition} (feels like {Math.round(weather.weather.current.apparent_temperature)}°C)
                          </span>
                          <span className="weather-coord">
                            {weather.weather.location_name || selectedFarm?.location}
                          </span>
                        </div>
                      </div>
                      <div className="weather-metrics" style={{ marginTop: '10px' }}>
                        <Metric icon={<Droplets size={15} />} label="Humidity" value={`${weather.weather.current.relative_humidity_2m}%`} />
                        <Metric icon={<Wind size={15} />} label="Wind" value={`${weather.weather.current.wind_speed_10m} km/h`} />
                        <Metric icon={<Thermometer size={15} />} label="Precipitation" value={`${weather.weather.current.precipitation} mm`} />
                      </div>
                    </div>
                  ) : (
                    <p className="muted">No weather loaded yet. Click below to fetch real-time reports.</p>
                  )}
                </div>
                <button className="cta-link" onClick={() => setActiveTab('weather')}>
                  View Full 7-Day Forecast & Local AI Predictions <ArrowRight size={14} />
                </button>
              </div>

              {/* Crop preview card */}
              <div className="overview-card">
                <div>
                  <div className="overview-card-header">
                    <h3>Dynamic Crop Suitability</h3>
                    <span className="outlook-tag">Weather-Calibrated</span>
                  </div>
                  {recommendation?.items?.length ? (
                    <div>
                      <p style={{ fontSize: '12px', color: '#2b5037', margin: '4px 0 10px' }}>
                        Calibrated for <strong>{weather?.weather?.current?.temperature_2m || '27'}°C</strong> and{' '}
                        <strong>{selectedFarm?.soil_type || 'Loamy soil'}</strong>.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recommendation.items.slice(0, 3).map((crop, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: '#f7faf5',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          >
                            <span style={{ fontWeight: '700', color: '#1e3325' }}>
                              #{idx + 1} {crop.crop}
                            </span>
                            <span style={{ fontWeight: '700', color: '#2b7d4a' }}>{crop.score}/10 suitability</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="muted">No crop ranking generated yet. Click below to calculate dynamically.</p>
                  )}
                </div>
                <button className="cta-link" onClick={() => setActiveTab('recommendations')}>
                  Explore All Crop Matches & Guidance <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE 2: LIVE WEATHER CENTER & LOCAL AI PREDICTIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'weather' && (
          <div className="page-container">
            {/* Header with Search and Actions */}
            <div className="page-header-row">
              <div>
                <h2>Live Field Weather & Micro-Climate Center</h2>
                <p>Live meteorological telemetry fetched directly from Open-Meteo satellite & radar API.</p>
              </div>
              <div className="header-actions-group">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => loadWeather(selectedFarm)}
                  title="Re-sync latest telemetry"
                >
                  <RefreshCw size={14} className={busy ? 'spin' : ''} /> Sync Weather
                </button>
                <button
                  className="button primary"
                  disabled={analyzingWeather}
                  onClick={runWeatherAnalysis}
                >
                  <Sparkles size={14} className={analyzingWeather ? 'spin' : ''} />
                  {analyzingWeather ? 'Local LLM Reasoning...' : 'Run Local AI Predictions'}
                </button>
              </div>
            </div>

            {/* Dynamic Location Search Bar */}
            <div className="panel" style={{ padding: '16px 20px', marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#33483b', display: 'block', marginBottom: '8px' }}>
                Search Any Field / Village / City or Auto-Detect GPS:
              </label>
              <LocationSearchInput
                value={customWeatherLocation || selectedFarm?.location || ''}
                onChange={setCustomWeatherLocation}
                onSelectLocation={(item) => {
                  setCustomWeatherLocation(item.display_name);
                  setNotice(`📍 Location selected: ${item.display_name}`);
                  loadWeather({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    location: item.display_name,
                    farm_name: item.name,
                  });
                }}
                onDetectLocation={detectLiveLocation}
                detectingLocation={detectingLocation}
                placeholder="Search city, village, mandal, or district (e.g. Hyderabad, Anantapur, Kadapa, Pune)..."
              />
            </div>

            {/* Live Weather Hero Board */}
            {weather?.weather ? (
              <>
                <section className="weather-center-hero">
                  <div className="weather-hero-top">
                    <div className="weather-hero-loc">
                      <span className="live-status-pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '8px' }}>
                        <span className="pulse-dot" style={{ background: '#45f57f' }} /> Real-Time Open-Meteo API Feed
                      </span>
                      <h2>{weather.weather.location_name || selectedFarm?.location || 'Field Coordinates'}</h2>
                      <p>
                        Coordinates: {weather.weather.latitude?.toFixed(4)}°N, {weather.weather.longitude?.toFixed(4)}°E · Timezone: {weather.weather.timezone}
                      </p>
                    </div>

                    <div className="weather-condition-badge" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                      <WeatherIcon name={weather.weather.current.icon} size={24} />
                      <span>{weather.weather.current.condition}</span>
                    </div>
                  </div>

                  <div className="weather-hero-temp-block">
                    <div className="hero-temp">
                      {Math.round(weather.weather.current.temperature_2m)}
                      <span>°C</span>
                    </div>
                    <div className="hero-condition">
                      <span className="hero-condition-text">{weather.weather.current.condition}</span>
                      <span className="hero-feels">
                        Feels like <strong>{Math.round(weather.weather.current.apparent_temperature)}°C</strong>
                      </span>
                      <span className="tiny" style={{ color: '#c5e2ce' }}>
                        Last fetched: {new Date(weather.weather.fetched_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="weather-hero-metrics">
                    <div className="hero-metric-tile">
                      <Droplets size={20} />
                      <div>
                        <small>Relative Humidity</small>
                        <strong>{weather.weather.current.relative_humidity_2m}%</strong>
                      </div>
                    </div>

                    <div className="hero-metric-tile">
                      <Wind size={20} />
                      <div>
                        <small>Wind Velocity</small>
                        <strong>{weather.weather.current.wind_speed_10m} km/h</strong>
                      </div>
                    </div>

                    <div className="hero-metric-tile">
                      <CloudRain size={20} />
                      <div>
                        <small>Precipitation</small>
                        <strong>{weather.weather.current.precipitation} mm</strong>
                      </div>
                    </div>

                    <div className="hero-metric-tile">
                      <Activity size={20} />
                      <div>
                        <small>7-Day Rain Volume</small>
                        <strong>
                          {weather.weather.daily_forecast
                            ?.reduce((acc, d) => acc + (d.precipitation_sum || 0), 0)
                            .toFixed(1)}{' '}
                          mm
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 7-Day Agricultural Forecast Grid */}
                <div className="panel" style={{ padding: '20px', marginBottom: '22px' }}>
                  <div className="panel-heading" style={{ marginBottom: '14px' }}>
                    <div>
                      <span className="small-label">7-DAY FIELD OUTLOOK</span>
                      <h3 style={{ margin: '4px 0 0' }}>Daily Meteorological Outlook</h3>
                    </div>
                    <span className="outlook-tag">Dynamic Open-Meteo Multi-Day Model</span>
                  </div>

                  <div className="forecast-card-grid">
                    {(weather.weather.daily_forecast || []).map((day) => (
                      <div className="forecast-tile" key={day.date}>
                        <span className="day-title">{day.day}</span>
                        <span className="day-date">{day.formatted_date}</span>
                        <div className="day-icon">
                          <WeatherIcon name={day.icon} size={22} />
                        </div>
                        <div className="forecast-condition-cell">
                          {day.condition}
                        </div>

                        <div className="day-temp">
                          {day.max_temp}°<span>/ {day.min_temp}°</span>
                        </div>
                        <span className={`day-rain ${day.precipitation_probability > 40 ? 'rain-high' : ''}`}>
                          💧 {day.precipitation_probability}% ({day.precipitation_sum}mm)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI METEOROLOGICAL ANALYSIS & PREDICTIONS SECTION */}
                <section className="ai-analysis-section">
                  <div className="ai-trigger-card">
                    <div className="ai-trigger-copy">
                      <h3>
                        <Sparkles size={18} /> Local LLM Meteorological Analysis & Agro-Predictions
                      </h3>
                      <p>
                        Our local AI model ({health?.ai_model || 'Local Model'}) parses the real-time weather reports,
                        humidity, wind, and 7-day rainfall models to forecast disease hazards, irrigation schedules, and
                        spraying windows.
                      </p>
                    </div>
                    <button
                      className="button primary"
                      disabled={analyzingWeather}
                      onClick={runWeatherAnalysis}
                    >
                      <Sparkles size={15} className={analyzingWeather ? 'spin' : ''} />
                      {analyzingWeather ? 'Synthesizing Predictions...' : 'Run Local LLM Analysis'}
                    </button>
                  </div>

                  {weatherAnalysis ? (
                    <div className="ai-report-box">
                      <div className="ai-report-header">
                        <h3>
                          <ShieldCheck size={18} /> Real-Time Agro-Meteorological Evaluation
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="ai-badge">Local LLM Generated</span>
                          <span className="tiny muted">{new Date(weatherAnalysis.analyzed_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* AI Executive Summary */}
                      <div className="ai-summary-text">
                        <strong>AI Micro-Climate Synthesis:</strong>
                        <p style={{ margin: '6px 0 0', lineHeight: '1.6' }}>{weatherAnalysis.summary}</p>
                      </div>

                      {/* Dynamic Advisories Grid */}
                      <div className="advisories-grid">
                        {/* Irrigation Schedule */}
                        <div className="advisory-card">
                          <div className="advisory-card-top">
                            <strong>
                              <Droplets size={15} /> Irrigation
                            </strong>
                            <span
                              className={`advisory-status-badge ${
                                weatherAnalysis.advisories?.irrigation?.status?.toLowerCase().includes('hold')
                                  ? 'warn'
                                  : 'good'
                              }`}
                            >
                              {weatherAnalysis.advisories?.irrigation?.status || 'Scheduled'}
                            </span>
                          </div>
                          <p>{weatherAnalysis.advisories?.irrigation?.recommendation}</p>
                        </div>

                        {/* Agrochemical Spraying */}
                        <div className="advisory-card">
                          <div className="advisory-card-top">
                            <strong>
                              <Wind size={15} /> Spraying Safety
                            </strong>
                            <span
                              className={`advisory-status-badge ${
                                weatherAnalysis.advisories?.spraying?.status?.toLowerCase().includes('optimal')
                                  ? 'good'
                                  : 'danger'
                              }`}
                            >
                              {weatherAnalysis.advisories?.spraying?.status || 'Active'}
                            </span>
                          </div>
                          <p>{weatherAnalysis.advisories?.spraying?.recommendation}</p>
                        </div>

                        {/* Pest & Disease Hazard Index */}
                        <div className="advisory-card">
                          <div className="advisory-card-top">
                            <strong>
                              <AlertTriangle size={15} /> Disease Hazard
                            </strong>
                            <span
                              className={`advisory-status-badge ${
                                weatherAnalysis.advisories?.pest_risk?.level === 'High'
                                  ? 'danger'
                                  : weatherAnalysis.advisories?.pest_risk?.level === 'Moderate'
                                  ? 'warn'
                                  : 'good'
                              }`}
                            >
                              {weatherAnalysis.advisories?.pest_risk?.level || 'Low'} Risk
                            </span>
                          </div>
                          <p>{weatherAnalysis.advisories?.pest_risk?.description}</p>
                        </div>

                        {/* Field Operations & Tillage */}
                        <div className="advisory-card">
                          <div className="advisory-card-top">
                            <strong>
                              <Activity size={15} /> Field Operations
                            </strong>
                            <span
                              className={`advisory-status-badge ${
                                weatherAnalysis.advisories?.field_operations?.status === 'Favorable' ? 'good' : 'warn'
                              }`}
                            >
                              {weatherAnalysis.advisories?.field_operations?.status || 'Favorable'}
                            </span>
                          </div>
                          <p>{weatherAnalysis.advisories?.field_operations?.recommendation}</p>
                        </div>
                      </div>

                      {/* 7-Day Meteorological Predictions List */}
                      {weatherAnalysis.meteorological_predictions && (
                        <div className="predictions-block">
                          <h4>
                            <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} /> 7-Day Meteorological
                            Predictions & Trend Outlook
                          </h4>
                          <div className="predictions-list">
                            {weatherAnalysis.meteorological_predictions.map((pred, pIdx) => (
                              <div className="prediction-item" key={pIdx}>
                                <CheckCircle2 size={16} />
                                <span>{pred}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="panel" style={{ padding: '24px', textAlign: 'center', color: '#688070' }}>
                      <Sparkles size={28} style={{ margin: '0 auto 8px', color: '#2b7d4a' }} />
                      <h4 style={{ margin: '0 0 6px', color: '#1a3323' }}>Ready for Local Meteorological Analysis</h4>
                      <p style={{ margin: '0 auto 16px', maxWidth: '420px', fontSize: '12px' }}>
                        Click the button above to run our local AI reasoning engine on your live Open-Meteo weather
                        reports.
                      </p>
                      <button className="button primary" onClick={runWeatherAnalysis} disabled={analyzingWeather}>
                        <Sparkles size={14} /> Run Analysis Now
                      </button>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="panel empty-state">
                <CloudSun size={36} style={{ color: '#2b7d4a', margin: '0 auto 12px' }} />
                <h3>No Field Weather Synced Yet</h3>
                <p>Detect your GPS location or search your village above to fetch live Open-Meteo weather reports.</p>
                <button className="button primary" onClick={detectLiveLocation} disabled={detectingLocation}>
                  <Navigation size={14} className={detectingLocation ? 'spin' : ''} /> Detect GPS Location
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE 3: AI CROP RECOMMENDATIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'recommendations' && (
          <div className="page-container">
            <div className="page-header-row">
              <div>
                <h2>Weather-Calibrated Crop Suggestions</h2>
                <p>
                  Ranked dynamically by integrating current field temperature, rainfall forecast, soil characteristics,
                  and season.
                </p>
              </div>
              <div className="header-actions-group">
                <button
                  className="button primary"
                  disabled={busy || !selectedFarm}
                  onClick={() => generateRecommendations(selectedFarm)}
                >
                  <Sparkles size={15} className={busy ? 'spin' : ''} />
                  {busy ? 'Evaluating Crops...' : 'Recalculate Suggestions'}
                </button>
              </div>
            </div>

            {/* Weather calibration status banner */}
            {recommendation?.weather_context && (
              <div className="weather-context-banner">
                <Sparkles size={17} />
                <div>
                  <strong>Live Weather Calibration Active:</strong>{' '}
                  <span>
                    Field Temp {recommendation.weather_context.temperature}°C · Condition:{' '}
                    {recommendation.weather_context.condition} · Humidity {recommendation.weather_context.humidity}% ·{' '}
                    {recommendation.weather_context.forecast_summary}
                  </span>
                </div>
              </div>
            )}

            {/* Local LLM Agronomic Synthesis Card */}
            {recommendation?.ai_summary && (
              <div className="ai-report-box" style={{ marginBottom: '18px' }}>
                <div className="ai-report-header">
                  <h3 style={{ fontSize: '15px' }}>
                    <Sprout size={17} /> Local AI Agronomist Sowing & Management Guidance
                  </h3>
                  <span className="ai-badge">Local LLM Generated</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.65', color: '#273e30' }}>
                  {recommendation.ai_summary}
                </p>
              </div>
            )}

            {/* Category filter pills */}
            <div className="filter-pills-row">
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#687d6f', marginRight: '6px' }}>Filter:</span>
              <button
                type="button"
                className={`filter-pill ${cropCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCropCategoryFilter('all')}
              >
                All Crops ({recommendation?.items?.length || 0})
              </button>
              <button
                type="button"
                className={`filter-pill ${cropCategoryFilter === 'cereals' ? 'active' : ''}`}
                onClick={() => setCropCategoryFilter('cereals')}
              >
                Grains & Cereals
              </button>
              <button
                type="button"
                className={`filter-pill ${cropCategoryFilter === 'oilseeds' ? 'active' : ''}`}
                onClick={() => setCropCategoryFilter('oilseeds')}
              >
                Oilseeds
              </button>
              <button
                type="button"
                className={`filter-pill ${cropCategoryFilter === 'pulses' ? 'active' : ''}`}
                onClick={() => setCropCategoryFilter('pulses')}
              >
                Pulses & Legumes
              </button>
              <button
                type="button"
                className={`filter-pill ${cropCategoryFilter === 'cash' ? 'active' : ''}`}
                onClick={() => setCropCategoryFilter('cash')}
              >
                Cash & Fiber Crops
              </button>
            </div>

            {/* Recommendation Grid */}
            {filteredCrops.length > 0 ? (
              <div className="recommendation-grid">
                {filteredCrops.map((item, index) => (
                  <article className={`crop-card panel ${index === 0 ? 'top-crop' : ''}`} key={item.crop}>
                    <div className="crop-card-top">
                      <div className="crop-icon">
                        <Leaf size={19} />
                      </div>
                      <div className="badge-group">
                        {item.weather_compatibility && (
                          <span
                            className={`weather-badge ${
                              item.weather_compatibility.toLowerCase().includes('optimal')
                                ? 'optimal'
                                : item.weather_compatibility.toLowerCase().includes('heat')
                                ? 'caution'
                                : 'normal'
                            }`}
                          >
                            {item.weather_compatibility}
                          </span>
                        )}
                        <span className="rank-label">#{index + 1} Match</span>
                      </div>
                    </div>

                    <h3>{item.crop}</h3>
                    {item.description && <p className="crop-desc">{item.description}</p>}

                    <div className="score-line">
                      <div className="score-track">
                        <div style={{ width: `${Math.min(100, item.score * 10)}%` }} />
                      </div>
                      <span className="score-text">{item.score}/10 suitability</span>
                    </div>

                    <div className="reason-block">
                      <strong>Suitability Factors:</strong>
                      <ul>
                        {item.reasons.map((reason, rIdx) => (
                          <li key={rIdx}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    {item.cautions && item.cautions.length > 0 && (
                      <div className="caution-block">
                        <AlertTriangle size={15} />
                        <span>{item.cautions.join(' ')}</span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="suggestion-empty panel">
                <div className="crop-icon">
                  <Leaf size={22} />
                </div>
                <div>
                  <h3>No crop matches for this filter</h3>
                  <p>Try switching the category filter to &quot;All Crops&quot; or re-calculate suggestions.</p>
                </div>
                <button className="button secondary" onClick={() => setCropCategoryFilter('all')}>
                  Show All Crops
                </button>
              </div>
            )}

            {/* Certified Seed Varieties & Availability Catalog */}
            <div className="panel" style={{ marginTop: '26px', padding: '22px' }}>
              <div className="panel-heading" style={{ marginBottom: '14px' }}>
                <div>
                  <span className="small-label">ICAR & STATE SEED CORPORATIONS</span>
                  <h3 style={{ margin: '4px 0 0' }}>High-Yielding & Climate-Resilient Certified Seed Varieties</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#566e5f' }}>
                    Authentic seeds catalog with duration, yield potential, and trusted agricultural advisory sources.
                  </p>
                </div>
                <span className="live-status-pill"><span className="pulse-dot" /> ICAR / KVK Verified</span>
              </div>

              <div className="seed-varieties-grid">
                {seedVarieties.map((seed, sIdx) => (
                  <div className="seed-card" key={sIdx}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="seed-badge">{seed.crop}</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#688070' }}>{seed.duration_days} days maturity</span>
                      </div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#163520' }}>{seed.variety_name}</h4>
                      <p style={{ fontSize: '11px', color: '#688070', margin: '0 0 10px' }}>🏛️ Source: {seed.source}</p>

                      <div style={{ background: '#f8faf6', padding: '8px 10px', borderRadius: '8px', marginBottom: '10px', fontSize: '11px' }}>
                        <div><strong>Yield:</strong> {seed.yield_potential}</div>
                        <div><strong>Best Soil:</strong> {seed.suitable_soil}</div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#334839' }}>
                        <strong>Characteristics:</strong>
                        <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                          {seed.key_traits.map((trait, tIdx) => (
                            <li key={tIdx}>{trait}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #edf4ea', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#1e6837', fontWeight: '700' }}>{seed.availability}</span>
                      <span className="outlook-tag" style={{ background: '#eaf6ec', color: '#23733d' }}>Certified Seed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {recommendation?.warnings && (
              <div className="disclaimer" style={{ marginTop: '20px' }}>
                <Info size={17} />
                <p>
                  <strong>Agronomic decision support:</strong> {recommendation.warnings.join(' ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE: CROP DOCTOR - DISEASE & STRESS DIAGNOSIS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'disease' && (
          <div className="page-container">
            <div className="page-header-row">
              <div>
                <h2>Crop Doctor: Disease Detection & Stress Diagnostics</h2>
                <p>Upload a field leaf photo or select observed symptoms for immediate pathology and stress analysis.</p>
              </div>
            </div>

            <div className="doctor-layout">
              {/* Left Column: Photo Upload and Symptom Selection */}
              <div className="fert-form-panel">
                <form onSubmit={handleDiseaseDiagnose}>
                  <label>
                    Target Crop
                    <select value={diagnosisCrop} onChange={(e) => setDiagnosisCrop(e.target.value)}>
                      <option>Paddy</option>
                      <option>Cotton</option>
                      <option>Groundnut</option>
                      <option>Maize</option>
                      <option>Red Gram</option>
                      <option>Chilli</option>
                      <option>Tomato</option>
                      <option>Soybean</option>
                    </select>
                  </label>

                  <div style={{ margin: '14px 0 6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#304437' }}>Upload Leaf or Field Photo:</span>
                    <label className="photo-upload-zone" style={{ display: 'block', marginTop: '6px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setImagePreview(event.target.result);
                              setDiagnosisImage(event.target.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {imagePreview ? (
                        <div>
                          <img src={imagePreview} alt="Leaf Preview" className="preview-leaf-img" />
                          <p style={{ fontSize: '11px', color: '#2b7d4a', margin: '4px 0 0' }}>Photo Loaded. Click to change.</p>
                        </div>
                      ) : (
                        <div>
                          <UploadCloud size={32} style={{ color: '#387c53', margin: '0 auto 8px' }} />
                          <strong style={{ display: 'block', fontSize: '13px', color: '#1a3a24' }}>
                            Click to upload leaf photo or drag & drop
                          </strong>
                          <span style={{ fontSize: '11px', color: '#688070' }}>Supports JPG, PNG, WEBP from mobile camera or storage</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#304437' }}>Visual Field Symptoms Observed:</span>
                    <div className="symptoms-checkbox-grid">
                      {[
                        'Yellowing of leaves / Chlorosis',
                        'Brown or black circular leaf spots',
                        'Wilting / Drooping plant',
                        'Powdery white or grey coating',
                        'Red / orange rust pustules',
                        'Stunted growth / Curled leaves',
                      ].map((sym) => (
                        <label key={sym} className="symptom-check-item">
                          <input
                            type="checkbox"
                            checked={selectedSymptoms.includes(sym)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSymptoms([...selectedSymptoms, sym]);
                              } else {
                                setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
                              }
                            }}
                          />
                          <span>{sym}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label style={{ marginTop: '10px' }}>
                    Additional Observations (optional)
                    <input
                      value={diagnosisSymptoms}
                      onChange={(e) => setDiagnosisSymptoms(e.target.value)}
                      placeholder="e.g. Stem discoloration, pests visible on leaf underside..."
                    />
                  </label>

                  <button className="button primary full" type="submit" disabled={diagnosingBusy} style={{ marginTop: '14px' }}>
                    <Bug size={16} />
                    {diagnosingBusy ? 'Analyzing Pathology & Stress...' : 'Diagnose Disease & Stress'}
                  </button>
                </form>
              </div>

              {/* Right Column: Diagnosis Result or Prompt */}
              <div>
                {diagnosisResult ? (
                  <div className="diagnosis-result-card">
                    <div className="diagnosis-header">
                      <div>
                        <span className="small-label" style={{ color: '#8e5812' }}>PATHOLOGY REPORT · ICAR ADVISORY</span>
                        <h3 style={{ margin: '4px 0 2px', fontSize: '20px', color: '#163821' }}>
                          {diagnosisResult.disease_name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#688070' }}>
                          Target Crop: <strong>{diagnosisResult.crop}</strong> · Pathogen: <strong>{diagnosisResult.pathogen}</strong>
                        </p>
                      </div>
                      <span className="confidence-badge">
                        {Math.round((diagnosisResult.confidence || 0.92) * 100)}% Match
                      </span>
                    </div>

                    {/* Stress Factors */}
                    {diagnosisResult.stress_factors && (
                      <div style={{ background: '#fdf9f2', border: '1px solid #fae6c6', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                        <strong style={{ fontSize: '11px', color: '#8e5812', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertTriangle size={13} /> Crop Stress Analysis:
                        </strong>
                        <p style={{ fontSize: '11.5px', color: '#6b430a', margin: '4px 0 0', lineHeight: '1.45' }}>
                          {diagnosisResult.stress_factors}
                        </p>
                      </div>
                    )}

                    {/* Organic Treatment */}
                    <div className="treatment-box">
                      <strong>🌿 Recommended Organic & Biological Treatment:</strong>
                      <p>{diagnosisResult.organic_treatment}</p>
                    </div>

                    {/* Chemical Control */}
                    <div className="treatment-box chemical">
                      <strong>🧪 Chemical / Fungicidal Control (If Threshold Exceeded):</strong>
                      <p>{diagnosisResult.chemical_treatment}</p>
                    </div>

                    {/* Prevention Tips */}
                    {diagnosisResult.prevention && (
                      <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#384d3e' }}>
                        <strong>🛡️ Long-term Field Prevention:</strong>
                        <p style={{ margin: '4px 0 0', lineHeight: '1.5' }}>{diagnosisResult.prevention}</p>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #edf4ea', paddingTop: '10px', marginTop: '14px', fontSize: '10.5px', color: '#6c8574', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Advisory Source: {diagnosisResult.advisory_source}</span>
                      <span>Verified: {new Date(diagnosisResult.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="panel empty-state">
                    <Bug size={38} style={{ color: '#2b7d4a', margin: '0 auto 12px' }} />
                    <h3>No Diagnosis Run Yet</h3>
                    <p>Upload a clear photo of the infected leaf or tick the symptoms on the left to get instant biological & chemical remedies.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Past Diagnoses History */}
            {diagnosesHistory.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Recent Crop Scans & Pathology History</h3>
                <div className="history-card-grid">
                  {diagnosesHistory.slice(0, 4).map((diag, dIdx) => (
                    <div className="history-report-card" key={dIdx}>
                      <div className="card-head">
                        <div>
                          <h4>🌿 {diag.disease_name}</h4>
                          <time>{new Date(diag.created_at).toLocaleString()}</time>
                        </div>
                        <span className="confidence-badge">{Math.round((diag.confidence || 0.9) * 100)}%</span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#4d6354', margin: '4px 0' }}>
                        Crop: <strong>{diag.crop}</strong> · Symptoms: {diag.symptoms}
                      </p>
                      <div className="treatment-box" style={{ margin: '6px 0 0', padding: '8px 10px' }}>
                        <p style={{ fontSize: '11px' }}>{diag.organic_treatment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE: NUTRIENTS & APMC MANDI MARKET RATES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'fertilizer_market' && (
          <div className="page-container">
            <div className="page-header-row">
              <div>
                <h2>Fertilizer Nutrient Calculator & APMC Mandi Rates</h2>
                <p>Calculate precision N-P-K dosages tailored to your acreage, and check live mandi commodity market rates.</p>
              </div>
            </div>

            {/* Top Section: Fertilizer Calculator */}
            <div className="fertilizer-calc-layout">
              {/* Form */}
              <div className="fert-form-panel">
                <div className="panel-heading" style={{ marginBottom: '14px' }}>
                  <div>
                    <span className="small-label">PRECISION DOSAGE CALCULATOR</span>
                    <h3 style={{ margin: '4px 0 0' }}>Calculate Farm Fertilizer Plan</h3>
                  </div>
                </div>

                <form onSubmit={handleCalculateFertilizer}>
                  <label>
                    Target Crop
                    <select value={fertCrop} onChange={(e) => setFertCrop(e.target.value)}>
                      <option>Paddy</option>
                      <option>Cotton</option>
                      <option>Groundnut</option>
                      <option>Maize</option>
                      <option>Red Gram</option>
                      <option>Chilli</option>
                    </select>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label>
                      Field Area (acres)
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        required
                        value={fertArea}
                        onChange={(e) => setFertArea(e.target.value)}
                      />
                    </label>

                    <label>
                      Soil Type
                      <select value={fertSoil} onChange={(e) => setFertSoil(e.target.value)}>
                        <option>Black soil</option>
                        <option>Red soil</option>
                        <option>Loamy soil</option>
                        <option>Alluvial soil</option>
                        <option>Sandy soil</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Crop Growth Stage
                    <select value={fertStage} onChange={(e) => setFertStage(e.target.value)}>
                      <option>Basal / Sowing</option>
                      <option>Vegetative / Tillering</option>
                      <option>Flowering / Square Formation</option>
                      <option>Pod / Boll Maturity</option>
                    </select>
                  </label>

                  <button className="button primary full" type="submit" disabled={fertBusy} style={{ marginTop: '14px' }}>
                    <FlaskConical size={16} />
                    {fertBusy ? 'Calculating Dosages...' : 'Generate NPK Plan'}
                  </button>
                </form>
              </div>

              {/* Fertilizer Results Card */}
              <div className="fert-plan-card">
                <div className="panel-heading" style={{ marginBottom: '12px' }}>
                  <div>
                    <span className="small-label">RECOMMENDED N-P-K DOSAGE</span>
                    <h3 style={{ margin: '4px 0 0' }}>{fertilizerPlan?.crop || fertCrop} Plan ({fertArea} acres)</h3>
                  </div>
                  <span className="live-status-pill"><span className="pulse-dot" /> ICAR Standard</span>
                </div>

                {fertilizerPlan ? (
                  <div>
                    <div className="npk-badges-row">
                      <div className="npk-badge">
                        <small>Nitrogen (N)</small>
                        <strong>{fertilizerPlan.total_recommended_npk.nitrogen_kg} kg</strong>
                      </div>
                      <div className="npk-badge">
                        <small>Phosphorus (P)</small>
                        <strong>{fertilizerPlan.total_recommended_npk.phosphorus_kg} kg</strong>
                      </div>
                      <div className="npk-badge">
                        <small>Potassium (K)</small>
                        <strong>{fertilizerPlan.total_recommended_npk.potassium_kg} kg</strong>
                      </div>
                    </div>

                    <div style={{ background: '#f7faf5', borderRadius: '10px', padding: '12px 14px', margin: '14px 0' }}>
                      <strong style={{ fontSize: '12px', color: '#1a3a24', display: 'block', marginBottom: '8px' }}>
                        Commercial Fertilizer Bags Required:
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', fontSize: '11.5px' }}>
                        <div style={{ background: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid #e1ebe0' }}>
                          <strong>{fertilizerPlan.commercial_fertilizers_needed.urea_kg} kg</strong>
                          <span style={{ display: 'block', color: '#688070' }}>Urea</span>
                        </div>
                        <div style={{ background: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid #e1ebe0' }}>
                          <strong>{fertilizerPlan.commercial_fertilizers_needed.dap_kg} kg</strong>
                          <span style={{ display: 'block', color: '#688070' }}>DAP</span>
                        </div>
                        <div style={{ background: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid #e1ebe0' }}>
                          <strong>{fertilizerPlan.commercial_fertilizers_needed.mop_potash_kg} kg</strong>
                          <span style={{ display: 'block', color: '#688070' }}>MOP</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#384d3e', marginBottom: '10px' }}>
                      <strong>Micronutrients:</strong> {fertilizerPlan.micronutrients}
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#384d3e' }}>
                      <strong>Application Schedule:</strong>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                        {fertilizerPlan.application_schedule.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>
                    Select your crop parameters on the left and click &quot;Generate NPK Plan&quot; to calculate exact commercial bags and micro-nutrients.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Section: APMC Mandi Market Prices */}
            <div style={{ marginTop: '28px' }}>
              <div className="panel-heading" style={{ marginBottom: '12px' }}>
                <div>
                  <span className="small-label">LIVE AGMARKNET / APMC MANDI STREAM</span>
                  <h3 style={{ margin: '4px 0 0' }}>Commodity Market Prices & 7-Day Trends</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#566e5f' }}>
                    Live wholesale market rates per quintal (100 kg) across major agricultural trading centers.
                  </p>
                </div>
                <button className="button secondary" onClick={loadMarketPrices}>
                  <RefreshCw size={13} /> Refresh Mandi Rates
                </button>
              </div>

              <div className="market-rates-grid">
                {marketPrices.map((item, mIdx) => (
                  <div className="market-card" key={mIdx}>
                    <div>
                      <div className="market-card-head">
                        <div>
                          <strong style={{ fontSize: '14px', color: '#163821' }}>{item.crop}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#688070' }}>🏛️ {item.market_center}</span>
                        </div>
                        <span className={`trend-pill ${item.trend.includes('Upward') ? 'rising' : item.trend.includes('Downward') ? 'falling' : 'stable'}`}>
                          {item.trend.includes('Upward') ? <TrendingUp size={11} /> : item.trend.includes('Downward') ? <TrendingDown size={11} /> : null}
                          {item.trend}
                        </span>
                      </div>

                      <div className="market-price-big">₹{item.modal_price} <span style={{ fontSize: '12px', fontWeight: '500', color: '#688070' }}>/ Quintal</span></div>
                      <div style={{ fontSize: '11px', color: '#445b4b', margin: '4px 0' }}>
                        Range: ₹{item.min_price} – ₹{item.max_price}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #edf4ea', paddingTop: '8px', fontSize: '10.5px', color: '#688070', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Arrival: {item.arrival_volume}</span>
                      <span>Updated: Today</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE: FARMING ACTIVITY LOG & TRACKING */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'activities' && (
          <div className="page-container">
            <div className="page-header-row">
              <div>
                <h2>Farming Activity Tracking & Expenditure Log</h2>
                <p>Record sowing, irrigation, pesticide spraying, fertilizer application, and harvesting expenses.</p>
              </div>
            </div>

            <div className="activity-tracker-layout">
              {/* Left Column: Log New Activity Form */}
              <div className="activity-form-card">
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Record Field Activity</h3>
                <form onSubmit={handleAddActivity}>
                  <label>
                    Activity Type
                    <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                      <option>Sowing / Planting</option>
                      <option>Irrigation</option>
                      <option>Fertilizer Application</option>
                      <option>Pesticide Spray</option>
                      <option>Weeding & Inter-cultivation</option>
                      <option>Harvesting</option>
                      <option>Soil Testing</option>
                      <option>Land Tillage / Ploughing</option>
                    </select>
                  </label>

                  <label>
                    Target Crop
                    <input
                      value={activityCrop}
                      onChange={(e) => setActivityCrop(e.target.value)}
                      placeholder={selectedFarm?.current_crop || 'e.g. Cotton, Paddy'}
                    />
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      required
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                    />
                  </label>

                  <label>
                    Expenditure / Cost (₹)
                    <input
                      type="number"
                      min="0"
                      value={activityCost}
                      onChange={(e) => setActivityCost(e.target.value)}
                      placeholder="e.g. 1500"
                    />
                  </label>

                  <label>
                    Observations & Notes
                    <textarea
                      rows={3}
                      value={activityNotes}
                      onChange={(e) => setActivityNotes(e.target.value)}
                      placeholder="e.g. Applied 2 bags Urea, drip line flushed..."
                    />
                  </label>

                  <button className="button primary full" type="submit" disabled={activityBusy} style={{ marginTop: '12px' }}>
                    <Plus size={15} />
                    {activityBusy ? 'Logging Activity...' : 'Save Activity Entry'}
                  </button>
                </form>
              </div>

              {/* Right Column: Activities Timeline */}
              <div className="activity-list-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>Recorded Activities ({activities.length})</h3>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d5e35' }}>
                    Total Spent: ₹{activities.reduce((acc, a) => acc + (Number(a.cost) || 0), 0).toLocaleString()}
                  </div>
                </div>

                {activities.length > 0 ? (
                  <div>
                    {activities.map((act) => (
                      <div className="activity-row" key={act.activity_id}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span className="act-badge">{act.activity_type}</span>
                            <strong style={{ fontSize: '12px', color: '#163821' }}>{act.crop || 'Field Crop'}</strong>
                            <span style={{ fontSize: '11px', color: '#688070' }}>📅 {act.activity_date}</span>
                          </div>
                          {act.notes && <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#4d6354' }}>{act.notes}</p>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {act.cost > 0 && (
                            <strong style={{ fontSize: '12px', color: '#1d5e35' }}>₹{Number(act.cost).toLocaleString()}</strong>
                          )}
                          <button
                            type="button"
                            className="icon-button"
                            style={{ color: '#b34747' }}
                            title="Delete entry"
                            onClick={() => handleDeleteActivity(act.activity_id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="panel empty-state">
                    <Calendar size={32} style={{ color: '#2b7d4a', margin: '0 auto 10px' }} />
                    <h4 style={{ margin: '0 0 4px' }}>No Farming Activities Logged</h4>
                    <p style={{ margin: 0, fontSize: '12px' }}>Use the form on the left to track sowing dates, spraying cycles, and farm costs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE 4: LOCAL AI AGRONOMIST CHAT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'assistant' && (
          <div className="page-container">
            <div className="page-header-row" style={{ marginBottom: '14px' }}>
              <div>
                <h2>FarmPulse AI Agronomist Chat</h2>
                <p>Weather-aware conversational advisor running locally with real-time field context.</p>
              </div>
              <div className="header-actions-group">
                <label className="language-select" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#566e5f' }}>Language:</span>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {languageOptions.map((lang) => (
                      <option key={lang}>{lang}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="chat-page-layout">
              {/* Left Context Inspector */}
              <div className="chat-context-panel">
                <div>
                  <div className="context-section-title">ACTIVE FIELD CONTEXT</div>
                  <div className="context-tile">
                    <strong>{selectedFarm?.farm_name || 'Field Profile'}</strong>
                    <p>📍 {selectedFarm?.location || 'Location active'}</p>
                    <p>🌱 Soil: {selectedFarm?.soil_type || 'Unknown'}</p>
                    <p>💧 Water: {selectedFarm?.water_availability || 'Unknown'}</p>
                    <p>🗓️ Season: {selectedFarm?.season || 'Current'}</p>
                  </div>
                </div>

                <div>
                  <div className="context-section-title">LIVE WEATHER TELEMETRY FED TO AI</div>
                  <div className="context-tile">
                    <strong>
                      {weather?.weather ? `${Math.round(weather.weather.current.temperature_2m)}°C · ${weather.weather.current.condition}` : 'Syncing...'}
                    </strong>
                    <p>Humidity: {weather?.weather?.current?.relative_humidity_2m || '--'}%</p>
                    <p>Wind: {weather?.weather?.current?.wind_speed_10m || '--'} km/h</p>
                    <p>7-Day Outlook: {weather?.weather?.forecast_summary || 'Available in real-time'}</p>
                  </div>
                </div>

                <div>
                  <div className="context-section-title">LOCAL AI ENGINE STATUS</div>
                  <div className="context-tile" style={{ background: '#f0f7ef' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className="status-dot online" />
                      <strong style={{ margin: 0, color: '#205d37' }}>Local LLM Active</strong>
                    </div>
                    <p style={{ fontSize: '10px' }}>
                      Model: {health?.ai_model || 'Local Model'} ({health?.ai_device || 'CPU'})
                    </p>
                    <p style={{ fontSize: '10px' }}>Provider: Hugging Face Transformers</p>
                  </div>
                </div>
              </div>

              {/* Right Conversation Panel */}
              <div className="chat-conversation-panel">
                <div className="chat-header-bar">
                  <h3>
                    <MessageCircle size={18} /> Interactive Agronomic Advisor
                  </h3>
                  <span className="live-status-pill">
                    <span className="pulse-dot" /> Ready in {language}
                  </span>
                </div>

                {/* Prompt suggestion pills */}
                <div className="chat-prompt-suggestions">
                  <button
                    type="button"
                    className="prompt-chip"
                    onClick={() => setChatInput('Is it safe to spray pesticides or foliar fertilizers today with current wind and rain forecast?')}
                  >
                    💨 Can I spray today?
                  </button>
                  <button
                    type="button"
                    className="prompt-chip"
                    onClick={() => setChatInput('How should I schedule irrigation for my field considering upcoming rainfall?')}
                  >
                    💧 Irrigation scheduling
                  </button>
                  <button
                    type="button"
                    className="prompt-chip"
                    onClick={() => setChatInput('What fungal or insect pest risks should I monitor given the current humidity and temperature?')}
                  >
                    🦠 Pest & disease risks
                  </button>
                  <button
                    type="button"
                    className="prompt-chip"
                    onClick={() => setChatInput('Which crop is best suited for my soil and current weather conditions?')}
                  >
                    🌾 Best crop choice
                  </button>
                </div>

                {/* Chat message stream */}
                <div className="chat-stream-area">
                  {chatMessages.map((msg, i) => (
                    <div className={`chat-bubble ${msg.role}`} key={`${i}-${msg.role}`}>
                      <span>{msg.role === 'assistant' ? 'FarmPulse AI Advisor' : 'You'}</span>
                      <p>{msg.text}</p>
                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          className="audio-tts-btn"
                          onClick={() => (isSpeaking ? stopSpeech() : speakText(msg.text))}
                          title={`Listen to response in ${language}`}
                        >
                          {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                          {isSpeaking ? 'Stop Audio' : `🔊 Listen (${language})`}
                        </button>
                      )}
                    </div>
                  ))}
                  {chatBusy && (
                    <div className="chat-bubble assistant">
                      <span>FarmPulse AI Advisor</span>
                      <p className="typing">Analyzing live field conditions and drafting agronomic advice…</p>
                    </div>
                  )}
                </div>

                {/* Active voice banner */}
                {(isListening || isSpeaking) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#f0f7ef', borderRadius: '8px', margin: '6px 0', fontSize: '11px', color: '#1d5e35' }}>
                    <span>{isListening ? `🎤 Listening for your question in ${language}... Speak now.` : `🔊 Speaking response in ${language}...`}</span>
                    {isSpeaking && (
                      <button type="button" className="link-button" onClick={stopSpeech} style={{ fontSize: '11px', color: '#b33918' }}>
                        Stop Voice
                      </button>
                    )}
                  </div>
                )}

                {/* Chat input form */}
                <form className="chat-input-bar" onSubmit={sendChat}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask about watering, spraying, or crop disease risks in ${language}…`}
                    maxLength={3000}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #dfe6dd' }}
                  />
                  <button
                    type="button"
                    className={`voice-btn ${isListening ? 'recording' : ''}`}
                    onClick={isListening ? () => setIsListening(false) : startVoiceInput}
                    title="Speak question via microphone (Speech-to-Text)"
                  >
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                    {isListening ? 'Listening...' : 'Voice'}
                  </button>
                  <button className="button primary" disabled={chatBusy || !chatInput.trim()} type="submit">
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE 5: HISTORY & SAVED PREDICTION REPORTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'history' && (
          <div className="page-container">
            <div className="page-header-row">
              <div>
                <h2>Saved Reports & Prediction History</h2>
                <p>Review past AI weather analyses, pest evaluations, and crop recommendations saved in SQLite.</p>
              </div>
            </div>

            {/* Sub-tab navigation */}
            <div className="history-tabs-row">
              <button
                type="button"
                className={`history-tab-btn ${historyTab === 'weather' ? 'active' : ''}`}
                onClick={() => setHistoryTab('weather')}
              >
                <CloudSun size={16} /> AI Weather Analyses ({weatherHistory.length})
              </button>
              <button
                type="button"
                className={`history-tab-btn ${historyTab === 'crops' ? 'active' : ''}`}
                onClick={() => setHistoryTab('crops')}
              >
                <Leaf size={16} /> Crop Evaluations ({history.length})
              </button>
            </div>

            {/* Tab 1: Weather Analyses History */}
            {historyTab === 'weather' && (
              <div>
                {weatherHistory.length > 0 ? (
                  <div className="history-card-grid">
                    {weatherHistory.map((item) => (
                      <div className="history-report-card" key={item.analysis_id}>
                        <div className="card-head">
                          <div>
                            <h4>📍 {item.location || 'Field Location'}</h4>
                            <time>{new Date(item.created_at).toLocaleString()}</time>
                          </div>
                          <span
                            className={`advisory-status-badge ${
                              item.pest_risk?.level === 'High' ? 'danger' : item.pest_risk?.level === 'Moderate' ? 'warn' : 'good'
                            }`}
                          >
                            Pest: {item.pest_risk?.level || 'Normal'}
                          </span>
                        </div>

                        <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#2d4535', margin: 0 }}>
                          {item.weather_summary}
                        </p>

                        {item.advisories && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {item.advisories.irrigation && (
                              <span className="outlook-tag">💧 {item.advisories.irrigation.status}</span>
                            )}
                            {item.advisories.spraying && (
                              <span className="outlook-tag">💨 {item.advisories.spraying.status}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="panel empty-state">
                    <CloudSun size={32} style={{ color: '#2b7d4a', margin: '0 auto 10px' }} />
                    <h3>No Weather Analyses Saved Yet</h3>
                    <p>Go to the Weather Center tab and click &quot;Run Local AI Predictions&quot; to save an analysis.</p>
                    <button className="button primary" onClick={() => setActiveTab('weather')}>
                      Go to Weather Center
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Crop Recommendations History */}
            {historyTab === 'crops' && (
              <div>
                {history.length > 0 ? (
                  <div className="history-card-grid">
                    {history.map((item) => {
                      const crops = Array.isArray(item.candidate_crops) ? item.candidate_crops : [];
                      return (
                        <div className="history-report-card" key={item.recommendation_id}>
                          <div className="card-head">
                            <div>
                              <h4>🌾 {crops[0]?.crop || 'Crop Evaluation'}</h4>
                              <time>{new Date(item.created_at).toLocaleString()}</time>
                            </div>
                            <span className="live-status-pill">Suitability: {crops[0]?.score || '10'}/10</span>
                          </div>

                          {item.explanation && (
                            <p style={{ fontSize: '12px', color: '#334839', margin: '4px 0 0' }}>{item.explanation}</p>
                          )}

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {crops.slice(0, 4).map((c, idx) => (
                              <span key={idx} className="outlook-tag">
                                #{idx + 1} {c.crop.split('(')[0]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="panel empty-state">
                    <Leaf size={32} style={{ color: '#2b7d4a', margin: '0 auto 10px' }} />
                    <h3>No Crop Recommendations Saved</h3>
                    <p>Generate crop suggestions from the Crop Suggestions tab to see session comparisons here.</p>
                    <button className="button primary" onClick={() => setActiveTab('recommendations')}>
                      Go to Crop Suggestions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PAGE 6: FARM PROFILES & MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'farms' && (
          <div className="page-container">
            <div className="page-header-row">
              <div>
                <h2>Your Farm Profiles</h2>
                <p>Manage multiple agricultural fields, set active monitoring locations, and configure soil profiles.</p>
              </div>
              <button className="button primary" onClick={() => setShowFarmForm(!showFarmForm)}>
                <Plus size={16} /> {showFarmForm ? 'Close Form' : 'Add New Farm'}
              </button>
            </div>

            {/* Farmer Profile & Language Preferences Card */}
            <div className="panel" style={{ padding: '20px', marginBottom: '22px' }}>
              <div className="panel-heading" style={{ marginBottom: '14px' }}>
                <div>
                  <span className="small-label">FARMER PROFILE & ACCESSIBILITY</span>
                  <h3 style={{ margin: '4px 0 0' }}>Profile & Regional Language Preferences</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#566e5f' }}>
                    Select your preferred agricultural advisory language for AI chat, Voice STT/TTS, and notifications.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334839', display: 'block', marginBottom: '6px' }}>
                    Preferred Regional Language:
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d4ded3', width: '100%', fontSize: '12px' }}
                  >
                    <option value="English">English</option>
                    <option value="Telugu">తెలుగు (Telugu)</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                  </select>
                </div>

                <div style={{ background: '#f8faf6', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1ece0' }}>
                  <span style={{ fontSize: '11px', color: '#688070', display: 'block' }}>Connected Farmer Account</span>
                  <strong style={{ fontSize: '13px', color: '#163821' }}>{session.user?.email}</strong>
                  <span style={{ fontSize: '11px', color: '#2b7d4a', display: 'block', marginTop: '3px' }}>
                    ✓ Multi-farm database sync active ({farms.length} farms registered)
                  </span>
                </div>
              </div>
            </div>

            {/* Farm Form Panel */}
            {showFarmForm && (
              <section className="panel farm-form-panel" style={{ marginBottom: '22px' }}>
                <div className="panel-heading" style={{ marginBottom: '16px' }}>
                  <div>
                    <h3>Create New Farm Profile with Dynamic Location</h3>
                    <p>Search any village or use GPS auto-detect to automatically bind weather coordinates.</p>
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
                      placeholder="e.g. Green Valley Farm"
                    />
                  </label>

                  <div className="form-full-width">
                    <label>
                      Search Location / Village / City
                      <LocationSearchInput
                        value={farmForm.location}
                        onChange={(val) => setFarmForm((prev) => ({ ...prev, location: val }))}
                        onSelectLocation={(item) => {
                          setFarmForm((prev) => ({
                            ...prev,
                            location: item.display_name,
                            latitude: String(item.latitude),
                            longitude: String(item.longitude),
                          }));
                          setNotice(`📍 Location selected: ${item.display_name}`);
                        }}
                        onDetectLocation={detectLiveLocation}
                        detectingLocation={detectingLocation}
                      />
                    </label>
                  </div>

                  <label>
                    Latitude
                    <input
                      type="number"
                      step="any"
                      value={farmForm.latitude}
                      onChange={(e) => setFarmForm({ ...farmForm, latitude: e.target.value })}
                      placeholder="e.g. 17.3850"
                    />
                  </label>

                  <label>
                    Longitude
                    <input
                      type="number"
                      step="any"
                      value={farmForm.longitude}
                      onChange={(e) => setFarmForm({ ...farmForm, longitude: e.target.value })}
                      placeholder="e.g. 78.4867"
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
                      placeholder="e.g. 4.5"
                    />
                  </label>

                  <label>
                    Soil type
                    <select
                      value={farmForm.soil_type}
                      onChange={(e) => setFarmForm({ ...farmForm, soil_type: e.target.value })}
                    >
                      <option>Sandy soil</option>
                      <option>Loamy soil</option>
                      <option>Black soil</option>
                      <option>Clay soil</option>
                      <option>Red soil</option>
                      <option>Alluvial soil</option>
                      <option>Unknown</option>
                    </select>
                  </label>

                  <label>
                    Water availability
                    <select
                      value={farmForm.water_availability}
                      onChange={(e) => setFarmForm({ ...farmForm, water_availability: e.target.value })}
                    >
                      <option>Limited / rainfed</option>
                      <option>Moderate / borewell</option>
                      <option>Assured / canal irrigation</option>
                      <option>High / river basin</option>
                    </select>
                  </label>

                  <label>
                    Season
                    <select
                      value={farmForm.season}
                      onChange={(e) => setFarmForm({ ...farmForm, season: e.target.value })}
                    >
                      <option>Kharif / monsoon</option>
                      <option>Rabi / winter</option>
                      <option>Zaid / summer</option>
                      <option>Perennial</option>
                    </select>
                  </label>

                  <label>
                    Current crop (optional)
                    <input
                      value={farmForm.current_crop}
                      onChange={(e) => setFarmForm({ ...farmForm, current_crop: e.target.value })}
                      placeholder="e.g. Cotton, Groundnut"
                    />
                  </label>

                  <div className="form-actions">
                    <button type="button" className="button secondary" onClick={() => setShowFarmForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="button primary" disabled={busy}>
                      {busy ? 'Saving Farm…' : 'Save Farm Profile'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Farms Grid */}
            {farms.length > 0 ? (
              <div className="farms-grid">
                {farms.map((farm) => {
                  const isActive = farm.farm_id === selectedFarmId;
                  return (
                    <div className={`farm-card ${isActive ? 'active-farm-card' : ''}`} key={farm.farm_id}>
                      <div>
                        <div className="farm-card-head">
                          <h3>{farm.farm_name}</h3>
                          {isActive && <span className="live-status-pill">Active Farm</span>}
                        </div>
                        <p>📍 {farm.location || 'Coordinates saved'}</p>

                        <div className="farm-meta-table">
                          <div className="farm-meta-cell">
                            <small>Soil Type</small>
                            <strong>{farm.soil_type}</strong>
                          </div>
                          <div className="farm-meta-cell">
                            <small>Water Source</small>
                            <strong>{farm.water_availability}</strong>
                          </div>
                          <div className="farm-meta-cell">
                            <small>Season</small>
                            <strong>{farm.season}</strong>
                          </div>
                          <div className="farm-meta-cell">
                            <small>Land Area</small>
                            <strong>{farm.land_area ? `${farm.land_area} acres` : 'Not set'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="farm-card-actions">
                        {!isActive && (
                          <button
                            type="button"
                            className="button secondary"
                            style={{ fontSize: '11px', padding: '6px 10px' }}
                            onClick={() => {
                              setSelectedFarmId(farm.farm_id);
                              setNotice(`Switched active farm to ${farm.farm_name}.`);
                            }}
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          type="button"
                          className="button primary"
                          style={{ fontSize: '11px', padding: '6px 10px' }}
                          onClick={() => {
                            setSelectedFarmId(farm.farm_id);
                            loadWeather(farm);
                            setActiveTab('weather');
                          }}
                        >
                          <CloudSun size={13} /> Check Weather
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          style={{ color: '#b34747' }}
                          title="Delete farm"
                          onClick={() => deleteFarm(farm.farm_id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="panel empty-state">
                <MapPin size={36} style={{ color: '#2b7d4a', margin: '0 auto 12px' }} />
                <h3>No Farms Saved Yet</h3>
                <p>Create your first farm profile with dynamic GPS coordinates to start tracking weather and crop insights.</p>
                <button className="button primary" onClick={() => setShowFarmForm(true)}>
                  <Plus size={15} /> Add First Farm
                </button>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <footer className="page-footer">
          <span>FarmPulse · Team VAJRA · IC26-01-10</span>
          <span>Dynamic data powered by Open-Meteo Weather API & SQLite Local LLM Engine.</span>
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
