import React, { useEffect } from 'react';
import {
  X,
  Star,
  Shield,
  Heart,
  Bookmark,
  ExternalLink,
  Play,
  Tv,
  Film,
  Sparkles,
  Info
} from 'lucide-react';
import { PLATFORM_CONFIG } from '../constants/options';

export const MovieDetailModal = ({
  movie,
  onClose,
  isFavorite,
  onToggleFavorite,
  isWatchlist,
  onToggleWatchlist
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!movie) return null;

  const platforms = (movie.platformlar || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} title="Kapat">
          <X size={20} />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="modal-hero">
          {movie.backdrop ? (
            <img
              src={movie.backdrop}
              alt={movie.title_tr || movie.title}
              className="modal-backdrop-img"
            />
          ) : (
            <div className="modal-backdrop-placeholder" />
          )}
          <div className="modal-hero-gradient" />

          {/* Floating Actions on Hero */}
          <div className="modal-hero-actions">
            {movie.trailer_url && (
              <a
                href={movie.trailer_url}
                target="_blank"
                rel="noreferrer"
                className="hero-btn trailer-btn"
              >
                <Play size={16} fill="#fff" />
                <span>Fragmanı İzle</span>
              </a>
            )}

            {movie.imdb_link && (
              <a
                href={movie.imdb_link}
                target="_blank"
                rel="noreferrer"
                className="hero-btn imdb-btn"
              >
                <ExternalLink size={16} />
                <span>IMDb Sayfası</span>
              </a>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="modal-main-info">
            {/* Title & Year */}
            <div className="modal-title-row">
              <h2 className="modal-title">{movie.title_tr || movie.title}</h2>
              {movie.title_tr && movie.title !== movie.title_tr && (
                <div className="modal-original-title">Orijinal İsim: {movie.title}</div>
              )}
            </div>

            {/* Badges Bar */}
            <div className="modal-badges-bar">
              <span className="badge badge-media-type">
                {movie.mediaType === 'tv' ? <Tv size={13} /> : <Film size={13} />}
                <span>{movie.mediaType === 'tv' ? 'Dizi' : 'Film'} · {movie.year}</span>
              </span>

              {movie.rated && (
                <span className="badge badge-age">
                  <Shield size={12} />
                  <span>{movie.rated} Yaş Sınırı</span>
                </span>
              )}

              {movie.matchPercentage > 0 && (
                <span className="badge badge-ai-glow">
                  <Sparkles size={12} className="text-ai" />
                  <span>%{movie.matchPercentage} Zevk Uyumu</span>
                </span>
              )}
            </div>

            {/* Scores Overview */}
            <div className="modal-scores-card">
              <div className="score-block">
                <div className="score-label">IMDb Puanı</div>
                <div className="score-value-row">
                  <Star size={20} fill="#f59e0b" color="#f59e0b" />
                  <span className="big-score">{movie.imdb_puani || 'N/A'}</span>
                  <span className="score-denominator">/ 10</span>
                </div>
                {movie.imdbVotes && (
                  <div className="score-subtext">{movie.imdbVotes} seyirci oyu</div>
                )}
              </div>

              {movie.wr_skoru && (
                <div className="score-block">
                  <div className="score-label">Bayes Güvenilirlik Skoru</div>
                  <div className="score-value-row">
                    <span className="big-score text-cyan">{movie.wr_skoru}</span>
                    <span className="score-denominator">/ 10</span>
                  </div>
                  <div className="score-subtext">Oy sayısı ağırlıklı gerçekçi puan</div>
                </div>
              )}

              {movie.final_skor && (
                <div className="score-block">
                  <div className="score-label">Kişisel Nihai Skor</div>
                  <div className="score-value-row">
                    <span className="big-score text-pink">{movie.final_skor}</span>
                    <span className="score-denominator">/ 1.0</span>
                  </div>
                  <div className="score-subtext">Güvenilirlik (%70) + Zevk (%30)</div>
                </div>
              )}
            </div>

            {/* Synopsis / Konu */}
            <div className="modal-synopsis-section">
              <h4 className="section-heading">İçerik Özeti</h4>
              <p className="synopsis-text">
                {movie.overview || 'Bu içerik için henüz Türkçe açıklama eklenmedi.'}
              </p>
            </div>

            {/* Türler */}
            <div className="modal-genres-section">
              <h4 className="section-heading">Türler</h4>
              <div className="genre-pills">
                {(movie.genre || '').split(',').map((g, i) => (
                  <span key={i} className="genre-pill">
                    {g.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Streaming Availability in Turkey */}
            <div className="modal-providers-section">
              <h4 className="section-heading">Türkiye'de Nereden İzlenir?</h4>
              {platforms.length > 0 ? (
                <div className="providers-list">
                  {platforms.map((p, i) => {
                    const conf = PLATFORM_CONFIG[p];
                    return (
                      <div
                        key={i}
                        className="provider-card"
                        style={{
                          backgroundColor: conf?.bg || 'rgba(255, 255, 255, 0.05)',
                          borderColor: conf?.border || 'rgba(255, 255, 255, 0.15)'
                        }}
                      >
                        <span className="provider-name" style={{ color: conf?.color || '#fff' }}>
                          {conf?.badgeName || p}
                        </span>
                        <span className="provider-type">Abonelik ile İzle</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="provider-empty-note">
                  Bu içerik şu an Türkiye'de doğrudan abonelik servislerinde listelenmiyor (kiralama/satın alma servislerinde bulunabilir).
                </div>
              )}

              {movie.kiralik && (
                <div className="sub-provider-note">
                  <strong>Kiralık:</strong> {movie.kiralik}
                </div>
              )}
              {movie.satilik && (
                <div className="sub-provider-note">
                  <strong>Satın Al:</strong> {movie.satilik}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="modal-bottom-actions">
              <button
                type="button"
                className={`modal-action-btn ${isFavorite ? 'fav-active' : ''}`}
                onClick={() => onToggleFavorite(movie)}
              >
                <Heart size={18} fill={isFavorite ? '#ec4899' : 'none'} />
                <span>{isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}</span>
              </button>

              <button
                type="button"
                className={`modal-action-btn ${isWatchlist ? 'watch-active' : ''}`}
                onClick={() => onToggleWatchlist(movie)}
              >
                <Bookmark size={18} fill={isWatchlist ? '#6366f1' : 'none'} />
                <span>{isWatchlist ? 'İzleme Listesinden Çıkar' : 'Daha Sonra İzle'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
