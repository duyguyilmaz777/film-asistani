// Mappings directly ported and enhanced from FilmlerAPiKeysiz.json

export const IZINLI_DERECELER_MAP = {
  '0-4': ['G', 'TV-Y', 'TV-G'],
  '5-9': ['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG'],
  '10-13': ['G', 'PG', 'PG-13', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14'],
  '14-17': ['G', 'PG', 'PG-13', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14'],
  '18+': ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', 'NR'],
  'Hepsi için genel aile filtresi (PG ve altı)': ['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG']
};

export const YAS_GRUPLARI = [
  { id: 'all', label: 'Tümü (Filtresiz)' },
  { id: '0-4', label: '0 - 4 Yaş' },
  { id: '5-9', label: '5 - 9 Yaş' },
  { id: '10-13', label: '10 - 13 Yaş' },
  { id: '14-17', label: '14 - 17 Yaş' },
  { id: '18+', label: '18+ Yetişkin' },
  { id: 'Hepsi için genel aile filtresi (PG ve altı)', label: 'Aile Filtresi (PG ve Altı)' }
];

export const GENRE_MAP = {
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
  'Gizem': '9648',
  'Tümü': ''
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
  { id: 'En Popüler', label: '🔥 En Popüler (TMDB Trend)' },
  { id: 'En Yüksek Puan', label: '⭐ En Yüksek Puan (IMDb)' },
  { id: 'wr_skoru', label: '🧠 Bayes Güvenilirlik Skoru (Önerilen)' },
  { id: 'En Yeni', label: '📅 En Yeni Çıkanlar' }
];
