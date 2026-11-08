// Mappings directly ported and enhanced from FilmlerAPiKeysiz.json

export const IZINLI_DERECELER_MAP = {
  '0-4': ['G', 'TV-Y', 'TV-G'],
  '5-9': ['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG'],
  '10-13': ['G', 'PG', 'PG-13', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14'],
  '14-17': ['G', 'PG', 'PG-13', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14'],
  '18+': ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', 'NR', '18+'],
  'aile': ['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG'],
  'Hepsi için genel aile filtresi (PG ve altı)': ['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG']
};

export const YAS_GRUPLARI = [
  { id: 'all', label: 'Tümü (Filtresiz)' },
  { id: '0-4', label: '0 - 4 Yaş (Genel İzleyici)' },
  { id: '5-9', label: '5 - 9 Yaş (Çocuk & Aile)' },
  { id: '10-13', label: '10 - 13 Yaş' },
  { id: '14-17', label: '14 - 17 Yaş (Genç)' },
  { id: '18+', label: '+18 Yetişkin' },
  { id: 'aile', label: 'Genel Aile Filtresi (0-9 Yaş Uygun)' }
];

/**
 * Converts technical MPAA / TV parental guidelines codes (PG, PG-13, R, TV-MA, etc.)
 * into user-friendly Turkish age suitability labels.
 */
export const getAgeRatingInfo = (rated) => {
  if (!rated || rated === 'N/A' || rated === 'NR' || rated === 'Not Rated' || rated === 'Unrated') {
    return {
      shortLabel: 'Genel İzleyici',
      longLabel: 'Genel İzleyici (Yaş Sınırı Belirtilmemiş)',
      ageGroup: 'Tüm Yaşlar',
      color: '#94a3b8'
    };
  }

  const r = String(rated).trim().toUpperCase();

  if (['G', 'TV-Y', 'TV-G'].includes(r)) {
    return {
      shortLabel: '0-4 Yaş (Genel)',
      longLabel: '0-4 Yaş ve Üzeri (Genel İzleyiciye Uygun)',
      ageGroup: '0-4 Yaş',
      color: '#10b981' // Green
    };
  }

  if (['PG', 'TV-Y7', 'TV-Y7-FV', 'TV-PG'].includes(r)) {
    return {
      shortLabel: '5-9 Yaş (Aile)',
      longLabel: '5-9 Yaş ve Üzeri (Aile Eşliğinde Uygun)',
      ageGroup: '5-9 Yaş',
      color: '#06b6d4' // Cyan
    };
  }

  if (['PG-13', '13+'].includes(r)) {
    return {
      shortLabel: '10-13 Yaş (13+)',
      longLabel: '10-13 Yaş ve Üzeri (13+ Çocuk ve Gençler)',
      ageGroup: '10-13 Yaş',
      color: '#f59e0b' // Amber
    };
  }

  if (['TV-14', '14+', '15+', '16+'].includes(r)) {
    return {
      shortLabel: '14-17 Yaş (Genç)',
      longLabel: '14-17 Yaş ve Üzeri (Genç ve Yetişkin)',
      ageGroup: '14-17 Yaş',
      color: '#f97316' // Orange
    };
  }

  if (['R', 'NC-17', 'TV-MA', '18+', 'X'].includes(r)) {
    return {
      shortLabel: '+18 Yetişkin',
      longLabel: '+18 Yetişkin İzleyiciye Uygun',
      ageGroup: '+18 Yetişkin',
      color: '#ef4444' // Red
    };
  }

  return {
    shortLabel: '10-13 Yaş',
    longLabel: `10-13 Yaş ve Üzeri (${rated})`,
    ageGroup: '10-13 Yaş',
    color: '#f59e0b'
  };
};

/**
 * Formats ISO release date (YYYY-MM-DD) into readable Turkish date (e.g. "14 Eki 1994")
 */
export const formatReleaseDate = (releaseDate, fallbackYear = '') => {
  if (!releaseDate) return fallbackYear || 'Tarih Yok';
  const parts = String(releaseDate).split('-');
  if (parts.length < 3) return fallbackYear || releaseDate;

  const months = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
  ];
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
    return year || fallbackYear;
  }
  return `${day} ${months[monthIdx]} ${year}`;
};

export const GENRE_MAP = {
  'Tümü': '',
  'Animasyon': '16',
  'Aile': '10751',
  'Macera': '12',
  'Komedi': '35',
  'Polisiye': '80',
  'Gerilim': '53',
  'Bilim Kurgu': '878',
  'Dram': '18',
  'Fantastik': '14',
  'Aksiyon': '28',
  'Gizem': '9648'
};

export const GENRE_LIST = Object.keys(GENRE_MAP);

export const DATE_RANGE_MAP = {
  'Son 30 gün': 30,
  'Son 3 ay': 90,
  'Son 1 yıl': 365,
  'Son 3 yıl': 1095,
  'Son 5 yıl': 1825,
  'Son 10 yıl': 3650,
  'Tümü': null
};

export const DATE_RANGES = Object.keys(DATE_RANGE_MAP);

export const PLATFORM_CONFIG = {
  'Netflix': {
    id: '8',
    color: '#E50914',
    bg: 'rgba(229, 9, 20, 0.15)',
    border: 'rgba(229, 9, 20, 0.35)',
    badgeName: 'Netflix'
  },
  'Amazon Prime': {
    id: '119',
    color: '#00A8E1',
    bg: 'rgba(0, 168, 225, 0.15)',
    border: 'rgba(0, 168, 225, 0.35)',
    badgeName: 'Prime Video'
  },
  'Disney+': {
    id: '337',
    color: '#113CCF',
    bg: 'rgba(17, 60, 207, 0.18)',
    border: 'rgba(17, 60, 207, 0.4)',
    badgeName: 'Disney+'
  },
  'Apple TV+': {
    id: '350',
    color: '#D1D5DB',
    bg: 'rgba(209, 213, 219, 0.12)',
    border: 'rgba(209, 213, 219, 0.3)',
    badgeName: 'Apple TV+'
  },
  'HBO Max': {
    id: '1899',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.35)',
    badgeName: 'Max / HBO'
  },
  'BluTV': {
    id: '564',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.35)',
    badgeName: 'BluTV'
  },
  'TOD': {
    id: '565',
    color: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.35)',
    badgeName: 'TOD'
  }
};

export const PLATFORMLAR = Object.keys(PLATFORM_CONFIG);

export const SIRALAMA_SECENEKLERI = [
  { id: 'En Eski', label: '📅 Gösterim Tarihi (En Eski İlk Sırada)' },
  { id: 'wr_skoru', label: '🛡️ Güvenilir Puan (Çok Oylanan & Beğenilenler)' },
  { id: 'En Yüksek Puan', label: '⭐ En Yüksek Puan (IMDb)' },
  { id: 'En Popüler', label: '🔥 En Popüler (Güncel Trendler)' },
  { id: 'En Yeni', label: '🆕 Gösterim Tarihi (En Yeni İlk Sırada)' }
];
