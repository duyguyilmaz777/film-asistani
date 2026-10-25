// Storage Service - Replaces PostgreSQL 'film_onerileri' with zero-cost browser storage

const STORAGE_KEYS = {
  SETTINGS: 'cineai_settings',
  PROFILES: 'cineai_profiles',
  ACTIVE_PROFILE: 'cineai_active_profile',
  HISTORY: 'cineai_history',
  FAVORITES: 'cineai_favorites',
  WATCHLIST: 'cineai_watchlist'
};

export const getSettings = () => {
  // Read directly from .env (configured via envPrefix in vite.config.js)
  const envTmdb = (import.meta.env.TMDB_API_KEY || import.meta.env.VITE_TMDB_API_KEY || '').trim();
  const envGemini = (import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const envOmdb = (import.meta.env.OMDB_API_KEY || import.meta.env.VITE_OMDB_API_KEY || '').trim();

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const local = raw ? JSON.parse(raw) : {};

    const tmdbApiKey = envTmdb || local.tmdbApiKey || '';
    const geminiApiKey = envGemini || local.geminiApiKey || '';
    const omdbApiKey = envOmdb || local.omdbApiKey || '';

    return {
      tmdbApiKey,
      omdbApiKey,
      geminiApiKey,
      fromEnv: {
        tmdb: Boolean(envTmdb),
        gemini: Boolean(envGemini),
        omdb: Boolean(envOmdb)
      }
    };
  } catch (e) {
    return {
      tmdbApiKey: envTmdb,
      omdbApiKey: envOmdb,
      geminiApiKey: envGemini,
      fromEnv: {
        tmdb: Boolean(envTmdb),
        gemini: Boolean(envGemini),
        omdb: Boolean(envOmdb)
      }
    };
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const getActiveProfile = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE) || 'Duygu';
  } catch (e) {
    return 'Duygu';
  }
};

export const setActiveProfile = (profileName) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, profileName.trim() || 'Misafir');
  } catch (e) {
    console.error('Error setting active profile:', e);
  }
};

// Returns user history records (equivalent to SELECT * FROM film_onerileri WHERE kullanici_adi = ...)
export const getUserHistory = (username) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const all = raw ? JSON.parse(raw) : [];
    if (!username) return all;
    return all.filter(item => (item.kullanici_adi || '').toLowerCase() === username.toLowerCase());
  } catch (e) {
    return [];
  }
};

// Saves search query and AI recommendation (equivalent to INSERT INTO film_onerileri ...)
export const saveUserQueryRecord = ({
  kullanici_adi = 'Duygu',
  filters = {},
  filmler = [],
  oneri_metni = ''
}) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const all = raw ? JSON.parse(raw) : [];
    const newRecord = {
      id: Date.now(),
      olusturma_tarihi: new Date().toISOString(),
      kullanici_adi,
      filters,
      ham_veri: { filmler },
      oneri_metni
    };
    // keep last 50 queries
    const updated = [newRecord, ...all].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return newRecord;
  } catch (e) {
    console.error('Error saving query record:', e);
    return null;
  }
};

// Equivalent to n8n GecmisTurSorgusu:
// Extracts all genre strings from past queries and favorite movies to compute user taste
export const getPastGenreFrequencies = (username) => {
  try {
    const history = getUserHistory(username);
    const favorites = getFavorites();

    const turSayaci = {};

    // 1) From past queries
    history.forEach(record => {
      const filmler = record.ham_veri?.filmler || [];
      filmler.forEach(f => {
        const genreStr = f.genre || '';
        genreStr.split(',').map(t => t.trim()).filter(Boolean).forEach(tur => {
          turSayaci[tur] = (turSayaci[tur] || 0) + 1;
        });
      });
    });

    // 2) From explicitly saved favorites (weighted 3x!)
    favorites.forEach(f => {
      const genreStr = f.genre || '';
      genreStr.split(',').map(t => t.trim()).filter(Boolean).forEach(tur => {
        turSayaci[tur] = (turSayaci[tur] || 0) + 3;
      });
    });

    return turSayaci;
  } catch (e) {
    return {};
  }
};

// Favorites
export const getFavorites = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const toggleFavorite = (movie) => {
  try {
    const current = getFavorites();
    const exists = current.some(f => f.id === movie.id);
    let updated;
    if (exists) {
      updated = current.filter(f => f.id !== movie.id);
    } else {
      updated = [movie, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    return !exists;
  } catch (e) {
    return false;
  }
};

export const isFavorite = (movieId) => {
  const current = getFavorites();
  return current.some(f => f.id === movieId);
};

// Watchlist
export const getWatchlist = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const toggleWatchlist = (movie) => {
  try {
    const current = getWatchlist();
    const exists = current.some(f => f.id === movie.id);
    let updated;
    if (exists) {
      updated = current.filter(f => f.id !== movie.id);
    } else {
      updated = [movie, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));
    return !exists;
  } catch (e) {
    return false;
  }
};

export const isWatchlist = (movieId) => {
  const current = getWatchlist();
  return current.some(f => f.id === movieId);
};
