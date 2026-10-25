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
 * Main search & filter runner matching n8n workflow steps:
 * LookUp -> TMDB Discover/Search -> Details & TR Providers -> OMDB -> Age Rating Filter -> Bayes (TekeDusur) -> Jaccard Taste Similarity
 */
export const searchAndFilterFilms = async (filters, username = 'Duygu') => {
  const settings = getSettings();
  const apiKey = (settings.tmdbApiKey || '').trim();

  if (!apiKey) {
    throw new Error('TMDB API anahtarı bulunamadı. Lütfen .env dosyasına TMDB_API_KEY değerini ekleyin.');
  }

  // 1) Fetch live TMDB & OMDb results
  const rawFilms = await fetchLiveTmdbFilms(filters, settings);

  // 2) Bayesian Weighted Rating calculation (matches n8n 'TekeDusur')
  const withBayes = calculateBayesianScores(rawFilms, 1000);

  // 3) User Genre Frequency & Jaccard Taste Matching (matches n8n 'Benzerlik Skoru' & 'GecmisTurSorgusu')
  const genreFreqs = getPastGenreFrequencies(username);
  const scoredFilms = calculateTasteSimilarityAndFinalScores(withBayes, genreFreqs);

  // 4) Sorting based on filter
  const siralama = filters.siralama || 'wr_skoru';
  scoredFilms.sort((a, b) => {
    if (siralama === 'wr_skoru') {
      return (b.wr_skoru || 0) - (a.wr_skoru || 0);
    }
    if (siralama === 'final_skor') {
      return (b.final_skor || 0) - (a.final_skor || 0);
    }
    if (siralama === 'En Yüksek Puan') {
      return parseFloat(b.imdb_puani || 0) - parseFloat(a.imdb_puani || 0);
    }
    if (siralama === 'En Popüler') {
      return (b.popularity || 0) - (a.popularity || 0);
    }
    if (siralama === 'En Yeni') {
      return parseInt(b.year || 0) - parseInt(a.year || 0);
    }
    return 0;
  });

  return {
    filmler: scoredFilms,
    toplamSonuc: scoredFilms.length,
    kaynak: 'TMDB & OMDb Canlı Bağlantı'
  };
};

/**
 * Live TMDB Fetcher (replicates n8n HTTP Request1, watch/providers TR, and OMDb nodes)
 */
async function fetchLiveTmdbFilms(filters, settings) {
  const apiKey = settings.tmdbApiKey.trim();
  const mediaTypesToFetch = filters.mediaType === 'all' ? ['movie', 'tv'] : [filters.mediaType];
  const page = filters.sayfa || 1;

  const allItems = [];

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
      } else if (filters.siralama === 'En Yüksek Puan') {
        params.append('sort_by', 'vote_average.desc');
        params.append('vote_count.gte', '150');
      } else {
        params.append('sort_by', 'popularity.desc');
        params.append('vote_count.gte', '20');
      }

      // Genre
      if (filters.tur && GENRE_MAP[filters.tur]) {
        params.append('with_genres', GENRE_MAP[filters.tur]);
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
      }
    } catch (e) {
      console.error(`Error querying TMDB for ${mediaType}:`, e);
    }
  }

  // Fetch full details and providers for top 20 candidates
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
      const releaseDate = d.release_date || d.first_air_date || '';
      const year = releaseDate ? releaseDate.split('-')[0] : '';
      const imdbId = d.external_ids?.imdb_id;

      // OMDb fetch for accurate ratings and age certification
      let imdbRating = String(d.vote_average || '0');
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

      // Age Rating Filter (n8n YasKontrolu logic)
      if (filters.yasGrubu && filters.yasGrubu !== 'all' && filters.yasGrubu !== '18+') {
        const allowed = IZINLI_DERECELER_MAP[filters.yasGrubu] || [];
        if (allowed.length > 0 && rated && !allowed.includes(rated)) {
          return null; // Exclude content that exceeds age limit
        }
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
  return detailedList;
}
