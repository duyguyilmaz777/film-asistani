import React from 'react';
import {
  Sparkles,
  RotateCcw,
  Film,
  Tv,
  Layers,
  Star,
  Calendar,
  ShieldCheck,
  Check,
  X,
  Info
} from 'lucide-react';
import {
  YAS_GRUPLARI,
  GENRE_LIST,
  PLATFORMLAR,
  PLATFORM_CONFIG,
  DATE_RANGES,
  SIRALAMA_SECENEKLERI
} from '../constants/options';

export const FilterBar = ({
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  loading,
  isOpen,
  onClose
}) => {
  // Multi-select handler for Yaş Grubu
  const handleYasGrubuToggle = (groupId) => {
    const raw = filters.yasGrubu;
    let current = Array.isArray(raw) ? [...raw] : raw ? [raw] : ['all'];

    if (groupId === 'all') {
      onFilterChange({ ...filters, yasGrubu: ['all'] });
      return;
    }

    current = current.filter((g) => g !== 'all');

    if (current.includes(groupId)) {
      current = current.filter((g) => g !== groupId);
      if (current.length === 0) current = ['all'];
    } else {
      current.push(groupId);
    }

    onFilterChange({ ...filters, yasGrubu: current });
  };

  const isYasGrubuSelected = (groupId) => {
    const raw = filters.yasGrubu;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : ['all'];
    return list.includes(groupId);
  };

  // Multi-select handler for Film / Dizi Türü
  const handleTurToggle = (genre) => {
    const raw = filters.tur;
    let current = Array.isArray(raw) ? [...raw] : raw ? [raw] : ['Tümü'];

    if (genre === 'Tümü') {
      onFilterChange({ ...filters, tur: ['Tümü'] });
      return;
    }

    current = current.filter((g) => g !== 'Tümü');

    if (current.includes(genre)) {
      current = current.filter((g) => g !== genre);
      if (current.length === 0) current = ['Tümü'];
    } else {
      current.push(genre);
    }

    onFilterChange({ ...filters, tur: current });
  };

  const isTurSelected = (genre) => {
    const raw = filters.tur;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : ['Tümü'];
    return list.includes(genre);
  };

  // Multi-select handler for Platformlar
  const handlePlatformToggle = (platform) => {
    let current = [...(filters.platformlar || [])];
    if (platform === 'Tümü') {
      onFilterChange({ ...filters, platformlar: ['Tümü'] });
      return;
    }

    current = current.filter((p) => p !== 'Tümü');

    if (current.includes(platform)) {
      current = current.filter((p) => p !== platform);
      if (current.length === 0) current = ['Tümü'];
    } else {
      current.push(platform);
    }
    onFilterChange({ ...filters, platformlar: current });
  };

  const isPlatformSelected = (p) => {
    const list = filters.platformlar || ['Tümü'];
    return list.includes(p);
  };

  return (
    <aside className={`filter-bar-wrapper ${isOpen ? 'open' : ''}`}>
      <div className="filter-panel glass-panel">
        <div className="filter-header">
          <div className="filter-title">
            <Layers size={18} className="text-accent" />
            <span>Filtreleme & Akıllı Keşif</span>
          </div>
          <div className="filter-header-actions">
            <button
              onClick={onResetFilters}
              className="reset-btn"
              title="Tüm filtreleri sıfırla"
            >
              <RotateCcw size={14} />
              <span>Sıfırla</span>
            </button>
            {onClose && (
              <button
                type="button"
                className="filter-close-btn"
                onClick={onClose}
                title="Filtreleri Kapat"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-body">
          {/* 1) Media Type (Film vs Dizi) */}
          <div className="filter-section">
            <label className="filter-label">İçerik Tipi</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segment-btn ${filters.mediaType === 'all' ? 'active' : ''}`}
                onClick={() => onFilterChange({ ...filters, mediaType: 'all' })}
              >
                Tümü
              </button>
              <button
                type="button"
                className={`segment-btn ${filters.mediaType === 'movie' ? 'active' : ''}`}
                onClick={() => onFilterChange({ ...filters, mediaType: 'movie' })}
              >
                <Film size={14} />
                <span>Film</span>
              </button>
              <button
                type="button"
                className={`segment-btn ${filters.mediaType === 'tv' ? 'active' : ''}`}
                onClick={() => onFilterChange({ ...filters, mediaType: 'tv' })}
              >
                <Tv size={14} />
                <span>Dizi</span>
              </button>
            </div>
          </div>

          {/* 2) Yaş Grubu (Multi-select Content Rating Filter) */}
          <div className="filter-section">
            <div className="filter-label-flex">
              <label className="filter-label">
                <ShieldCheck size={15} className="text-emerald" />
                <span>Yaş Grubu & Aile Filtresi</span>
              </label>
              <span className="multi-hint">Çoklu Seçim</span>
            </div>
            <div className="platforms-grid">
              {YAS_GRUPLARI.map((yg) => {
                const active = isYasGrubuSelected(yg.id);
                return (
                  <button
                    key={yg.id}
                    type="button"
                    className={`platform-pill age-pill ${active ? 'active' : ''}`}
                    onClick={() => handleYasGrubuToggle(yg.id)}
                  >
                    {active && <Check size={12} />}
                    <span>{yg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3) Tür Seçimi (Multi-select Genre Filter) */}
          <div className="filter-section">
            <div className="filter-label-flex">
              <label className="filter-label">Film / Dizi Türü</label>
              <span className="multi-hint">Çoklu Seçim</span>
            </div>
            <div className="platforms-grid">
              {GENRE_LIST.map((genre) => {
                const active = isTurSelected(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    className={`platform-pill genre-select-pill ${active ? 'active' : ''}`}
                    onClick={() => handleTurToggle(genre)}
                  >
                    {active && <Check size={12} />}
                    <span>{genre === 'Tümü' ? '🎭 Tümü' : genre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4) Türkiye Yayın Platformları (Multi-select) */}
          <div className="filter-section">
            <div className="filter-label-flex">
              <label className="filter-label">Türkiye Yayın Platformları</label>
              <span className="multi-hint">Çoklu Seçim</span>
            </div>
            <div className="platforms-grid">
              <button
                type="button"
                className={`platform-pill ${isPlatformSelected('Tümü') ? 'active' : ''}`}
                onClick={() => handlePlatformToggle('Tümü')}
              >
                {isPlatformSelected('Tümü') && <Check size={12} />}
                <span>Tümü</span>
              </button>
              {PLATFORMLAR.map((platform) => {
                const conf = PLATFORM_CONFIG[platform];
                const active = isPlatformSelected(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    className={`platform-pill ${active ? 'active' : ''}`}
                    style={{
                      '--pill-color': conf.color,
                      '--pill-bg': conf.bg,
                      '--pill-border': conf.border
                    }}
                    onClick={() => handlePlatformToggle(platform)}
                  >
                    {active && <Check size={12} />}
                    <span>{conf.badgeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5) Minimum IMDb Puanı */}
          <div className="filter-section">
            <div className="filter-label-flex">
              <label className="filter-label">
                <Star size={15} className="text-gold" />
                <span>Min. IMDb Puanı</span>
              </label>
              <span className="slider-value">
                {filters.minPuan > 0 ? `⭐ ${filters.minPuan.toFixed(1)}+` : 'Filtresiz'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={filters.minPuan}
              onChange={(e) =>
                onFilterChange({ ...filters, minPuan: parseFloat(e.target.value) })
              }
              className="custom-slider"
            />
            <div className="slider-ticks">
              <span>0</span>
              <span>5.0</span>
              <span>7.0</span>
              <span>8.0</span>
              <span>9.0</span>
            </div>
          </div>

          {/* 6) Tarih Aralığı */}
          <div className="filter-section">
            <label className="filter-label">
              <Calendar size={15} />
              <span>Yayın Tarihi Aralığı</span>
            </label>
            <select
              value={filters.tarihAraligi}
              onChange={(e) =>
                onFilterChange({ ...filters, tarihAraligi: e.target.value })
              }
              className="custom-select"
            >
              {DATE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          {/* 7) Sıralama Kriteri */}
          <div className="filter-section">
            <label className="filter-label">Sıralama Ölçütü</label>
            <select
              value={filters.siralama}
              onChange={(e) =>
                onFilterChange({ ...filters, siralama: e.target.value })
              }
              className="custom-select highlight-select"
            >
              {SIRALAMA_SECENEKLERI.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* User-friendly explanation of Reliable (Bayesian) Score */}
            <div className="bayes-explainer-card">
              <div className="bayes-explainer-header">
                <Info size={14} className="text-cyan" />
                <span>Güvenilir Puan Nedir?</span>
              </div>
              <p className="bayes-explainer-text">
                Sadece birkaç kişinin yüksek puan verdiği yanıltıcı yapımlara aldanmamanız için; <strong>IMDb puanı ile oy veren izleyici sayısını</strong> birleştirerek hesaplanan gerçekçi başarı puanıdır.
              </p>
            </div>
          </div>

          {/* 8) Gemini AI Önerisi Toggle */}
          <div className="filter-section ai-toggle-section">
            <label className="ai-toggle-card">
              <input
                type="checkbox"
                checked={filters.aiIstendi}
                onChange={(e) =>
                  onFilterChange({ ...filters, aiIstendi: e.target.checked })
                }
              />
              <div className="ai-toggle-content">
                <div className="ai-toggle-title">
                  <Sparkles size={16} className="text-ai" />
                  <span>Gemini AI Danışmanı</span>
                </div>
                <div className="ai-toggle-desc">
                  En uygun 2-3 içeriği seçip karşılaştırmalı aile tavsiyesi üretir.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Apply Button */}
        <div className="filter-footer">
          <button
            type="button"
            className="apply-btn"
            onClick={() => {
              onApplyFilters();
              if (onClose) onClose();
            }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Sonuçları Getir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
