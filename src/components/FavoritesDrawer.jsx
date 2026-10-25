import React, { useState } from 'react';
import { X, Heart, Bookmark, Trash2, Star, Sparkles, Film } from 'lucide-react';
import { getPastGenreFrequencies } from '../services/storageService';

export const FavoritesDrawer = ({
  isOpen,
  onClose,
  favorites = [],
  watchlist = [],
  onSelectMovie,
  onToggleFavorite,
  onToggleWatchlist,
  activeProfile
}) => {
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'watchlist' | 'taste'

  if (!isOpen) return null;

  const genreFreqs = getPastGenreFrequencies(activeProfile);
  const totalGenresCount = Object.values(genreFreqs).reduce((a, b) => a + b, 0) || 1;
  const sortedGenres = Object.entries(genreFreqs).sort((a, b) => b[1] - a[1]);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-row">
            <Heart size={20} className="text-pink" />
            <h3>Kitaplığım ({activeProfile})</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="drawer-tabs">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={15} />
            <span>Favoriler ({favorites.length})</span>
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            <Bookmark size={15} />
            <span>İzleme Listem ({watchlist.length})</span>
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'taste' ? 'active' : ''}`}
            onClick={() => setActiveTab('taste')}
          >
            <Sparkles size={15} />
            <span>Zevk Profilim</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="drawer-body">
          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && (
            <div className="drawer-list">
              {favorites.length === 0 ? (
                <div className="empty-state">
                  <Heart size={40} className="text-dim" />
                  <p>Henüz favorilere film eklemediniz.</p>
                  <span className="empty-sub">Film kartlarındaki kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.</span>
                </div>
              ) : (
                favorites.map((m) => (
                  <div
                    key={m.id}
                    className="drawer-item"
                    onClick={() => {
                      onSelectMovie(m);
                      onClose();
                    }}
                  >
                    <img src={m.poster} alt={m.title} className="drawer-item-img" />
                    <div className="drawer-item-info">
                      <div className="drawer-item-title">{m.title_tr || m.title}</div>
                      <div className="drawer-item-meta">
                        <span>{m.year}</span>
                        <span>·</span>
                        <span className="rating-tag">⭐ {m.imdb_puani}</span>
                      </div>
                      <div className="drawer-item-genres">{m.genre}</div>
                    </div>
                    <button
                      className="drawer-item-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(m);
                      }}
                      title="Favorilerden çıkar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* WATCHLIST TAB */}
          {activeTab === 'watchlist' && (
            <div className="drawer-list">
              {watchlist.length === 0 ? (
                <div className="empty-state">
                  <Bookmark size={40} className="text-dim" />
                  <p>İzleme listeniz şu an boş.</p>
                  <span className="empty-sub">Daha sonra izlemek istediğiniz filmleri yer işareti ikonuyla kaydedebilirsiniz.</span>
                </div>
              ) : (
                watchlist.map((m) => (
                  <div
                    key={m.id}
                    className="drawer-item"
                    onClick={() => {
                      onSelectMovie(m);
                      onClose();
                    }}
                  >
                    <img src={m.poster} alt={m.title} className="drawer-item-img" />
                    <div className="drawer-item-info">
                      <div className="drawer-item-title">{m.title_tr || m.title}</div>
                      <div className="drawer-item-meta">
                        <span>{m.year}</span>
                        <span>·</span>
                        <span className="rating-tag">⭐ {m.imdb_puani}</span>
                      </div>
                      <div className="drawer-item-genres">{m.genre}</div>
                    </div>
                    <button
                      className="drawer-item-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(m);
                      }}
                      title="Listeden çıkar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TASTE PROFILE TAB */}
          {activeTab === 'taste' && (
            <div className="taste-profile-section">
              <div className="taste-info-card">
                <Sparkles size={20} className="text-ai" />
                <div>
                  <h4>Kişisel Zevk & Benzerlik Analizi</h4>
                  <p>
                    Aramalarınız ve beğendiğiniz filmler incelenerek Jaccard benzerlik skorunuz bu tür ağırlıklarına göre hesaplanır.
                  </p>
                </div>
              </div>

              <div className="genre-breakdown-list">
                {sortedGenres.length === 0 ? (
                  <div className="empty-state">
                    <Film size={36} className="text-dim" />
                    <p>Henüz yeterli arama ve beğeni geçmişi oluşmadı.</p>
                    <span className="empty-sub">Birkaç arama yaptıkça ve film beğendikçe zevk haritanız burada otomatik şekillenecektir.</span>
                  </div>
                ) : (
                  sortedGenres.map(([genre, count], idx) => {
                    const percentage = Math.round((count / totalGenresCount) * 100);
                    return (
                      <div key={genre} className="genre-stat-row">
                        <div className="genre-stat-header">
                          <span className="genre-name">
                            {idx < 3 ? '🏆 ' : ''}{genre}
                          </span>
                          <span className="genre-percentage">%{percentage} ilgi</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              background: idx === 0
                                ? 'linear-gradient(90deg, #6366f1, #06b6d4)'
                                : idx === 1
                                ? 'linear-gradient(90deg, #ec4899, #f59e0b)'
                                : 'linear-gradient(90deg, #10b981, #06b6d4)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
