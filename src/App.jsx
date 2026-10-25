import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Film,
  RefreshCw,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  Heart,
  HelpCircle
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { AiRecommendationModal } from './components/AiRecommendationModal';
import { SettingsModal } from './components/SettingsModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { searchAndFilterFilms } from './services/apiService';
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

export function App() {
  // User Profile
  const [activeProfile, setProfile] = useState(getActiveProfile());

  // Filter State (porting all parameters from n8n Form Trigger & LookUp)
  const [filters, setFilters] = useState({
    mediaType: 'all',
    yasGrubu: 'all',
    tur: 'Tümü',
    minPuan: 0,
    platformlar: ['Tümü'],
    tarihAraligi: 'Tümü',
    siralama: 'wr_skoru',
    searchQuery: '',
    aiIstendi: true
  });

  // Data & Results
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch films runner
  const runSearch = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    try {
      const res = await searchAndFilterFilms(currentFilters, activeProfile);
      setFilms(res.filmler || []);
      setDataSource(res.kaynak);

      // If user requested AI recommendation, trigger Gemini
      if (currentFilters.aiIstendi && (res.filmler || []).length > 0) {
        setAiLoading(true);
        generateAiRecommendation(res.filmler, currentFilters)
          .then((rec) => {
            setAiRecommendation(rec);
            // Save query record in storage (replaces n8n Postgres Insert)
            saveUserQueryRecord({
              kullanici_adi: activeProfile,
              filters: currentFilters,
              filmler: res.filmler,
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

  // Initial load
  useEffect(() => {
    runSearch(filters);
  }, []);

  // Profile Change handler
  const handleProfileChange = (newProfile) => {
    setActiveProfile(newProfile);
    setProfile(newProfile);
    // rerun search with new taste profile
    runSearch({ ...filters });
  };

  // Filter Reset
  const handleResetFilters = () => {
    const defaultFilters = {
      mediaType: 'all',
      yasGrubu: 'all',
      tur: 'Tümü',
      minPuan: 0,
      platformlar: ['Tümü'],
      tarihAraligi: 'Tümü',
      siralama: 'wr_skoru',
      searchQuery: '',
      aiIstendi: true
    };
    setFilters(defaultFilters);
    runSearch(defaultFilters);
  };

  // Search input change in navbar
  const handleSearchChange = (query) => {
    const updated = { ...filters, searchQuery: query };
    setFilters(updated);
    // Debounced or direct search
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
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          onApplyFilters={() => runSearch(filters)}
          loading={loading}
          isOpen={filtersMobileOpen}
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
              <h1 className="results-title">
                {filters.tur !== 'Tümü' ? `${filters.tur} İçerikleri` : 'Keşfet & İzle'}
              </h1>
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
            <div className="movies-grid">
              {films.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={(m) => setSelectedMovie(m)}
                  isFavorite={favorites.some((f) => f.id === movie.id)}
                  onToggleFavorite={handleToggleFav}
                  isWatchlist={watchlist.some((w) => w.id === movie.id)}
                  onToggleWatchlist={handleToggleWatch}
                />
              ))}
            </div>
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
