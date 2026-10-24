import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Upload,
  Camera,
  X,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  ShieldCheck,
  Leaf,
  FlaskConical,
  Youtube,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export default function CropDoctorChat({ language = 'en', languageLabel = 'English', t, token }) {
  const [messages, setMessages] = useState([
    {
      id: 'init-msg',
      role: 'assistant',
      text: t('doctorWelcome') || 'Namaste! I am your AI Crop Doctor. Describe your crop problem or upload/capture a photo of diseased leaves, fruits, or pests. I will diagnose the issue, recommend organic and chemical treatments, show visual reference photos, and provide step-by-step YouTube video tutorials in your language!',
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [loading, setLoading] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  const quickPrompts = [
    { label: t('prompt1') || '🌾 Rice Blast & Brown Spots', crop: 'Paddy', query: 'Rice paddy leaves have brown eye-shaped spots and leaf blast lesions' },
    { label: t('prompt2') || '🍅 Tomato Blight & Leaf Curl', crop: 'Tomato', query: 'Tomato leaves curling upward with yellow margins and stunted growth' },
    { label: t('prompt3') || '🌿 Cotton Pink Bollworm', crop: 'Cotton', query: 'Cotton flower buds showing rosette blooms and boll borer damage' },
    { label: t('prompt4') || '🌶️ Chilli Leaf Curl Virus', crop: 'Chilli', query: 'Chilli leaves curling, puckering with whitefly infestation' },
    { label: t('prompt5') || '🥜 Groundnut Tikka Disease', crop: 'Groundnut', query: 'Groundnut leaves have dark circular spots with yellow halos (Tikka leaf spot)' }
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (overrideText = null, overrideImage = null, cropOverride = null) => {
    const textToSend = overrideText !== null ? overrideText : inputText.trim();
    const imageToSend = overrideImage !== null ? overrideImage : selectedImage;
    const crop = cropOverride || selectedCrop;

    if (!textToSend && !imageToSend) return;

    const userMsg = {
      id: 'usr-' + Date.now(),
      role: 'user',
      text: textToSend || (t('photoAttached') || 'Attached crop photo for diagnosis'),
      image: imageToSend,
      crop: crop,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/crop-doctor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: textToSend || 'Analyzing photo of crop symptoms and pathology',
          image_data: imageToSend,
          crop: crop,
          language: languageLabel
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diagnosis service unavailable');

      const botMsg = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        text: data.reply || data.diagnosis?.chat_summary || 'Diagnosis report generated.',
        diagnosis: data.diagnosis,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          role: 'assistant',
          text: `⚠️ Diagnostic advisory: ${err.message}. Please check your connection and try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="crop-doctor-card-container">
      {/* Header bar */}
      <div className="doctor-header-bar">
        <div className="doctor-brand-meta">
          <div className="doctor-avatar">
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>{t('doctorTitle') || 'Crop Doctor AI'}</strong>
              <span className="online-badge">
                <span className="pulse-dot" /> Online
              </span>
            </div>
            <p>{t('doctorSubtitle') || 'ChatGPT-style plant disease pathologist & video advisor'}</p>
          </div>
        </div>

        <div className="doctor-header-actions">
          <div className="crop-select-badge">
            <Leaf size={14} style={{ color: '#2b7d4a' }} />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="crop-selector-dropdown"
              title="Select crop under diagnosis"
            >
              <option value="Tomato">Tomato / టమోటా</option>
              <option value="Paddy">Paddy (Rice) / వరి</option>
              <option value="Cotton">Cotton / పత్తి</option>
              <option value="Chilli">Chilli / మిరప</option>
              <option value="Groundnut">Groundnut / వేరుశనగ</option>
              <option value="Maize">Maize (Corn) / మొక్కజొన్న</option>
              <option value="Soybean">Soybean / సోయాబీన్</option>
              <option value="Wheat">Wheat / గోధుమ</option>
              <option value="Sugarcane">Sugarcane / చెరకు</option>
              <option value="Banana">Banana / అరటి</option>
              <option value="Other">Other Field Crop</option>
            </select>
          </div>

          <span className="lang-indicator-pill">
            🗣️ {languageLabel}
          </span>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="doctor-chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}
          >
            <div className={`msg-avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
              {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
            </div>

            <div className="msg-content-wrapper">
              <div className="msg-bubble">
                {msg.image && (
                  <div className="msg-image-attachment">
                    <img
                      src={msg.image}
                      alt="Crop symptom observation"
                      onClick={() => setPreviewModalImg(msg.image)}
                    />
                    <span className="attachment-label">📸 Field Photo (Tap to zoom)</span>
                  </div>
                )}
                
                <div className="msg-text-formatted">
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx} style={{ margin: '0 0 6px' }}>{line}</p>
                  ))}
                </div>
              </div>

              {/* Rich Diagnosis Details Card (if present) */}
              {msg.diagnosis && (
                <div className="doctor-diagnosis-card">
                  <div className="diag-card-head">
                    <div>
                      <div className="diag-card-kicker">
                        <Sparkles size={14} style={{ color: '#2b7d4a' }} />
                        <span>{t('diagnosisCardTitle') || 'AI PATHOLOGY & REMEDY REPORT'}</span>
                      </div>
                      <h3 className="diag-disease-title">{msg.diagnosis.disease_name}</h3>
                      {msg.diagnosis.english_name && msg.diagnosis.english_name !== msg.diagnosis.disease_name && (
                        <span className="diag-subname">({msg.diagnosis.english_name})</span>
                      )}
                    </div>

                    <div className="diag-badges-col">
                      <span className={`diag-severity-pill ${msg.diagnosis.severity?.toLowerCase().includes('high') ? 'high' : 'medium'}`}>
                        <AlertTriangle size={13} /> {msg.diagnosis.severity || 'Moderate'}
                      </span>
                      <span className="diag-confidence-pill">
                        {Math.round((msg.diagnosis.confidence || 0.94) * 100)}% {t('confidence') || 'Confidence'}
                      </span>
                    </div>
                  </div>

                  {/* Treatment Grids */}
                  <div className="remedy-grid">
                    <div className="remedy-card organic">
                      <div className="remedy-head">
                        <Leaf size={16} />
                        <strong>{t('organicTreatment') || 'Organic & Biological Remedies'}</strong>
                      </div>
                      <p>{msg.diagnosis.organic_treatment}</p>
                    </div>

                    <div className="remedy-card chemical">
                      <div className="remedy-head">
                        <FlaskConical size={16} />
                        <strong>{t('chemicalTreatment') || 'Recommended Chemical Spray'}</strong>
                      </div>
                      <p>{msg.diagnosis.chemical_treatment}</p>
                    </div>
                  </div>

                  {/* Prevention Measures */}
                  {msg.diagnosis.preventive_measures && msg.diagnosis.preventive_measures.length > 0 && (
                    <div className="prevention-strip">
                      <div className="prevention-title">
                        <ShieldCheck size={15} style={{ color: '#2b7d4a' }} />
                        <strong>{t('prevention') || 'Cultural Prevention Measures'}:</strong>
                      </div>
                      <ul className="prevention-list">
                        {msg.diagnosis.preventive_measures.map((p, pIdx) => (
                          <li key={pIdx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual Reference Photos */}
                  {msg.diagnosis.reference_photos && msg.diagnosis.reference_photos.length > 0 && (
                    <div className="ref-photos-section">
                      <div className="ref-section-head">
                        <ImageIcon size={15} style={{ color: '#2b7d4a' }} />
                        <strong>{t('relatedPhotos') || 'Visual Reference Photos & Symptom Comparison'}:</strong>
                      </div>
                      <div className="photo-ref-grid">
                        {msg.diagnosis.reference_photos.map((photo, phIdx) => (
                          <div
                            key={phIdx}
                            className="photo-ref-card"
                            onClick={() => setPreviewModalImg(photo.url)}
                          >
                            <img src={photo.url} alt={photo.label} loading="lazy" />
                            <div className="photo-ref-card-info">
                              <strong>{photo.label}</strong>
                              <p>{photo.stage}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* YouTube Video Tutorials */}
                  {msg.diagnosis.youtube_videos && msg.diagnosis.youtube_videos.length > 0 && (
                    <div className="yt-videos-section">
                      <div className="ref-section-head">
                        <Youtube size={17} style={{ color: '#dc2626' }} />
                        <strong>{t('youtubeVideos') || 'Expert YouTube Video Guides & Treatments'}:</strong>
                      </div>

                      <div className="yt-cards-grid">
                        {msg.diagnosis.youtube_videos.map((vid, vIdx) => (
                          <a
                            key={vIdx}
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="yt-card"
                          >
                            <div className="yt-thumbnail-wrapper">
                              <img src={vid.thumbnail} alt={vid.title} loading="lazy" />
                              <div className="yt-play-btn">▶</div>
                            </div>
                            <div className="yt-card-body">
                              <strong>{vid.title}</strong>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {t('watchOnYoutube') || 'Watch Guide'} <ExternalLink size={12} />
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>

                      {msg.diagnosis.youtube_search_url && (
                        <div style={{ marginTop: '12px', textAlign: 'right' }}>
                          <a
                            href={msg.diagnosis.youtube_search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="more-yt-link"
                          >
                            <Youtube size={14} style={{ color: '#dc2626' }} />
                            <span>Search more {msg.diagnosis.disease_name} tutorials in {languageLabel} on YouTube</span>
                            <ChevronRight size={13} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <span className="msg-timestamp">{msg.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-msg-row bot">
            <div className="msg-avatar bot">
              <Sparkles size={18} />
            </div>
            <div className="msg-content-wrapper">
              <div className="msg-bubble typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#3c6e4e' }}>
                  Crop Doctor AI is inspecting symptoms and preparing multilingual advice...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts Row */}
      <div className="doctor-quick-prompts">
        <span className="quick-prompt-label">{t('quickPrompts') || 'Quick Symptoms:'}</span>
        {quickPrompts.map((qp, qIdx) => (
          <button
            key={qIdx}
            type="button"
            className="prompt-pill-btn"
            onClick={() => {
              setSelectedCrop(qp.crop);
              sendMessage(qp.query, null, qp.crop);
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="doctor-chat-input-area">
        {selectedImage && (
          <div className="image-preview-strip">
            <img src={selectedImage} alt="Staged photo" />
            <div>
              <strong>Field Photo Attached</strong>
              <span>Ready for AI vision pathology diagnosis</span>
            </div>
            <button
              type="button"
              className="remove-img-btn"
              onClick={() => setSelectedImage(null)}
              title="Remove attached photo"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="doctor-input-form">
          {/* Hidden file inputs */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="photo-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo from gallery"
          >
            <Upload size={16} />
            <span>{t('uploadPhoto') || 'Upload'}</span>
          </button>

          <button
            type="button"
            className="photo-action-btn"
            onClick={() => cameraInputRef.current?.click()}
            title="Take photo using mobile/webcam"
          >
            <Camera size={16} />
            <span>{t('takePhoto') || 'Camera'}</span>
          </button>

          <input
            type="text"
            className="doctor-text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chatPlaceholder') || 'Describe crop symptoms (e.g. yellow spots on tomato leaves)...'}
            disabled={loading}
          />

          <button
            type="button"
            className="button primary doctor-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || (!inputText.trim() && !selectedImage)}
          >
            <Send size={16} />
            <span>{t('btnSend') || 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Modal for full image preview */}
      {previewModalImg && (
        <div className="img-modal-backdrop" onClick={() => setPreviewModalImg(null)}>
          <div className="img-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewModalImg} alt="Visual Reference Full Preview" />
            <button className="img-modal-close" onClick={() => setPreviewModalImg(null)}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
