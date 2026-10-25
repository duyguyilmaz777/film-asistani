import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, ShieldCheck, Database, Trash2, Check } from 'lucide-react';
import { getSettings, saveSettings } from '../services/storageService';

export const SettingsModal = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [settings, setLocalSettings] = useState({
    tmdbApiKey: '',
    omdbApiKey: '',
    geminiApiKey: ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings(settings);
    setSavedSuccess(true);
    if (onSettingsUpdated) onSettingsUpdated(settings);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearHistory = () => {
    if (window.confirm('Tüm arama geçmişi ve zevk verilerini temizlemek istediğinize emin misiniz?')) {
      localStorage.removeItem('cineai_history');
      alert('Geçmiş başarıyla temizlendi.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-title-row">
            <Key size={20} className="text-accent" />
            <h3>Ayarlar & API Anahtarları</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="settings-form">

          {/* TMDB API Key */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="tmdbKey" className="form-label">
                TMDB API Anahtarı
                {settings.fromEnv?.tmdb && (
                  <span className="env-badge" title=".env dosyasından okundu">🔒 .env</span>
                )}
              </label>
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noreferrer"
                className="external-link-hint"
              >
                <span>Ücretsiz Al (1 dk)</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <input
              id="tmdbKey"
              type="password"
              placeholder={settings.fromEnv?.tmdb ? "•••••••• (.env dosyasından tanımlandı)" : "v3 API Anahtarınızı girin..."}
              value={settings.tmdbApiKey}
              onChange={(e) => setLocalSettings({ ...settings, tmdbApiKey: e.target.value })}
              className="settings-input"
            />
            <div className="form-help">
              Canlı Türkiye platform verileri, vizyon tarihleri ve afişler için kullanılır.
            </div>
          </div>

          {/* Gemini AI API Key */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="geminiKey" className="form-label">
                Google Gemini API Anahtarı
                {settings.fromEnv?.gemini && (
                  <span className="env-badge" title=".env dosyasından okundu">🔒 .env</span>
                )}
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="external-link-hint"
              >
                <span>Google AI Studio (Ücretsiz)</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <input
              id="geminiKey"
              type="password"
              placeholder={settings.fromEnv?.gemini ? "•••••••• (.env dosyasından tanımlandı)" : "AI Studio API Anahtarınızı girin..."}
              value={settings.geminiApiKey}
              onChange={(e) => setLocalSettings({ ...settings, geminiApiKey: e.target.value })}
              className="settings-input"
            />
            <div className="form-help">
              Boş bırakılırsa yerleşik akıllı tavsiye motoru sıfır maliyetle çalışmaya devam eder.
            </div>
          </div>

          {/* OMDB API Key */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="omdbKey" className="form-label">
                OMDb API Anahtarı (Opsiyonel)
                {settings.fromEnv?.omdb && (
                  <span className="env-badge" title=".env dosyasından okundu">🔒 .env</span>
                )}
              </label>
              <a
                href="https://www.omdbapi.com/apikey.aspx"
                target="_blank"
                rel="noreferrer"
                className="external-link-hint"
              >
                <span>Ücretsiz Anahtar Al</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <input
              id="omdbKey"
              type="password"
              placeholder="OMDb API Anahtarı..."
              value={settings.omdbApiKey}
              onChange={(e) => setLocalSettings({ ...settings, omdbApiKey: e.target.value })}
              className="settings-input"
            />
            <div className="form-help">
              Gerçek zamanlı resmi IMDb oy sayıları ve MPAA yaş derecelendirmeleri için kullanılır.
            </div>
          </div>

          {/* Clear Cache */}
          <div className="form-danger-zone">
            <button
              type="button"
              className="danger-btn"
              onClick={handleClearHistory}
            >
              <Trash2 size={15} />
              <span>Arama ve Zevk Hafızasını Sıfırla</span>
            </button>
          </div>

          {/* Footer Save Button */}
          <div className="settings-footer">
            <button type="submit" className="save-btn">
              {savedSuccess ? (
                <>
                  <Check size={18} />
                  <span>Ayarlar Kaydedildi!</span>
                </>
              ) : (
                <span>Ayarları Kaydet</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
