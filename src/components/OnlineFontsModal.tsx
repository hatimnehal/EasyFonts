import React, { useState, useEffect } from "react";
import {
  Search,
  Star,
  Download,
  LoaderCircle,
  ExternalLink,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Filter,
} from "lucide-react";
import type { FontItem, OnlineFontItem, OnlineSearchResponse } from "../types";
import { Modal } from "./Modal";
import { api } from "../api";

export type OnlineFontsModalProps = {
  open: boolean;
  onClose: () => void;
  starred: OnlineFontItem[];
  onToggleStar: (item: OnlineFontItem) => void;
  onClearStars: () => void;
  onImported: (result: {
    fonts: FontItem[];
    added: FontItem[];
    warnings: string[];
  }) => void;
  defaultFolder?: string | null;
};

const CURATED_FALLBACK_FONTS: OnlineFontItem[] = [
  {
    id: "google:roboto",
    name: "Roboto",
    family: "Roboto",
    author: "Christian Robertson",
    source: "google",
    category: "commercial",
    licenseLabel: "Apache 2.0 (Uso commerciale)",
    stylesCount: 12,
    downloadId: "roboto",
    pageUrl: "https://fonts.google.com/specimen/Roboto",
  },
  {
    id: "google:inter",
    name: "Inter",
    family: "Inter",
    author: "Rasmus Andersson",
    source: "google",
    category: "commercial",
    licenseLabel: "SIL OFL 1.1 (Uso commerciale)",
    stylesCount: 18,
    downloadId: "inter",
    pageUrl: "https://fonts.google.com/specimen/Inter",
  },
  {
    id: "google:playfair-display",
    name: "Playfair Display",
    family: "Playfair Display",
    author: "Claus Eggers Sørensen",
    source: "google",
    category: "commercial",
    licenseLabel: "SIL OFL 1.1 (Uso commerciale)",
    stylesCount: 6,
    downloadId: "playfair-display",
    pageUrl: "https://fonts.google.com/specimen/Playfair+Display",
  },
  {
    id: "google:space-grotesk",
    name: "Space Grotesk",
    family: "Space Grotesk",
    author: "Florian Karsten",
    source: "google",
    category: "commercial",
    licenseLabel: "SIL OFL 1.1 (Uso commerciale)",
    stylesCount: 5,
    downloadId: "space-grotesk",
    pageUrl: "https://fonts.google.com/specimen/Space+Grotesk",
  },
  {
    id: "fontshare:satoshi",
    name: "Satoshi",
    family: "Satoshi",
    author: "Indian Type Foundry",
    source: "fontshare",
    category: "commercial",
    licenseLabel: "Gratuito uso commerciale",
    stylesCount: 10,
    downloadId: "satoshi",
    pageUrl: "https://www.fontshare.com/fonts/satoshi",
  },
  {
    id: "fontshare:clash-display",
    name: "Clash Display",
    family: "Clash Display",
    author: "Indian Type Foundry",
    source: "fontshare",
    category: "commercial",
    licenseLabel: "Gratuito uso commerciale",
    stylesCount: 6,
    downloadId: "clash-display",
    pageUrl: "https://www.fontshare.com/fonts/clash-display",
  },
  {
    id: "fontshare:general-sans",
    name: "General Sans",
    family: "General Sans",
    author: "Indian Type Foundry",
    source: "fontshare",
    category: "commercial",
    licenseLabel: "Gratuito uso commerciale",
    stylesCount: 12,
    downloadId: "general-sans",
    pageUrl: "https://www.fontshare.com/fonts/general-sans",
  },
  {
    id: "dafont:american-captain",
    name: "American Captain",
    family: "American Captain",
    author: "The Fontry",
    source: "dafont",
    category: "commercial",
    licenseLabel: "100% Gratuito (Commerciale)",
    stylesCount: 1,
    downloadId: "american_captain",
    pageUrl: "https://www.dafont.com/american-captain.font",
  },
  {
    id: "dafont:lemon-milk",
    name: "Lemon Milk",
    family: "Lemon Milk",
    author: "Marsnev",
    source: "dafont",
    category: "personal",
    licenseLabel: "Gratis per uso personale",
    stylesCount: 8,
    downloadId: "lemon_milk",
    pageUrl: "https://www.dafont.com/lemon-milk.font",
  },
];

export function OnlineFontsModal({
  open,
  onClose,
  starred,
  onToggleStar,
  onClearStars,
  onImported,
  defaultFolder,
}: OnlineFontsModalProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | "dafont" | "google" | "fontshare">("all");
  const [commercialOnly, setCommercialOnly] = useState(false);
  const [previewText, setPreviewText] = useState("La forma delle parole dà corpo al pensiero.");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OnlineFontItem[]>(CURATED_FALLBACK_FONTS);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Caricamento dinamico dei fogli di stile Google Fonts per i font trovati
  useEffect(() => {
    const googleItems = results.filter((f) => f.source === "google");
    if (!googleItems.length) return;

    const uniqueFamilies = [...new Set(googleItems.map((f) => f.family))];
    const params = uniqueFamilies
      .map((fam) => `family=${fam.replace(/\s+/g, "+")}:wght@400;700`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${params}&display=swap`;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [results]);

  // Esecuzione ricerca con debounce
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const resp = await api<OnlineSearchResponse>("/online/search", {
          query: query.trim(),
          source,
          commercial: commercialOnly,
        });
        if (!cancelled) {
          setResults(resp.items || []);
        }
      } catch {
        if (!cancelled) {
          // Fallback resiliente con catalogo incorporato filtrato
          const q = query.trim().toLowerCase();
          const filtered = CURATED_FALLBACK_FONTS.filter((item) => {
            if (source !== "all" && item.source !== source) return false;
            if (commercialOnly && item.category !== "commercial") return false;
            if (q) {
              return (
                item.name.toLowerCase().includes(q) ||
                item.family.toLowerCase().includes(q) ||
                item.author.toLowerCase().includes(q)
              );
            }
            return true;
          });
          setResults(filtered);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, source, commercialOnly]);

  const handleDownloadSingle = async (item: OnlineFontItem) => {
    setDownloadingIds((prev) => new Set([...prev, item.id]));
    setError(null);
    try {
      const res = await api<{
        fonts: FontItem[];
        added: FontItem[];
        warnings: string[];
      }>("/online/download", {
        items: [item],
        targetFolder: defaultFolder,
      });
      onImported(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Errore durante il download di ${item.name}`;
      setError(msg);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDownloadBulk = async () => {
    if (!starred.length) return;
    setDownloadingBulk(true);
    setError(null);
    try {
      const res = await api<{
        fonts: FontItem[];
        added: FontItem[];
        warnings: string[];
      }>("/online/download", {
        items: starred,
        targetFolder: defaultFolder,
      });
      onImported(res);
      onClearStars();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Errore durante il download dei font con stella";
      setError(msg);
    } finally {
      setDownloadingBulk(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      onClose={onClose}
      label="Esplora Font Gratis Online"
      className="online-modal"
    >
      <div className="online-dialog">
        {/* Intestazione */}
        <div className="online-header">
          <div className="online-header-title">
            <Sparkles size={18} />
            <h2>Esplora Font Gratis Online</h2>
          </div>
          <button
            type="button"
            className="online-close-btn"
            onClick={onClose}
            aria-label="Chiudi finestra ricerca font online"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra di ricerca e filtri */}
        <div className="online-toolbar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="online-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca su DaFont, Google Fonts, Fontshare o incolla URL DaFont…"
              aria-label="Cerca font gratis online"
            />
            {query && (
              <button
                type="button"
                className="clear-query-btn"
                onClick={() => setQuery("")}
                aria-label="Cancella ricerca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-controls-row">
            {/* Filtro Sorgente */}
            <div className="source-filter-group" role="group" aria-label="Filtro fornitore font">
              <button
                type="button"
                className={`source-btn ${source === "all" ? "active" : ""}`}
                onClick={() => setSource("all")}
              >
                Tutti
              </button>
              <button
                type="button"
                className={`source-btn ${source === "dafont" ? "active" : ""}`}
                onClick={() => setSource("dafont")}
              >
                DaFont
              </button>
              <button
                type="button"
                className={`source-btn ${source === "google" ? "active" : ""}`}
                onClick={() => setSource("google")}
              >
                Google Fonts
              </button>
              <button
                type="button"
                className={`source-btn ${source === "fontshare" ? "active" : ""}`}
                onClick={() => setSource("fontshare")}
              >
                Fontshare
              </button>
            </div>

            {/* Checkbox solo uso commerciale */}
            <label className="commercial-toggle">
              <input
                type="checkbox"
                checked={commercialOnly}
                onChange={(e) => setCommercialOnly(e.target.checked)}
              />
              <span>Solo uso commerciale</span>
            </label>
          </div>

          {/* Input per modificare in tempo reale il testo di prova su tutte le card */}
          <div className="preview-text-input-wrap">
            <label htmlFor="online-live-preview-input" className="preview-text-label">
              Testo anteprima dal vivo:
            </label>
            <input
              id="online-live-preview-input"
              type="text"
              className="preview-live-input"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Digita qui il testo di prova…"
              aria-label="Testo specimen di prova per tutte le card online"
            />
          </div>
        </div>

        {/* Messaggio di Errore se presente */}
        {error && (
          <div className="online-error-banner" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Risultati & Griglia Card */}
        <div className="online-results-container">
          {loading && (
            <div className="online-loading-indicator">
              <LoaderCircle className="animate-spin" size={20} />
              <span>Ricerca font in corso…</span>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="online-empty-state">
              <p>Nessun font trovato per i filtri selezionati.</p>
              <button
                type="button"
                className="reset-filters-btn"
                onClick={() => {
                  setQuery("");
                  setSource("all");
                  setCommercialOnly(false);
                }}
              >
                Reimposta filtri di ricerca
              </button>
            </div>
          )}

          <div className="online-cards-grid">
            {results.map((item) => {
              const isStarred = starred.some((s) => s.id === item.id);
              const isDownloading = downloadingIds.has(item.id);

              return (
                <div key={item.id} className="online-font-card">
                  <div className="card-top">
                    <div className="font-info">
                      <div className="font-name-wrap">
                        <h3 className="font-name">{item.name}</h3>
                        {item.pageUrl && (
                          <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                            aria-label={`Apri pagina di ${item.name}`}
                            title="Apri pagina font esterna"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <span className="font-author">di {item.author || "Autore non specificato"}</span>
                    </div>

                    <div className="card-top-actions">
                      {/* Pulsante Stella */}
                      <button
                        type="button"
                        className={`star-btn ${isStarred ? "starred" : ""}`}
                        aria-label={`Stella ${item.name}`}
                        aria-pressed={isStarred}
                        title={isStarred ? "Rimuovi stella" : "Metti la stella per download cumulativo"}
                        onClick={() => onToggleStar(item)}
                      >
                        <Star
                          size={18}
                          fill={isStarred ? "#e5a110" : "none"}
                          color={isStarred ? "#e5a110" : "currentColor"}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Badges Sorgente e Licenza */}
                  <div className="card-badges">
                    <span className={`source-badge source-${item.source}`}>
                      {item.source === "dafont"
                        ? "DaFont"
                        : item.source === "google"
                          ? "Google Fonts"
                          : "Fontshare"}
                    </span>
                    <span
                      className={`license-badge ${
                        item.category === "commercial"
                          ? "commercial"
                          : item.category === "personal"
                            ? "personal"
                            : "unknown"
                      }`}
                    >
                      {item.licenseLabel}
                    </span>
                    {item.stylesCount && item.stylesCount > 1 && (
                      <span className="styles-count-badge">
                        {item.stylesCount} stili
                      </span>
                    )}
                  </div>

                  {/* Specimen Live direttamente modificabile */}
                  <div className="card-specimen-wrap">
                    <textarea
                      rows={2}
                      className="font-specimen-textarea"
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      aria-label={`Testo anteprima ${item.name}`}
                      placeholder={item.name}
                      spellCheck={false}
                      style={{
                        fontFamily:
                          item.source === "google"
                            ? `"${item.family}", sans-serif`
                            : "sans-serif",
                      }}
                    />
                  </div>

                  {/* Azione di Download Singolo */}
                  <div className="card-bottom">
                    <button
                      type="button"
                      className="single-download-btn"
                      disabled={isDownloading}
                      onClick={() => handleDownloadSingle(item)}
                      aria-label={`Scarica font ${item.name}`}
                    >
                      {isDownloading ? (
                        <LoaderCircle className="animate-spin" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      <span>{isDownloading ? "Download in corso…" : "Scarica"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barra Fissa per Download Multiplo con Stella */}
        <div className="online-footer-bar">
          <div className="starred-status">
            <Star size={16} fill="#e5a110" color="#e5a110" />
            <span>
              <strong>★ {starred.length}</strong> {starred.length === 1 ? "font con stella" : "font con stella"}
            </span>
            {starred.length > 0 && (
              <button
                type="button"
                className="clear-stars-btn"
                onClick={onClearStars}
                aria-label="Azzera lista preferiti con stella"
              >
                Azzera
              </button>
            )}
          </div>

          <div className="footer-actions">
            <button
              type="button"
              className="bulk-download-btn"
              disabled={starred.length === 0 || downloadingBulk}
              onClick={handleDownloadBulk}
              aria-label={`Scarica tutti i ${starred.length} font con stella`}
            >
              {downloadingBulk ? (
                <LoaderCircle className="animate-spin" size={15} />
              ) : (
                <Download size={15} />
              )}
              <span>Scarica tutti ({starred.length})</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .online-modal {
          max-width: 980px;
          width: 94vw;
          height: 88vh;
          max-height: 88vh;
          padding: 0;
          overflow: hidden;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }
        .online-dialog {
          display: flex;
          flex-direction: column;
          height: 100%;
          color: var(--ink);
        }
        .online-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid var(--line);
        }
        .online-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #598058;
        }
        .online-header-title h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--ink);
        }
        .online-close-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        .online-close-btn:hover {
          color: var(--ink);
          background: var(--hover);
        }
        .online-toolbar {
          padding: 14px 24px;
          background: var(--hover);
          border-bottom: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--muted);
          pointer-events: none;
        }
        .online-search-input {
          width: 100%;
          padding: 9px 36px 9px 36px;
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--panel);
          color: var(--ink);
          font-size: 13px;
          outline: none;
        }
        .online-search-input:focus {
          border-color: #598058;
        }
        .clear-query-btn {
          position: absolute;
          right: 10px;
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
        }
        .toolbar-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .source-filter-group {
          display: flex;
          gap: 4px;
          background: var(--panel);
          padding: 3px;
          border-radius: 6px;
          border: 1px solid var(--line);
        }
        .source-btn {
          border: 0;
          background: transparent;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 500;
          border-radius: 4px;
          color: var(--muted);
          cursor: pointer;
        }
        .source-btn.active {
          background: var(--ink);
          color: var(--bg);
        }
        .commercial-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ink);
          cursor: pointer;
          user-select: none;
        }
        .commercial-toggle input[type="checkbox"] {
          accent-color: #598058;
          cursor: pointer;
        }
        .preview-text-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .preview-text-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          white-space: nowrap;
        }
        .preview-live-input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--panel);
          color: var(--ink);
          font-size: 12px;
          outline: none;
        }
        .preview-live-input:focus {
          border-color: #598058;
        }
        .online-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 24px;
          background: #fdf2f2;
          color: #b8463d;
          font-size: 12px;
          border-bottom: 1px solid #f0cfcc;
        }
        .online-results-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .online-loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px;
          color: var(--muted);
          font-size: 13px;
        }
        .online-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--muted);
          font-size: 13px;
          gap: 10px;
        }
        .reset-filters-btn {
          border: 1px solid var(--line);
          background: var(--panel);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: var(--ink);
          cursor: pointer;
        }
        .online-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .online-font-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .online-font-card:hover {
          border-color: #acc1a5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .font-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .font-name-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .font-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .external-link {
          color: var(--muted);
          display: inline-flex;
          align-items: center;
        }
        .external-link:hover {
          color: var(--ink);
        }
        .font-author {
          font-size: 11px;
          color: var(--muted);
        }
        .star-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: transform 0.15s ease;
        }
        .star-btn:hover {
          transform: scale(1.15);
        }
        .star-btn.starred {
          color: #e5a110;
        }
        .card-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .source-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .source-badge.source-dafont {
          background: #ffebe6;
          color: #de350b;
        }
        .source-badge.source-google {
          background: #e6f4ea;
          color: #137333;
        }
        .source-badge.source-fontshare {
          background: #e8f0fe;
          color: #1a73e8;
        }
        .styles-count-badge {
          background: var(--hover);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--muted);
        }
        .card-specimen-wrap {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 8px 10px;
        }
        .font-specimen-textarea {
          width: 100%;
          border: 0;
          background: transparent;
          color: var(--ink);
          resize: none;
          outline: none;
          font-size: 20px;
          line-height: 1.35;
          margin: 0;
          padding: 0;
        }
        .font-specimen-textarea:focus {
          outline: 1px dashed var(--muted);
          outline-offset: 2px;
        }
        .card-bottom {
          display: flex;
          justify-content: flex-end;
          margin-top: auto;
        }
        .single-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--ink);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .single-download-btn:hover:not(:disabled) {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }
        .online-footer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: var(--panel);
          border-top: 1px solid var(--line);
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
        }
        .starred-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--ink);
        }
        .clear-stars-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 11px;
          text-decoration: underline;
          cursor: pointer;
          margin-left: 6px;
        }
        .clear-stars-btn:hover {
          color: var(--ink);
        }
        .bulk-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 6px;
          border: 0;
          background: #598058;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .bulk-download-btn:hover:not(:disabled) {
          opacity: 0.92;
        }
        .bulk-download-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  );
}
export default OnlineFontsModal;
