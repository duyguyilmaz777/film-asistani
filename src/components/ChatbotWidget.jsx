import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Wand2,
  Trash2,
  Check,
  Star,
  Film,
  Tv,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import {
  YAS_GRUPLARI,
  GENRE_LIST,
  PLATFORMLAR,
  PLATFORM_CONFIG,
  getAgeRatingInfo
} from '../constants/options';
import { searchAndFilterFilms } from '../services/apiService';
import { chatWithCineBot } from '../services/geminiService';

const MIN_RATING_OPTIONS = [
  { value: 0, label: 'Farketmez (Tümü)' },
  { value: 6.0, label: '⭐ 6.0 ve üzeri' },
  { value: 7.0, label: '⭐ 7.0 ve üzeri' },
  { value: 7.5, label: '⭐ 7.5 ve üzeri' },
  { value: 8.0, label: '⭐ 8.0+ (Başyapıtlar)' }
];

const INITIAL_WIZARD_STATE = {
  mediaType: 'all',
  yasGrubu: ['all'],
  tur: ['Tümü'],
  platformlar: ['Tümü'],
  minPuan: 0
};

export const ChatbotWidget = ({
  activeProfile,
  currentFilms = [],
  onSelectMovie,
  onApplyWizardFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Wizard is completely optional; chatbot opens directly in free-form chat mode ('idle')
  const [wizardStep, setWizardStep] = useState('idle'); // 'idle' | 'mediaType' | 'age' | 'genre' | 'platform' | 'minRating'
  const [wizardPrefs, setWizardPrefs] = useState(INITIAL_WIZARD_STATE);
  const [inputText, setInputText] = useState('');
  const [botTyping, setBotTyping] = useState(false);

  const createWelcomeMessage = () => ({
    id: 'welcome-1',
    sender: 'bot',
    text: `Merhaba ${activeProfile}! 👋 Ben Gemini AI destekli sohbet asistanın.\n\nFilm/dizi önerisi, beğendiğin bir yapımın konusu veya aklındaki herhangi bir soru hakkında benimle doğrudan yazışabilirsin. İstersen sağ üstteki **Sihirbaz** butonuna basıp adım adım filtreleme de yapabiliriz.`
  });

  const [messages, setMessages] = useState([createWelcomeMessage()]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [messages, wizardStep, botTyping, isOpen]);

  const appendMessage = (sender, text, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender,
        text,
        ...extra
      }
    ]);
  };

  // Optional Wizard helpers
  const startWizard = () => {
    setWizardPrefs(INITIAL_WIZARD_STATE);
    setWizardStep('mediaType');
    appendMessage('bot', 'Tabii, adım adım bulalım! ✨ İlk olarak **ne izlemek istersin?**');
  };

  const toggleMultiPref = (field, value, allValue) => {
    setWizardPrefs((prev) => {
      let current = [...(prev[field] || [])];
      if (value === allValue) {
        return { ...prev, [field]: [allValue] };
      }
      current = current.filter((item) => item !== allValue);
      if (current.includes(value)) {
        current = current.filter((item) => item !== value);
        if (current.length === 0) current = [allValue];
      } else {
        current.push(value);
      }
      return { ...prev, [field]: current };
    });
  };

  const handleSelectMediaType = (type, label) => {
    setWizardPrefs((prev) => ({ ...prev, mediaType: type }));
    appendMessage('user', label);
    appendMessage('bot', 'Harika! **Hangi yaş grubuna** uygun içerikler arıyorsun?');
    setWizardStep('age');
  };

  const handleConfirmAge = () => {
    const selectedLabels = wizardPrefs.yasGrubu.map(
      (id) => YAS_GRUPLARI.find((y) => y.id === id)?.label || id
    );
    appendMessage('user', `Yaş Grubu: ${selectedLabels.join(', ')}`);
    appendMessage('bot', 'Şimdi **hangi türleri** izlemek istersin?');
    setWizardStep('genre');
  };

  const handleConfirmGenre = () => {
    appendMessage('user', `Tür: ${wizardPrefs.tur.join(', ')}`);
    appendMessage('bot', 'Hangi **yayın platformlarında** izlemek istersin?');
    setWizardStep('platform');
  };

  const handleConfirmPlatform = () => {
    appendMessage('user', `Platform: ${wizardPrefs.platformlar.join(', ')}`);
    appendMessage('bot', 'Son olarak **minimum IMDb puanı** kaç olsun?');
    setWizardStep('minRating');
  };

  const handleSelectMinRating = async (minVal, label) => {
    const finalPrefs = { ...wizardPrefs, minPuan: minVal };
    setWizardPrefs(finalPrefs);
    setWizardStep('idle');
    appendMessage('user', `Min. IMDb: ${label}`);
    setBotTyping(true);

    try {
      const searchFilters = {
        mediaType: finalPrefs.mediaType,
        yasGrubu: finalPrefs.yasGrubu,
        tur: finalPrefs.tur,
        platformlar: finalPrefs.platformlar,
        minPuan: finalPrefs.minPuan,
        tarihAraligi: 'Tümü',
        siralama: 'wr_skoru',
        searchQuery: '',
        sayfa: 1
      };

      const res = await searchAndFilterFilms(searchFilters, activeProfile);
      const found = res.filmler || [];

      if (found.length === 0) {
        appendMessage(
          'bot',
          'Seçtiğin kriterlere tam uyan bir yapım bulunamadı 😔 Bana buradan doğrudan ne tarz bir şey istediğini yazabilirsin, birlikte başka alternatifler bulalım!'
        );
      } else {
        const topPicks = found.slice(0, 4);
        appendMessage('bot', 'Seçimlerine göre öne çıkan yapımları aşağıda listeledim. Bunlar hakkında soru sorabilir veya başka herhangi bir konuda sohbet edebilirsin:', {
          recommendedFilms: topPicks,
          appliedFilters: searchFilters
        });
      }
    } catch (err) {
      appendMessage('bot', 'Arama sırasında bir bağlantı hatası oluştu. Yine de benimle doğrudan sohbet edebilirsin.');
    } finally {
      setBotTyping(false);
    }
  };

  // Clear chat and start fresh conversation
  const handleClearChat = () => {
    setWizardStep('idle');
    setWizardPrefs(INITIAL_WIZARD_STATE);
    setMessages([createWelcomeMessage()]);
  };

  // Direct Free-Form Gemini AI Chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || botTyping) return;

    // If user starts typing during a wizard step, immediately switch to free chat
    if (wizardStep !== 'idle') {
      setWizardStep('idle');
    }

    const newUserMsg = {
      id: `${Date.now()}-u`,
      sender: 'user',
      text: trimmed
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setInputText('');
    setBotTyping(true);

    try {
      const reply = await chatWithCineBot(updatedHistory, currentFilms, wizardPrefs);
      appendMessage('bot', reply);
    } catch (err) {
      appendMessage('bot', 'Şu an yanıt üretirken bir sorun yaşadım, birazdan tekrar dener misin?');
    } finally {
      setBotTyping(false);
    }
  };

  const renderMessageText = (text) => {
    return String(text || '')
      .split('\n')
      .map((line, i) => (
        <p
          key={i}
          className="chat-msg-line"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          }}
        />
      ));
  };

  return (
    <div className="chatbot-container">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          className="chatbot-launcher"
          onClick={() => setIsOpen(true)}
          title="Gemini AI Sohbet Asistanı"
        >
          <MessageCircle size={22} />
          <span className="chatbot-launcher-label">AI Sohbet</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window glass-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="chatbot-title">Gemini AI Sohbet</h4>
                <span className="chatbot-subtitle">Her konuda doğrudan konuş</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-wizard-btn"
                onClick={startWizard}
                title="Adım adım filtre sihirbazını aç"
              >
                <Wand2 size={14} />
                <span>Sihirbaz</span>
              </button>
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={handleClearChat}
                title="Sohbeti Temizle"
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  {renderMessageText(msg.text)}

                  {/* Optional Mini Movie Cards (only when wizard runs) */}
                  {msg.recommendedFilms && msg.recommendedFilms.length > 0 && (
                    <div className="chat-films-list">
                      {msg.recommendedFilms.map((film) => {
                        const ageInfo = getAgeRatingInfo(film.rated);
                        return (
                          <div
                            key={`${film.mediaType}-${film.id}`}
                            className="chat-film-card"
                            onClick={() => onSelectMovie(film)}
                          >
                            <img
                              src={film.poster}
                              alt={film.title_tr || film.title}
                              className="chat-film-poster"
                            />
                            <div className="chat-film-meta">
                              <div className="chat-film-title">{film.title_tr || film.title}</div>
                              <div className="chat-film-sub">
                                <span>{film.year}</span>
                                <span>·</span>
                                <span className="text-gold">⭐ {film.imdb_puani}</span>
                                <span>·</span>
                                <span style={{ color: ageInfo.color }}>{ageInfo.shortLabel}</span>
                              </div>
                              {film.platformlar && (
                                <div className="chat-film-platforms">{film.platformlar}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {msg.appliedFilters && onApplyWizardFilters && (
                        <button
                          type="button"
                          className="chat-apply-filters-btn"
                          onClick={() => onApplyWizardFilters(msg.appliedFilters)}
                        >
                          <SlidersHorizontal size={14} />
                          <span>Bu Seçimleri Ana Listeye Uygula</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Optional Wizard Controls */}
            {!botTyping && wizardStep === 'mediaType' && (
              <div className="wizard-step-box">
                <div className="wizard-chips">
                  <button
                    type="button"
                    className="wizard-chip"
                    onClick={() => handleSelectMediaType('movie', '🎬 Film')}
                  >
                    <Film size={14} />
                    <span>Film</span>
                  </button>
                  <button
                    type="button"
                    className="wizard-chip"
                    onClick={() => handleSelectMediaType('tv', '📺 Dizi')}
                  >
                    <Tv size={14} />
                    <span>Dizi</span>
                  </button>
                  <button
                    type="button"
                    className="wizard-chip"
                    onClick={() => handleSelectMediaType('all', '✨ Farketmez (Film & Dizi)')}
                  >
                    <Sparkles size={14} />
                    <span>Farketmez</span>
                  </button>
                </div>
              </div>
            )}

            {!botTyping && wizardStep === 'age' && (
              <div className="wizard-step-box">
                <div className="wizard-chips">
                  {YAS_GRUPLARI.map((yg) => {
                    const active = wizardPrefs.yasGrubu.includes(yg.id);
                    return (
                      <button
                        key={yg.id}
                        type="button"
                        className={`wizard-chip ${active ? 'selected' : ''}`}
                        onClick={() => toggleMultiPref('yasGrubu', yg.id, 'all')}
                      >
                        {active && <Check size={12} />}
                        <span>{yg.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="wizard-next-btn" onClick={handleConfirmAge}>
                  <span>Devam Et</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {!botTyping && wizardStep === 'genre' && (
              <div className="wizard-step-box">
                <div className="wizard-chips">
                  {GENRE_LIST.map((g) => {
                    const active = wizardPrefs.tur.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        className={`wizard-chip ${active ? 'selected' : ''}`}
                        onClick={() => toggleMultiPref('tur', g, 'Tümü')}
                      >
                        {active && <Check size={12} />}
                        <span>{g}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="wizard-next-btn" onClick={handleConfirmGenre}>
                  <span>Devam Et</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {!botTyping && wizardStep === 'platform' && (
              <div className="wizard-step-box">
                <div className="wizard-chips">
                  <button
                    type="button"
                    className={`wizard-chip ${wizardPrefs.platformlar.includes('Tümü') ? 'selected' : ''}`}
                    onClick={() => toggleMultiPref('platformlar', 'Tümü', 'Tümü')}
                  >
                    {wizardPrefs.platformlar.includes('Tümü') && <Check size={12} />}
                    <span>Tümü</span>
                  </button>
                  {PLATFORMLAR.map((p) => {
                    const active = wizardPrefs.platformlar.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`wizard-chip ${active ? 'selected' : ''}`}
                        onClick={() => toggleMultiPref('platformlar', p, 'Tümü')}
                      >
                        {active && <Check size={12} />}
                        <span>{PLATFORM_CONFIG[p].badgeName}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="wizard-next-btn" onClick={handleConfirmPlatform}>
                  <span>Devam Et</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {!botTyping && wizardStep === 'minRating' && (
              <div className="wizard-step-box">
                <div className="wizard-chips">
                  {MIN_RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className="wizard-chip"
                      onClick={() => handleSelectMinRating(opt.value, opt.label)}
                    >
                      <Star size={12} className="text-gold" />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {botTyping && (
              <div className="chat-bubble-row bot">
                <div className="chat-bubble bot typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Free Chat Input */}
          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="İstediğin her şeyi sor veya sohbet et..."
              className="chatbot-input"
              disabled={botTyping}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!inputText.trim() || botTyping}
              title="Gönder"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
