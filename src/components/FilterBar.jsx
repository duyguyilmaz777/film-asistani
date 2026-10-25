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
  Check
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
  isOpen
}) => {
  const handlePlatformToggle = (platform) => {
    let current = [...(filters.platformlar || [])];
    if (platform === 'Tümü') {
      onFilterChange({ ...filters, platformlar: ['Tümü'] });
      return;
    }

    // Remove 'Tümü' if selecting specific platform
    current = current.filter(p => p !== 'Tümü');

    if (current.includes(platform)) {
      current = current.filter(p => p !== platform);
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
          <button
            onClick={onResetFilters}
            className="reset-btn"
            title="Tüm filtreleri sıfırla"
          >
            <RotateCcw size={14} />
            <span>Sıfırla</span>
          </button>
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

          {/* 2) Yaş Grubu (Content Rating Filter) */}
          <div className="filter-section">
            <label className="filter-label">
              <ShieldCheck size={15} className="text-emerald" />
              <span>Yaş Grubu & Aile Filtresi</span>
            </label>
            <select
              value={filters.yasGrubu}
              onChange={(e) => onFilterChange({ ...filters, yasGrubu: e.target.value })}
              className="custom-select"
            >
              {YAS_GRUPLARI.map((yg) => (
                <option key={yg.id} value={yg.id}>
                  {yg.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3) Tür Seçimi */}
          <div className="filter-section">
            <label className="filter-label">Film / Dizi Türü</label>
            <select
              value={filters.tur}
              onChange={(e) => onFilterChange({ ...filters, tur: e.target.value })}
              className="custom-select"
            >
              {GENRE_LIST.map((genre) => (
                <option key={genre} value={genre}>
                  {genre === 'Tümü' ? '🎭 Tüm Türler' : genre}
                </option>
              ))}
            </select>
          </div>

          {/* 4) Türkiye Yayın Platformları (Multi-select) */}
          <div className="filter-section">
            <label className="filter-label">Türkiye Yayın Platformları</label>
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
            <label className="filter-label">Sıralama Algoritması</label>
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
            onClick={onApplyFilters}
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
