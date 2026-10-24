import React, { useState } from 'react';
import {
  Sprout,
  Bot,
  CloudSun,
  ShieldCheck,
  ChevronDown,
  LogIn,
  Sparkles,
  ArrowRight,
  Youtube,
  Image as ImageIcon,
  Languages,
  CheckCircle2,
  AlertTriangle,
  User,
  LayoutDashboard
} from 'lucide-react';
import CropDoctorChat from './CropDoctorChat';
import LandingWeather from './LandingWeather';
import { languages } from './i18n';

export default function LandingPage({
  currentLang = 'en',
  onSelectLang,
  t,
  session,
  onOpenAuth,
  onGoToDashboard,
  onLogout
}) {
  const currentLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-layout">
      {/* Top Navigation Bar */}
      <header className="landing-nav">
        <div className="landing-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="landing-brand-logo">
            <Sprout size={24} strokeWidth={2.4} />
          </div>
          <div>
            <strong>CropGuard</strong>
            <span className="landing-brand-badge">CROP DOCTOR AI</span>
          </div>
        </div>

        {/* Navigation Anchor Links */}
        <nav className="landing-nav-links">
          <button type="button" onClick={() => scrollTo('doctor')} className="nav-anchor-link">
            <Bot size={15} />
            <span>{t('navCropDoctor') || 'Crop Doctor AI'}</span>
          </button>
          <button type="button" onClick={() => scrollTo('weather')} className="nav-anchor-link">
            <CloudSun size={15} />
            <span>{t('navWeather') || 'Live Weather'}</span>
          </button>
          <button type="button" onClick={() => scrollTo('features')} className="nav-anchor-link">
            <Sparkles size={15} />
            <span>{t('navFeatures') || 'Features'}</span>
          </button>
        </nav>

        {/* Right Corner Controls: Language Switcher + Farmer Sign In */}
        <div className="landing-nav-corner">
          {/* 11 Indian Languages Dropdown */}
          <div className="lang-picker-box">
            <Languages size={15} style={{ color: '#2b7d4a' }} />
            <select
              value={currentLang}
              onChange={(e) => onSelectLang(e.target.value)}
              className="lang-select-native"
              title="Select language / భాషను ఎంచుకోండి / भाषा चुनें"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} ({l.label})
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ color: '#688070', pointerEvents: 'none' }} />
          </div>

          {/* Top-Right Login / Dashboard Button */}
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="button primary corner-login-btn"
                onClick={onGoToDashboard}
              >
                <LayoutDashboard size={15} />
                <span>{t('navWorkspace') || 'Farmer Workspace'}</span>
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={onLogout}
                style={{ padding: '8px 12px', fontSize: '11px' }}
              >
                {t('signOut') || 'Sign Out'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button primary corner-login-btn"
              onClick={onOpenAuth}
            >
              <LogIn size={15} />
              <span>{t('loginBtn') || 'Farmer Sign In'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={14} />
            <span>{t('heroBadge') || '🌿 AI Plant Pathology & Hyperlocal Telemetry'}</span>
          </div>

          <h1 className="hero-main-title">
            {t('heroTitle') || 'Instant Plant Disease Diagnosis & Live Weather for Every Farmer'}
          </h1>

          <p className="hero-main-subtitle">
            {t('heroSubtitle') || 'Chat with Crop Doctor AI like ChatGPT, upload crop photos, identify pests & diseases, get organic & chemical treatments, and watch expert YouTube video guides in your language.'}
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="button primary hero-primary-cta"
              onClick={() => scrollTo('doctor')}
            >
              <Bot size={17} />
              <span>{t('btnDiagnoseNow') || 'Ask Crop Doctor AI'}</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="button secondary hero-secondary-cta"
              onClick={() => scrollTo('weather')}
            >
              <CloudSun size={17} />
              <span>{t('btnCheckWeather') || 'View Live Weather'}</span>
            </button>
          </div>

          {/* Trust Value Badges */}
          <div className="hero-trust-row">
            <span className="trust-item">
              <CheckCircle2 size={14} style={{ color: '#2b7d4a' }} /> 100% Free for Indian Farmers
            </span>
            <span className="trust-item">
              <CheckCircle2 size={14} style={{ color: '#2b7d4a' }} /> 11 Indian Languages Supported
            </span>
            <span className="trust-item">
              <CheckCircle2 size={14} style={{ color: '#2b7d4a' }} /> ChatGPT-Style Photo Inspection
            </span>
            <span className="trust-item">
              <CheckCircle2 size={14} style={{ color: '#2b7d4a' }} /> CIBRC Chemical & ICAR Organic Remedies
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="landing-main-container">
        {/* SECTION 1: CROP DOCTOR AI (Primary Focus) */}
        <section id="doctor" className="landing-section-anchor">
          <div className="section-title-block">
            <span className="small-label" style={{ color: '#2b7d4a', fontWeight: 700 }}>
              🤖 CHATGPT FOR FARMERS
            </span>
            <h2>{t('doctorTitle') || 'Crop Doctor AI Assistant'}</h2>
            <p>{t('doctorSubtitle') || 'Chat with our AI plant pathologist or take/upload a photo of diseased leaves or pests'}</p>
          </div>

          <CropDoctorChat
            language={currentLang}
            languageLabel={currentLangObj.label}
            t={t}
            token={session?.access_token}
          />
        </section>

        {/* SECTION 2: LIVE WEATHER & ADVISORIES (Accessible without login) */}
        <section id="weather" className="landing-section-anchor" style={{ marginTop: '50px' }}>
          <div className="section-title-block">
            <span className="small-label" style={{ color: '#0284c7', fontWeight: 700 }}>
              🛰️ OPEN-METEO WEATHER & SOIL
            </span>
            <h2>{t('weatherTitle') || 'Hyperlocal Field Weather & 7-Day Forecast'}</h2>
            <p>{t('weatherSubtitle') || 'Live telemetry from Open-Meteo with dynamic agricultural spraying and irrigation advice'}</p>
          </div>

          <LandingWeather
            language={currentLang}
            languageLabel={currentLangObj.label}
            t={t}
            token={session?.access_token}
          />
        </section>

        {/* SECTION 3: KEY PLATFORM FEATURES */}
        <section id="features" className="landing-section-anchor" style={{ marginTop: '50px' }}>
          <div className="section-title-block">
            <span className="small-label" style={{ color: '#7c3aed', fontWeight: 700 }}>
              🌾 COMPLETE SMART AGRO-SUITE
            </span>
            <h2>State-of-the-Art Agricultural Technology</h2>
            <p>Built for smallholder farmers across India with local language reasoning and instant visual guidance.</p>
          </div>

          <div className="features-showcase-grid">
            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#eaf6ec', color: '#2b7d4a' }}>
                <Bot size={24} />
              </div>
              <h3>ChatGPT-Style AI Pathology</h3>
              <p>
                Multi-turn conversation with multimodal image analysis. Inspect fungal blights, bacterial wilts, stem borers, and nutrient chlorosis from photos.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <Youtube size={24} />
              </div>
              <h3>Curated Video Tutorials</h3>
              <p>
                Every diagnosis includes verified YouTube video guides demonstrating proper chemical dosage, organic spray preparation, and preventive field pruning.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <CloudSun size={24} />
              </div>
              <h3>Hyperlocal Field Telemetry</h3>
              <p>
                Direct Open-Meteo integration delivering 7-day weather outlooks, wind drift spraying alerts, and rainfall probability to protect your crops.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Languages size={24} />
              </div>
              <h3>11 Indian Languages</h3>
              <p>
                Dynamic diagnostic reports and agronomic advice natively translated in Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and Odia.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-brand-logo small">
              <Sprout size={18} />
            </div>
            <strong>CropGuard Smart Agriculture</strong>
          </div>
          <p className="footer-disclaimer">
            {t('disclaimer') || 'AI recommendations are for decision support. Confirm critical agronomic decisions with local agricultural extension officers.'}
          </p>
          <div className="footer-copyright">
            © {new Date().getFullYear()} CropGuard · Hyperlocal Telemetry & Agro-AI Pathologist
          </div>
        </div>
      </footer>
    </div>
  );
}
