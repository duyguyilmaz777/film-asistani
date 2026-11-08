// API Service: Direct Live TMDB & OMDb Integration with Bayesian & Jaccard Scoring
import {
  DATE_RANGE_MAP,
  GENRE_MAP,
  IZINLI_DERECELER_MAP,
  PLATFORM_CONFIG
} from '../constants/options';
import {
  calculateBayesianScores,
  calculateTasteSimilarityAndFinalScores
} from './scoringService';
import { getPastGenreFrequencies, getSettings } from './storageService';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

/**
 * Helper to extract comparable timestamp from releaseDate or year
 * Items without a valid date are placed at the end when sorting oldest-first.
 */
export const getReleaseTimestamp = (film, fallbackForEmpty = Number.MAX_SAFE_INTEGER) => {
  if (film.releaseDate) {
    const parsed = Date.parse(film.releaseDate);
    if (!isNaN(parsed)) return parsed;
  }
  const y = parseInt(film.year, 10);
  if (!isNaN(y) && y > 0) {
    return Date.parse(`${y}-01-01`);
  }
  return fallbackForEmpty;
};

/**
 * Sorts films list according to selected criteria.
 * Default is 'En Eski' (oldest release date first).
 */
export const sortFilms = (films, siralama = 'En Eski') => {
  const copy = [...(films || [])];
  copy.sort((a, b) => {
    if (siralama === 'En Eski') {
      return getReleaseTimestamp(a, Number.MAX_SAFE_INTEGER) - getReleaseTimestamp(b, Number.MAX_SAFE_INTEGER);
    }
    if (siralama === 'En Yeni') {
      return getReleaseTimestamp(b, 0) - getReleaseTimestamp(a, 0);
    }
    if (siralama === 'wr_skoru') {
      const diff = (b.wr_skoru || 0) - (a.wr_skoru || 0);
      if (diff !== 0) return diff;
      return getReleaseTimestamp(a) - getReleaseTimestamp(b);
    }
    if (siralama === 'final_skor') {
      return (b.final_skor || 0) - (a.final_skor || 0);
    }
    if (siralama === 'En Yüksek Puan') {
      const diff = parseFloat(b.imdb_puani || 0) - parseFloat(a.imdb_puani || 0);
      if (diff !== 0) return diff;
      return getReleaseTimestamp(a) - getReleaseTimestamp(b);
    }
    if (siralama === 'En Popüler') {
      return (b.popularity || 0) - (a.popularity || 0);
    }
    // Default fallback: oldest release date first
    return getReleaseTimestamp(a, Number.MAX_SAFE_INTEGER) - getReleaseTimestamp(b, Number.MAX_SAFE_INTEGER);
  });
  return copy;
};

/**
 * Main search & filter runner matching n8n workflow steps:
 * LookUp -> TMDB Discover/Search -> Details & TR Providers -> OMDB -> Age Rating Filter -> Bayes (TekeDusur) -> Jaccard Taste Similarity
 */
export const searchAndFilterFilms = async (filters, username = 'Duygu') => {
  const settings = getSettings();
  const apiKey = (settings.tmdbApiKey || '').trim();

  if (!apiKey) {
    throw new Error('TMDB API anahtarı bulunamadı. Lütfen .env dosyasına TMDB_API_KEY değerini ekleyin.');
  }

  let currentPage = filters.sayfa || 1;
  let rawFilms = [];
  let hasMore = false;
  let attempts = 0;

  // Fetch live TMDB & OMDb results (if age filter eliminates all items on a page, automatically advance up to 2 pages)
  while (attempts < 2) {
    const fetchResult = await fetchLiveTmdbFilms({ ...filters, sayfa: currentPage }, settings);
    rawFilms = [...rawFilms, ...fetchResult.items];
    hasMore = fetchResult.hasMore;
    attempts += 1;

    if (rawFilms.length >= 6 || !hasMore) {
      break;
    }
    currentPage += 1;
  }

  // 2) Bayesian Weighted Rating calculation (matches n8n 'TekeDusur' - mathematical formula unchanged)
  const withBayes = calculateBayesianScores(rawFilms, 1000);

  // 3) User Genre Frequency & Jaccard Taste Matching (matches n8n 'Benzerlik Skoru' & 'GecmisTurSorgusu')
  const genreFreqs = getPastGenreFrequencies(username);
  const scoredFilms = calculateTasteSimilarityAndFinalScores(withBayes, genreFreqs);

  // 4) Sort films (default: oldest release date first)
  const siralama = filters.siralama || 'En Eski';
  const sortedFilms = sortFilms(scoredFilms, siralama);

  return {
    filmler: sortedFilms,
    toplamSonuc: sortedFilms.length,
    hasMore,
    lastFetchedPage: currentPage,
    kaynak: 'TMDB & OMDb Canlı Bağlantı'
  };
};

/**
 * Resolves allowed MPAA/TV ratings from single or multi-select yasGrubu filter
 */
function getAllowedRatingsForFilter(yasGrubuFilter) {
  const groups = Array.isArray(yasGrubuFilter)
    ? yasGrubuFilter
    : yasGrubuFilter
    ? [yasGrubuFilter]
    : ['all'];

  if (groups.length === 0 || groups.includes('all') || groups.includes('18+')) {
    return null; // No restriction (all ratings allowed)
  }

  const allowedSet = new Set();
  groups.forEach((g) => {
    const list = IZINLI_DERECELER_MAP[g] || [];
    list.forEach((r) => allowedSet.add(r));
  });

  return allowedSet.size > 0 ? allowedSet : null;
}

/**
 * Resolves TMDB genre IDs string (joined with '|' for OR multi-select)
 */
function getGenreQueryParam(turFilter) {
  const genres = Array.isArray(turFilter)
    ? turFilter
    : turFilter
    ? [turFilter]
    : ['Tümü'];

  if (genres.includes('Tümü') || genres.length === 0) {
    return '';
  }

  const ids = genres
    .map((g) => GENRE_MAP[g])
    .filter(Boolean);

  return ids.join('|');
}

/**
 * Live TMDB Fetcher (replicates n8n HTTP Request1, watch/providers TR, and OMDb nodes)
 */
async function fetchLiveTmdbFilms(filters, settings) {
  const apiKey = settings.tmdbApiKey.trim();
  const mediaTypesToFetch = filters.mediaType === 'all' ? ['movie', 'tv'] : [filters.mediaType];
  const page = filters.sayfa || 1;

  const allItems = [];
  let anyTypeHasMore = false;

  for (const mediaType of mediaTypesToFetch) {
    let endpoint = '';
    const params = new URLSearchParams({
      api_key: apiKey,
      language: 'tr-TR'
    });

    if (filters.searchQuery && filters.searchQuery.trim()) {
      endpoint = `${TMDB_BASE_URL}/search/${mediaType}`;
      params.append('query', filters.searchQuery.trim());
      params.append('page', String(page));
    } else {
      endpoint = `${TMDB_BASE_URL}/discover/${mediaType}`;
      params.append('page', String(page));

      const dateField = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
      const bugun = new Date().toISOString().split('T')[0];
      params.append(`${dateField}.lte`, bugun);

      if (filters.siralama === 'En Yeni') {
        params.append('sort_by', `${dateField}.desc`);
        params.append('vote_count.gte', '10');
      } else if (filters.siralama === 'En Yüksek Puan') {
        params.append('sort_by', 'vote_average.desc');
        params.append('vote_count.gte', '150');
      } else {
        params.append('sort_by', 'popularity.desc');
        params.append('vote_count.gte', '20');
      }

      // Multi-select Genre filter
      const genreParam = getGenreQueryParam(filters.tur);
      if (genreParam) {
        params.append('with_genres', genreParam);
      }

      // Date range
      if (filters.tarihAraligi && DATE_RANGE_MAP[filters.tarihAraligi]) {
        const days = DATE_RANGE_MAP[filters.tarihAraligi];
        const d = new Date();
        d.setDate(d.getDate() - days);
        params.append(`${dateField}.gte`, d.toISOString().split('T')[0]);
      }

      // Min rating
      if (filters.minPuan) {
        params.append('vote_average.gte', String(Math.max(filters.minPuan - 0.5, 0)));
      }

      // Watch providers in Turkey
      const selectedPlatforms = filters.platformlar || [];
      const tumuSecildi = selectedPlatforms.includes('Tümü') || selectedPlatforms.length === 0;
      const providerIds = selectedPlatforms
        .map(p => PLATFORM_CONFIG[p]?.id)
        .filter(Boolean);

      params.append('watch_region', 'TR');
      if (tumuSecildi) {
        params.append('with_watch_monetization_types', 'flatrate|free|ads|rent|buy');
      } else if (providerIds.length > 0) {
        params.append('with_watch_providers', providerIds.join('|'));
        params.append('with_watch_monetization_types', 'flatrate');
      }
    }

    try {
      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map(r => ({ ...r, _detectedType: mediaType }));
        allItems.push(...results);
        if (data.page && data.total_pages && data.page < data.total_pages) {
          anyTypeHasMore = true;
        }
      }
    } catch (e) {
      console.error(`Error querying TMDB for ${mediaType}:`, e);
    }
  }

  const allowedRatingsSet = getAllowedRatingsForFilter(filters.yasGrubu);

  // Fetch full details and providers for candidates on this page
  const detailedPromises = allItems.slice(0, 20).map(async item => {
    const mediaType = item._detectedType || (item.title ? 'movie' : 'tv');
    try {
      const dRes = await fetch(
        `${TMDB_BASE_URL}/${mediaType}/${item.id}?api_key=${apiKey}&append_to_response=external_ids,watch/providers,videos&language=tr-TR`
      );
      if (!dRes.ok) return null;
      const d = await dRes.json();

      const trProv = d['watch/providers']?.results?.TR || {};
      const flatrate = trProv.flatrate || [];
      const free = [...(trProv.free || []), ...(trProv.ads || [])];
      const rent = trProv.rent || [];
      const buy = trProv.buy || [];

      const providerNames = flatrate.map(p => p.provider_name);
      const title = d.title || d.name || item.title || item.name;
      const releaseDate = d.release_date || d.first_air_date || item.release_date || item.first_air_date || '';
      const year = releaseDate ? releaseDate.split('-')[0] : '';
      const imdbId = d.external_ids?.imdb_id;

      // OMDb fetch for accurate ratings and age certification
      let imdbRating = String(d.vote_average ? Number(d.vote_average).toFixed(1) : '0');
      let imdbVotes = String(d.vote_count || '0');
      let rated = 'PG-13'; // default fallback
      let genreNames = (d.genres || []).map(g => g.name).join(', ');

      const omdbKey = (settings.omdbApiKey || '').trim();
      if (omdbKey && imdbId) {
        try {
          const omdbRes = await fetch(`${OMDB_BASE_URL}/?apikey=${omdbKey}&i=${imdbId}`);
          if (omdbRes.ok) {
            const omdb = await omdbRes.json();
            if (omdb.Response !== 'False') {
              if (omdb.imdbRating && omdb.imdbRating !== 'N/A') imdbRating = omdb.imdbRating;
              if (omdb.imdbVotes && omdb.imdbVotes !== 'N/A') imdbVotes = omdb.imdbVotes;
              if (omdb.Rated && omdb.Rated !== 'N/A') rated = omdb.Rated;
              if (omdb.Genre && omdb.Genre !== 'N/A') genreNames = omdb.Genre;
            }
          }
        } catch (e) {
          // ignore OMDb error
        }
      }

      // Multi-select Age Rating Filter (n8n YasKontrolu logic)
      if (allowedRatingsSet && rated && !allowedRatingsSet.has(rated)) {
        return null; // Exclude content that does not match selected age groups
      }

      // Trailer
      const videos = d.videos?.results || [];
      const ytTrailer = videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      const trailerUrl = ytTrailer ? `https://www.youtube.com/watch?v=${ytTrailer.key}` : '';

      return {
        id: d.id,
        imdb_id: imdbId,
        title: title,
        title_tr: title,
        releaseDate,
        year,
        mediaType,
        genre: genreNames,
        rated,
        imdb_puani: imdbRating,
        imdbVotes,
        popularity: d.popularity || 0,
        poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : 'https://placehold.co/500x750/1e293b/white?text=Afiş+Yok',
        backdrop: d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : '',
        overview: d.overview || 'Bu içerik için Türkçe açıklama henüz bulunmuyor.',
        platformlar: providerNames.join(', '),
        ucretsiz: free.map(p => p.provider_name).join(', '),
        kiralik: rent.map(p => p.provider_name).join(', '),
        satilik: buy.map(p => p.provider_name).join(', '),
        providers: providerNames,
        trailer_url: trailerUrl,
        imdb_link: imdbId ? `https://www.imdb.com/title/${imdbId}/` : ''
      };
    } catch (e) {
      return null;
    }
  });

  const detailedList = (await Promise.all(detailedPromises)).filter(Boolean);
  return {
    items: detailedList,
    hasMore: anyTypeHasMore
  };
}
