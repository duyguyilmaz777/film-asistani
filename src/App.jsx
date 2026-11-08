import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Film,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { AiRecommendationModal } from './components/AiRecommendationModal';
import { SettingsModal } from './components/SettingsModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { searchAndFilterFilms, sortFilms } from './services/apiService';
import { generateAiRecommendation } from './services/geminiService';
import {
  getActiveProfile,
  setActiveProfile,
  getFavorites,
  toggleFavorite,
  getWatchlist,
  toggleWatchlist,
  saveUserQueryRecord
} from './services/storageService';

const DEFAULT_FILTERS = {
  mediaType: 'all',
  yasGrubu: ['all'],
  tur: ['Tümü'],
  minPuan: 0,
  platformlar: ['Tümü'],
  tarihAraligi: 'Tümü',
  siralama: 'En Eski',
  searchQuery: '',
  aiIstendi: true
};

export function App() {
  // User Profile
  const [activeProfile, setProfile] = useState(getActiveProfile());

  // Filter State
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Data & Results + Pagination State
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [dataSource, setDataSource] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  // AI Recommendation State
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Modals & Drawers
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [filtersMobileOpen, setFiltersMobileOpen] = useState(false);

  // Favorites & Watchlist Lists
  const [favorites, setFavoritesList] = useState(getFavorites());
  const [watchlist, setWatchlistList] = useState(getWatchlist());

  // Sentinel ref for Infinite Scroll (Lazy Loading)
  const loadMoreRef = useRef(null);

  // Fetch initial page (page 1)
  const runSearch = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const res = await searchAndFilterFilms({ ...currentFilters, sayfa: 1 }, activeProfile);
      const initialFilms = res.filmler || [];
      setFilms(initialFilms);
      setDataSource(res.kaynak);
      setPage(res.lastFetchedPage || 1);
      setHasMore(Boolean(res.hasMore));

      // If user requested AI recommendation, trigger Gemini
      if (currentFilters.aiIstendi && initialFilms.length > 0) {
        setAiLoading(true);
        generateAiRecommendation(initialFilms, currentFilters)
          .then((rec) => {
            setAiRecommendation(rec);
            saveUserQueryRecord({
              kullanici_adi: activeProfile,
              filters: currentFilters,
              filmler: initialFilms,
              oneri_metni: rec
            });
          })
          .catch((err) => console.error('AI generation error:', err))
          .finally(() => setAiLoading(false));
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, activeProfile]);

  // Load next page for Infinite Scroll / Lazy Loading
  const loadMoreFilms = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await searchAndFilterFilms({ ...filters, sayfa: nextPage }, activeProfile);
      const fetched = res.filmler || [];

      setFilms((prevFilms) => {
        const existingKeys = new Set(prevFilms.map((f) => `${f.mediaType || 'movie'}-${f.id}`));
        const uniqueNew = fetched.filter((f) => !existingKeys.has(`${f.mediaType || 'movie'}-${f.id}`));
        const combined = [...prevFilms, ...uniqueNew];
        return sortFilms(combined, filters.siralama);
      });

      setPage(res.lastFetchedPage || nextPage);
      setHasMore(Boolean(res.hasMore));
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, filters, activeProfile]);

  // Initial load
  useEffect(() => {
    runSearch(filters);
  }, []);

  // IntersectionObserver for automatic lazy loading as user scrolls down
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading && !loadingMore && hasMore && films.length > 0) {
          loadMoreFilms();
        }
      },
      { root: null, rootMargin: '320px', threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMoreFilms, loading, loadingMore, hasMore, films.length]);

  // Profile Change handler
  const handleProfileChange = (newProfile) => {
    setActiveProfile(newProfile);
    setProfile(newProfile);
    runSearch({ ...filters });
  };

  // Filter change handler (instant re-sort if sorting option changed)
  const handleFilterChange = (updatedFilters) => {
    if (updatedFilters.siralama !== filters.siralama) {
      setFilms((prev) => sortFilms(prev, updatedFilters.siralama));
    }
    setFilters(updatedFilters);
  };

  // Filter Reset
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    runSearch(DEFAULT_FILTERS);
  };

  // Search input change in navbar
  const handleSearchChange = (query) => {
    const updated = { ...filters, searchQuery: query };
    setFilters(updated);
    runSearch(updated);
  };

  // Toggle Favorite
  const handleToggleFav = (movie) => {
    toggleFavorite(movie);
    setFavoritesList(getFavorites());
  };

  // Toggle Watchlist
  const handleToggleWatch = (movie) => {
    toggleWatchlist(movie);
    setWatchlistList(getWatchlist());
  };

  // Format header title for multi-select genres
  const getHeaderTitle = () => {
    const turler = Array.isArray(filters.tur) ? filters.tur : [filters.tur || 'Tümü'];
    const activeGenres = turler.filter((t) => t && t !== 'Tümü');
    if (activeGenres.length === 0) return 'Keşfet & İzle';
    return `${activeGenres.join(', ')} İçerikleri`;
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeProfile={activeProfile}
        onProfileChange={handleProfileChange}
        favoriteCount={favorites.length + watchlist.length}
        onOpenFavorites={() => setFavoritesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAiRecommendation={() => setAiModalOpen(true)}
        hasAiRecommendation={Boolean(aiRecommendation)}
        searchQuery={filters.searchQuery}
        onSearchChange={handleSearchChange}
        onToggleFilters={() => setFiltersMobileOpen(!filtersMobileOpen)}
        filtersOpen={filtersMobileOpen}
      />

      {/* Main Layout: Sidebar Filters + Film Grid */}
      <main className="main-content">
        {/* Left Filter Sidebar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onApplyFilters={() => runSearch(filters)}
          loading={loading}
          isOpen={filtersMobileOpen}
          onClose={() => setFiltersMobileOpen(false)}
        />

        {/* Right Content Area */}
        <section className="results-section">
          {/* AI Recommendation Banner (if generated) */}
          {aiRecommendation && (
            <div className="ai-banner-card glass-panel" onClick={() => setAiModalOpen(true)}>
              <div className="ai-banner-icon-col">
                <div className="ai-banner-pulse">
                  <Sparkles size={22} className="text-ai" />
                </div>
              </div>
              <div className="ai-banner-text-col">
                <div className="ai-banner-title">
                  <span>Gemini AI Bu Akşam İçin Seçti</span>
                  <span className="ai-badge-pill">Özel Analiz Hazır</span>
                </div>
                <p className="ai-banner-snippet">
                  Filtrelerinize ve {activeProfile} profili tercihlerine göre en uygun 2-3 yapım karşılaştırıldı. İncelemek için tıklayın.
                </p>
              </div>
              <button className="ai-banner-view-btn" onClick={() => setAiModalOpen(true)}>
                <span>Raporu Oku</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Results Header */}
          <div className="results-header">
            <div className="results-header-left">
              <h1 className="results-title">{getHeaderTitle()}</h1>
              <div className="results-count-badge">
                {loading ? 'Yükleniyor...' : `${films.length} içerik listelendi`}
              </div>
            </div>

            <div className="results-header-right">
              <span className="data-source-pill" title="Veri kaynağı">
                📡 {dataSource}
              </span>
            </div>
          </div>

          {/* Film Grid */}
          {loading ? (
            <div className="movies-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="movie-card shimmer-loading" style={{ height: '380px' }} />
              ))}
            </div>
          ) : films.length === 0 ? (
            <div className="no-results-panel glass-panel">
              <Film size={48} className="text-dim" />
              <h3>Bu Kriterlere Uygun İçerik Bulunamadı</h3>
              <p>Filtrelerinizi biraz gevşetmeyi veya farklı bir tür/yaş grubu seçmeyi deneyebilirsiniz.</p>
              <button className="reset-btn-large" onClick={handleResetFilters}>
                Filtreleri Sıfırla
              </button>
            </div>
          ) : (
            <>
              <div className="movies-grid">
                {films.map((movie) => (
                  <MovieCard
                    key={`${movie.mediaType || 'movie'}-${movie.id}`}
                    movie={movie}
                    onSelect={(m) => setSelectedMovie(m)}
                    isFavorite={favorites.some((f) => f.id === movie.id)}
                    onToggleFavorite={handleToggleFav}
                    isWatchlist={watchlist.some((w) => w.id === movie.id)}
                    onToggleWatchlist={handleToggleWatch}
                  />
                ))}

                {/* Shimmer placeholders when lazy-loading next page */}
                {loadingMore &&
                  [...Array(4)].map((_, i) => (
                    <div
                      key={`skeleton-more-${i}`}
                      className="movie-card shimmer-loading"
                      style={{ height: '380px' }}
                    />
                  ))}
              </div>

              {/* Infinite Scroll Trigger & Load More Controls */}
              <div ref={loadMoreRef} className="lazy-load-footer">
                {loadingMore ? (
                  <div className="lazy-loading-status">
                    <RefreshCw size={18} className="spin-icon text-accent" />
                    <span>Daha fazla içerik yükleniyor...</span>
                  </div>
                ) : hasMore ? (
                  <button
                    type="button"
                    className="load-more-btn"
                    onClick={loadMoreFilms}
                  >
                    <RefreshCw size={16} />
                    <span>Daha Fazla İçerik Yükle (Sayfa {page + 1})</span>
                  </button>
                ) : (
                  <div className="end-of-results-note">
                    Seçtiğiniz kriterlere uygun tüm içerikler listelendi ({films.length} yapım).
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Modals & Drawers */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          isFavorite={favorites.some((f) => f.id === selectedMovie.id)}
          onToggleFavorite={handleToggleFav}
          isWatchlist={watchlist.some((w) => w.id === selectedMovie.id)}
          onToggleWatchlist={handleToggleWatch}
        />
      )}

      {aiModalOpen && (
        <AiRecommendationModal
          recommendationText={aiRecommendation}
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          activeProfile={activeProfile}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSettingsUpdated={() => runSearch(filters)}
        />
      )}

      {favoritesOpen && (
        <FavoritesDrawer
          isOpen={favoritesOpen}
          onClose={() => setFavoritesOpen(false)}
          favorites={favorites}
          watchlist={watchlist}
          onSelectMovie={(m) => setSelectedMovie(m)}
          onToggleFavorite={handleToggleFav}
          onToggleWatchlist={handleToggleWatch}
          activeProfile={activeProfile}
        />
      )}
    </div>
  );
}

export default App;
