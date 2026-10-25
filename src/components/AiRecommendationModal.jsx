import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, Send, Film } from 'lucide-react';

export const AiRecommendationModal = ({
  recommendationText,
  isOpen,
  onClose,
  activeProfile
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedTg, setCopiedTg] = useState(false);

  if (!isOpen) return null;

  const handleCopyNormal = () => {
    navigator.clipboard.writeText(recommendationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Converts text to Telegram HTML format (matches n8n Code in JavaScript1 & Sonuc node)
  const handleCopyTelegramFormat = () => {
    let t = recommendationText;
    t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    t = t.replace(/^#{1,6}\s*(.+)$/gm, '<b>$1</b>');
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    t = t.replace(/^\s*[\*\-]\s+/gm, '• ');
    t = t.replace(/^---+$/gm, '');

    const tgMessage = `🤖 <b>CineAI Tavsiye Raporu (${activeProfile})</b>\n\n${t}`;
    navigator.clipboard.writeText(tgMessage);
    setCopiedTg(true);
    setTimeout(() => setCopiedTg(false), 2000);
  };

  // Simple clean markdown parser for rendering
  const renderFormattedContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="ai-md-h3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="ai-md-h4">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const itemText = line.replace(/^[\*\-]\s+/, '');
        return (
          <li key={idx} className="ai-md-li" dangerouslySetInnerHTML={{
            __html: itemText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          }} />
        );
      }
      if (line.trim() === '---') {
        return <hr key={idx} className="ai-md-divider" />;
      }
      if (line.trim() === '') {
        return <div key={idx} className="ai-md-spacer" />;
      }
      return (
        <p key={idx} className="ai-md-p" dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        }} />
      );
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ai-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-header-title">
            <div className="ai-badge-glow">
              <Sparkles size={20} className="text-ai" />
            </div>
            <div>
              <h3>Gemini AI Akıllı Sinema Raporu</h3>
              <div className="ai-header-sub">
                {activeProfile} profili için özel olarak analiz edildi
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="ai-modal-body">
          <div className="ai-report-paper">
            {renderFormattedContent(recommendationText)}
          </div>
        </div>

        {/* Footer actions */}
        <div className="ai-modal-footer">
          <button
            type="button"
            className="ai-footer-btn"
            onClick={handleCopyNormal}
          >
            {copied ? <Check size={16} className="text-emerald" /> : <Copy size={16} />}
            <span>{copied ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
          </button>

          <button
            type="button"
            className="ai-footer-btn tg-btn"
            onClick={handleCopyTelegramFormat}
            title="n8n Telegram Formatında Kopyala"
          >
            {copiedTg ? <Check size={16} className="text-emerald" /> : <Send size={16} />}
            <span>{copiedTg ? 'Telegram Formatı Kopyalandı!' : 'Telegram Formatında Kopyala'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
