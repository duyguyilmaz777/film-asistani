import React from 'react';
import {
  Star,
  Shield,
  Heart,
  Bookmark,
  Tv,
  Film,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  PLATFORM_CONFIG,
  getAgeRatingInfo,
  formatReleaseDate
} from '../constants/options';

export const MovieCard = ({
  movie,
  onSelect,
  isFavorite,
  onToggleFavorite,
  isWatchlist,
  onToggleWatchlist
}) => {
  const ageInfo = getAgeRatingInfo(movie.rated);
  const formattedDate = formatReleaseDate(movie.releaseDate, movie.year);

  // Extract platforms
  const platforms = (movie.platformlar || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="movie-card glass-panel" onClick={() => onSelect(movie)}>
      {/* Poster Image Container */}
      <div className="poster-wrapper">
        <img
          src={movie.poster}
          alt={movie.title_tr || movie.title}
          className="poster-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/500x750/111827/white?text=Afiş+Yok';
          }}
        />

        {/* Gradient Overlay */}
        <div className="poster-gradient" />

        {/* Top Badges */}
        <div className="card-top-badges">
          {/* Media Type & Release Date */}
          <span className="badge badge-media-type" title={`Gösterim / Çıkış Tarihi: ${formattedDate}`}>
            {movie.mediaType === 'tv' ? <Tv size={12} /> : <Film size={12} />}
            <span>{formattedDate}</span>
          </span>

          {/* Friendly Age Rating Badge */}
          <span
            className="badge badge-age"
            style={{
              borderColor: ageInfo.color,
              color: ageInfo.color
            }}
            title={ageInfo.longLabel}
          >
            <Shield size={11} />
            <span>{ageInfo.shortLabel}</span>
          </span>
        </div>

        {/* Action Buttons overlay */}
        <div className="card-overlay-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`card-action-btn ${isFavorite ? 'active-fav' : ''}`}
            onClick={() => onToggleFavorite(movie)}
            title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart size={16} fill={isFavorite ? '#ec4899' : 'none'} color={isFavorite ? '#ec4899' : '#fff'} />
          </button>

          <button
            type="button"
            className={`card-action-btn ${isWatchlist ? 'active-watch' : ''}`}
            onClick={() => onToggleWatchlist(movie)}
            title={isWatchlist ? 'İzleme listesinden çıkar' : 'Sonra izlemek için kaydet'}
          >
            <Bookmark size={16} fill={isWatchlist ? '#6366f1' : 'none'} color={isWatchlist ? '#6366f1' : '#fff'} />
          </button>
        </div>

        {/* Taste Match Banner (Jaccard Score) */}
        {movie.matchPercentage > 0 && (
          <div className="taste-match-pill" title="Geçmiş aramalarınız ve beğendiğiniz türlerle örtüşme oranı">
            <Sparkles size={11} className="text-ai" />
            <span>%{movie.matchPercentage} Zevk Uyumu</span>
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="movie-card-content">
        <h3 className="movie-title" title={movie.title_tr || movie.title}>
          {movie.title_tr || movie.title}
        </h3>

        {/* Genre Tags */}
        <div className="movie-genres">
          {(movie.genre || '').split(',').slice(0, 2).map((g, i) => (
            <span key={i} className="genre-tag">
              {g.trim()}
            </span>
          ))}
        </div>

        {/* Ratings row */}
        <div className="ratings-row">
          <div className="rating-item" title="IMDb Puanı ve Toplam Oy Sayısı">
            <Star size={14} className="star-icon" fill="#f59e0b" color="#f59e0b" />
            <span className="rating-value">{movie.imdb_puani || 'N/A'}</span>
            {movie.imdbVotes && (
              <span className="votes-count">({movie.imdbVotes})</span>
            )}
          </div>

          {movie.wr_skoru && (
            <div
              className="bayes-badge"
              title="Gerçekçi Güvenilirlik Puanı: Sadece puana değil, kaç kişinin oy verdiğine de bakarak hesaplanan yanılmaz başarı puanı (Az oylu yanıltıcı yüksek puanları eler)."
            >
              <ShieldCheck size={12} className="text-cyan" />
              <span>Güvenilir:</span>
              <strong>{movie.wr_skoru}</strong>
            </div>
          )}
        </div>

        {/* Streaming Providers in TR */}
        <div className="platforms-row">
          {platforms.length > 0 ? (
            platforms.slice(0, 3).map((p, idx) => {
              const conf = PLATFORM_CONFIG[p];
              return (
                <span
                  key={idx}
                  className="provider-badge"
                  style={{
                    backgroundColor: conf?.bg || 'rgba(255, 255, 255, 0.1)',
                    borderColor: conf?.border || 'rgba(255, 255, 255, 0.2)',
                    color: conf?.color || '#fff'
                  }}
                >
                  {conf?.badgeName || p}
                </span>
              );
            })
          ) : (
            <span className="provider-none">Platform bilgisi aranıyor</span>
          )}
          {platforms.length > 3 && (
            <span className="provider-more">+{platforms.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
};
