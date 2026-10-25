import React, { useState } from 'react';
import { Sparkles, Heart, Settings, Film, User, Search, SlidersHorizontal } from 'lucide-react';

export const Navbar = ({
  activeProfile,
  onProfileChange,
  favoriteCount,
  onOpenFavorites,
  onOpenSettings,
  onOpenAiRecommendation,
  hasAiRecommendation,
  searchQuery,
  onSearchChange,
  onToggleFilters,
  filtersOpen
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileInput, setProfileInput] = useState(activeProfile);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (profileInput.trim()) {
      onProfileChange(profileInput.trim());
      setEditingProfile(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <div className="navbar-brand">
          <div className="brand-logo-wrapper">
            <img src="/logo.jpg" alt="CineAI Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Cine<span>AI</span>
            </div>
            <div className="brand-subtitle">Film & Dizi Tavsiye Asistanı</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Film, dizi veya anahtar kelime ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Temizle"
            >
              ×
            </button>
          )}
        </div>

        {/* User Profile & Actions */}
        <div className="navbar-actions">
          {/* Profile Switcher */}
          <div className="profile-pill-wrapper">
            {editingProfile ? (
              <form onSubmit={handleProfileSubmit} className="profile-edit-form">
                <input
                  type="text"
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  className="profile-input"
                  placeholder="Rumuz..."
                  autoFocus
                  onBlur={handleProfileSubmit}
                />
              </form>
            ) : (
              <button
                className="profile-pill"
                onClick={() => setEditingProfile(true)}
                title="Kullanıcı profilini değiştir"
              >
                <User size={15} className="profile-icon" />
                <span className="profile-name">{activeProfile}</span>
              </button>
            )}
          </div>

          {/* AI Recommendation Button */}
          <button
            className={`action-btn ai-action-btn ${hasAiRecommendation ? 'active-glow' : ''}`}
            onClick={onOpenAiRecommendation}
            title="Yapay Zeka Tavsiye Raporu"
          >
            <Sparkles size={17} className="ai-icon" />
            <span className="btn-label">AI Raporu</span>
          </button>

          {/* Favorites Button */}
          <button
            className="action-btn favorites-btn"
            onClick={onOpenFavorites}
            title="Favorilerim ve İzleme Listesi"
          >
            <Heart size={18} />
            {favoriteCount > 0 && <span className="action-badge">{favoriteCount}</span>}
          </button>

          {/* Settings Button */}
          <button
            className="action-btn settings-btn"
            onClick={onOpenSettings}
            title="Ayarlar & API Anahtarları"
          >
            <Settings size={18} />
          </button>

          {/* Filter Toggle (for mobile) */}
          <button
            className={`action-btn filter-toggle-btn ${filtersOpen ? 'active' : ''}`}
            onClick={onToggleFilters}
            title="Filtreleri Göster / Gizle"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
