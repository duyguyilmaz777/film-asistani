// Scoring Service: Implements Bayesian Weighted Rating & Jaccard Genre Taste Similarity

/**
 * Calculates Bayesian Weighted Rating (wr_skoru)
 * Formula: WR = (v / (v + m)) * R + (m / (v + m)) * C
 * v = vote count (imdbVotes)
 * m = minimum vote threshold (esik = 1000)
 * R = average rating of film (imdb_puani)
 * C = mean rating across the whole pool
 */
export const calculateBayesianScores = (films, defaultThreshold = 1000) => {
  if (!films || !films.length) return [];

  const validRatings = films
    .map(f => parseFloat(f.imdb_puani))
    .filter(r => !isNaN(r) && r > 0);

  const C = validRatings.length > 0
    ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length
    : 7.0;

  return films.map(film => {
    const R = parseFloat(film.imdb_puani) || 0;
    const v = parseInt(String(film.imdbVotes || '0').replace(/[^0-9]/g, '')) || 0;
    
    let wr = R;
    if (v > 0) {
      wr = (v / (v + defaultThreshold)) * R + (defaultThreshold / (v + defaultThreshold)) * C;
    } else {
      // If no votes, pull closer to mean C
      wr = C * 0.8;
    }

    return {
      ...film,
      wr_skoru: Math.round(wr * 100) / 100,
      voteCountParsed: v
    };
  });
};

/**
 * Calculates Jaccard Similarity and Final Score based on user's past genre preferences
 * @param {Array} films - Candidate films with wr_skoru
 * @param {Object} turSayaci - Map of genre frequencies from user history e.g. { 'Animation': 5, 'Family': 3 }
 */
export const calculateTasteSimilarityAndFinalScores = (films, turSayaci = {}) => {
  if (!films || !films.length) return [];

  // Top 3 favorite genres of user
  const entries = Object.entries(turSayaci || {}).sort((a, b) => b[1] - a[1]);
  const favoriTurler = new Set(entries.slice(0, 3).map(([tur]) => tur.toLowerCase()));
  const hasHistory = favoriTurler.size > 0;

  return films.map(film => {
    const adayTurler = new Set(
      (film.genre || '')
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
    );

    let jaccard = 0;
    if (hasHistory && adayTurler.size > 0) {
      const kesisim = [...adayTurler].filter(t => favoriTurler.has(t)).length;
      const birlesim = new Set([...adayTurler, ...favoriTurler]).size;
      jaccard = birlesim > 0 ? kesisim / birlesim : 0;
    } else {
      // Neutral similarity if no history yet
      jaccard = 0.5;
    }

    const wrScore = film.wr_skoru || parseFloat(film.imdb_puani) || 7.0;
    // WR is 70% weight (0-10 normalized to 0-1), Jaccard is 30% weight (0-1)
    const finalSkor = 0.7 * (wrScore / 10) + 0.3 * jaccard;

    return {
      ...film,
      jaccard_benzerlik: Math.round(jaccard * 100) / 100,
      final_skor: Math.round(finalSkor * 1000) / 1000,
      matchPercentage: Math.round(jaccard * 100)
    };
  });
};
