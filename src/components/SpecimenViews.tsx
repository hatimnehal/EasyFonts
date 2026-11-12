import React, { useState, useEffect } from "react";
import {
  Copy,
  PlusCircle,
  Check,
  Type,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import type { FontItem } from "../types";
import { categories } from "../types";
import type { TypographySettings } from "../preferences";
import { useSpecimenText } from "../previewText";
import { loadFont } from "../api";

/* =========================================================================
   1. WaterfallView
   ========================================================================= */

const WATERFALL_SIZES = [12, 16, 20, 28, 36, 48, 64, 96] as const;

export function WaterfallView({
  font,
  ready,
  typography,
}: {
  font?: FontItem;
  ready: boolean;
  typography: TypographySettings;
}) {
  const [mode, setMode] = useState<"positive" | "negative" | "bw">("positive");
  const isNegative = mode === "negative";
  const { text, setText } = useSpecimenText(font, isNegative);

  const featureSettings =
    typography.activeFeatures && typography.activeFeatures.length > 0
      ? typography.activeFeatures.map((tag) => `"${tag}" 1`).join(", ")
      : undefined;

  const variationSettings =
    typography.axisValues && Object.keys(typography.axisValues).length > 0
      ? Object.entries(typography.axisValues)
          .map(([tag, val]) => `"${tag}" ${val}`)
          .join(", ")
      : undefined;

  return (
    <div className={`specimen-waterfall-view mode-${mode}`}>
      <div className="waterfall-header">
        <div className="waterfall-title-group">
          <Type size={16} />
          <h3>Scala Tipografica Waterfall</h3>
          <span className="waterfall-hint">
            Clicca e scrivi su qualsiasi riga per modificare il testo
          </span>
        </div>

        <div className="waterfall-mode-toggles" role="group" aria-label="Modalità colore scala">
          <button
            type="button"
            className={`mode-btn ${mode === "positive" ? "active" : ""}`}
            onClick={() => setMode("positive")}
            aria-pressed={mode === "positive"}
          >
            Positivo
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "negative" ? "active" : ""}`}
            onClick={() => setMode("negative")}
            aria-pressed={mode === "negative"}
          >
            Negativo
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "bw" ? "active" : ""}`}
            onClick={() => setMode("bw")}
            aria-pressed={mode === "bw"}
          >
            B/W
          </button>
        </div>
      </div>

      <div className="waterfall-list">
        {WATERFALL_SIZES.map((size) => {
          const rowIsDark = mode === "negative" || (mode === "bw" && size % 2 === 0);
          return (
            <div
              key={size}
              className={`waterfall-row ${rowIsDark ? "dark-row" : "light-row"}`}
            >
              <div className="waterfall-meta">
                <span className="size-badge">{size} px</span>
              </div>
              <div className="waterfall-input-wrap">
                <textarea
                  rows={1}
                  className="waterfall-textarea"
                  value={text}
                  aria-label={`Testo anteprima a ${size} pixel`}
                  placeholder="Scrivi qui per provare la scala…"
                  spellCheck={false}
                  onChange={(e) => setText(e.target.value)}
                  style={{
                    fontFamily: font && ready ? `"ef-${font.id}"` : "sans-serif",
                    fontSize: `${size}px`,
                    letterSpacing:
                      typography.tracking !== undefined
                        ? `${typography.tracking}em`
                        : undefined,
                    lineHeight: typography.lineHeight ?? 1.25,
                    textAlign: typography.align || "left",
                    textTransform:
                      typography.transform && typography.transform !== "none"
                        ? typography.transform
                        : undefined,
                    fontFeatureSettings: featureSettings,
                    fontVariationSettings: variationSettings,
                    opacity: ready ? 1 : 0.5,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .specimen-waterfall-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--panel);
          transition: background 0.2s ease;
        }
        .specimen-waterfall-view.mode-negative {
          background: #151617;
          border-color: #2e3032;
          color: #f0f0ed;
        }
        .waterfall-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
          flex-wrap: wrap;
          gap: 10px;
        }
        .mode-negative .waterfall-header {
          border-color: #2e3032;
        }
        .waterfall-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .waterfall-title-group h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
        .waterfall-hint {
          font-size: 11px;
          color: var(--muted);
        }
        .waterfall-mode-toggles {
          display: flex;
          gap: 4px;
          background: var(--hover);
          padding: 2px;
          border-radius: 6px;
        }
        .mode-negative .waterfall-mode-toggles {
          background: #252728;
        }
        .mode-btn {
          border: 0;
          background: transparent;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 500;
          border-radius: 4px;
          color: var(--muted);
          cursor: pointer;
        }
        .mode-btn.active {
          background: var(--panel);
          color: var(--ink);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .mode-negative .mode-btn.active {
          background: #36383a;
          color: #fff;
        }
        .waterfall-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .waterfall-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 8px 12px;
          border-radius: 6px;
          border-bottom: 1px solid var(--line);
        }
        .mode-negative .waterfall-row {
          border-color: #262729;
        }
        .waterfall-row.dark-row {
          background: #1a1b1c;
          color: #ffffff;
        }
        .waterfall-row.light-row {
          background: transparent;
        }
        .waterfall-meta {
          min-width: 58px;
          flex-shrink: 0;
        }
        .size-badge {
          display: inline-block;
          font-size: 11px;
          font-family: monospace;
          color: var(--muted);
          font-weight: 600;
        }
        .dark-row .size-badge {
          color: #8e908d;
        }
        .waterfall-input-wrap {
          flex: 1;
          min-width: 0;
        }
        .waterfall-textarea {
          width: 100%;
          border: 0;
          background: transparent;
          color: inherit;
          padding: 0;
          margin: 0;
          resize: none;
          outline: none;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .waterfall-textarea:focus {
          outline: 1px dashed var(--muted);
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}

/* =========================================================================
   2. GlyphsInspectorView
   ========================================================================= */

const DEFAULT_SAMPLE_GLYPHS = Array.from(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÀÈÉÌÒÙàèéìòù€£$%&@#?!+-*/=()[]{}",
);

export function GlyphsInspectorView({
  font,
  ready,
  onInsertGlyph,
  onNotice,
}: {
  font?: FontItem;
  ready: boolean;
  onInsertGlyph?: (char: string) => void;
  onNotice?: (msg: string) => void;
}) {
  const glyphs =
    font?.sampleGlyphs && font.sampleGlyphs.length > 0
      ? font.sampleGlyphs
      : DEFAULT_SAMPLE_GLYPHS;

  const [selectedGlyph, setSelectedGlyph] = useState<string>(() => glyphs[0] || "A");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (glyphs.length > 0 && !glyphs.includes(selectedGlyph)) {
      setSelectedGlyph(glyphs[0]);
    }
  }, [font?.id, glyphs]);

  const codePointNum = selectedGlyph ? selectedGlyph.codePointAt(0) : undefined;
  const unicodeHex =
    codePointNum !== undefined
      ? `U+${codePointNum.toString(16).toUpperCase().padStart(4, "0")}`
      : "—";

  const handleCopy = () => {
    if (!selectedGlyph) return;
    navigator.clipboard
      .writeText(selectedGlyph)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        onNotice?.(`Glifo "${selectedGlyph}" (${unicodeHex}) copiato negli appunti.`);
      })
      .catch(() => {
        onNotice?.(`Glifo "${selectedGlyph}" copiato.`);
      });
  };

  const handleInsert = () => {
    if (!selectedGlyph) return;
    onInsertGlyph?.(selectedGlyph);
    onNotice?.(`Glifo "${selectedGlyph}" inserito nel testo.`);
  };

  const fontFeatures = font?.features || [];

  return (
    <div className="glyphs-inspector-view">
      {/* Scheda Tecnica .glyph-datasheet */}
      <div className="glyph-datasheet">
        <div className="datasheet-header">
          <Info size={16} />
          <h4>Scheda Tecnica Font</h4>
        </div>
        <div className="datasheet-grid">
          <div className="datasheet-item">
            <span className="ds-label">Famiglia:</span>
            <span className="ds-value">{font?.family || font?.name || "—"}</span>
          </div>
          <div className="datasheet-item">
            <span className="ds-label">Stile:</span>
            <span className="ds-value">{font?.style || "—"}</span>
          </div>
          <div className="datasheet-item">
            <span className="ds-label">Formato:</span>
            <span className="ds-value">{font?.metrics?.format || "TTF"}</span>
          </div>
          <div className="datasheet-item">
            <span className="ds-label">Glifi totali:</span>
            <span className="ds-value">{font?.metrics?.numGlyphs ?? "—"}</span>
          </div>
          <div className="datasheet-item">
            <span className="ds-label">UPM:</span>
            <span className="ds-value">{font?.metrics?.unitsPerEm ?? 1000}</span>
          </div>
          <div className="datasheet-item">
            <span className="ds-label">Ascender / Descender:</span>
            <span className="ds-value">
              {font?.metrics?.ascender ?? "—"} / {font?.metrics?.descender ?? "—"}
            </span>
          </div>
          <div className="datasheet-item">
            <span className="ds-label">Fonderia / Designer:</span>
            <span className="ds-value">
              {font?.metrics?.designer || font?.metrics?.manufacturer || "—"}
            </span>
          </div>
          <div className="datasheet-item">
            <span className="ds-label">Licenza:</span>
            <span className="ds-value license-pill">
              {font ? categories[font.category] || font.category : "—"}
            </span>
          </div>
        </div>

        {/* Badge OpenType features */}
        {fontFeatures.length > 0 && (
          <div className="datasheet-features">
            <span className="ds-label">OpenType Features supportate:</span>
            <div className="ot-badge-list">
              {fontFeatures.map((f) => (
                <span key={f} className="ot-feature-badge">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dettaglio Glifo Selezionato e Griglia */}
      <div className="glyphs-workbench">
        {/* Pannello Ingrandimento Glifo */}
        <div className="glyph-focus-card">
          <div
            className="glyph-huge-preview"
            style={{
              fontFamily: font && ready ? `"ef-${font.id}"` : "sans-serif",
            }}
          >
            {selectedGlyph}
          </div>

          <div className="glyph-details">
            <div className="unicode-code">{unicodeHex}</div>
            <div className="glyph-dec">Dec: {codePointNum ?? "—"}</div>
            <div className="glyph-char-name">
              Carattere: <strong>{selectedGlyph}</strong>
            </div>

            <div className="glyph-actions">
              <button
                type="button"
                className="glyph-btn copy-btn"
                onClick={handleCopy}
                aria-label={`Copia glifo ${selectedGlyph}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Copiato!" : "Copia glifo"}</span>
              </button>

              <button
                type="button"
                className="glyph-btn insert-btn"
                onClick={handleInsert}
                aria-label={`Inserisci ${selectedGlyph} nelle preview`}
              >
                <PlusCircle size={14} />
                <span>Inserisci nelle preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Griglia Interattiva Glifi */}
        <div className="glyphs-grid-section">
          <div className="grid-header">
            <span>Mappa Glifi ({glyphs.length} caratteri)</span>
            <span className="grid-sub">Clicca su un glifo per visualizzarlo in grande</span>
          </div>
          <div className="glyphs-grid" role="grid" aria-label="Tabella caratteri del font">
            {glyphs.map((ch, idx) => {
              const isSelected = ch === selectedGlyph;
              return (
                <button
                  key={`${ch}-${idx}`}
                  type="button"
                  className={`glyph-cell ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedGlyph(ch)}
                  aria-label={`Glifo ${ch}`}
                  style={{
                    fontFamily: font && ready ? `"ef-${font.id}"` : "sans-serif",
                  }}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .glyphs-inspector-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .glyph-datasheet {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 16px;
        }
        .datasheet-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: var(--muted);
        }
        .datasheet-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--ink);
        }
        .datasheet-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px 16px;
          font-size: 12px;
        }
        .datasheet-item {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .ds-label {
          color: var(--muted);
          font-size: 11px;
        }
        .ds-value {
          color: var(--ink);
          font-weight: 550;
        }
        .license-pill {
          background: var(--hover);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .datasheet-features {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ot-badge-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .ot-feature-badge {
          background: var(--hover);
          border: 1px solid var(--line);
          color: var(--ink);
          font-family: monospace;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .glyphs-workbench {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .glyphs-workbench {
            grid-template-columns: 1fr;
          }
        }
        .glyph-focus-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
        }
        .glyph-huge-preview {
          font-size: 110px;
          line-height: 1.1;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
          width: 100%;
        }
        .glyph-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 100%;
        }
        .unicode-code {
          font-family: monospace;
          font-size: 15px;
          font-weight: 700;
          color: #598058;
          background: var(--hover);
          padding: 3px 8px;
          border-radius: 4px;
        }
        .glyph-dec, .glyph-char-name {
          font-size: 11px;
          color: var(--muted);
        }
        .glyph-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
        }
        .glyph-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--ink);
          transition: background 0.15s ease;
        }
        .glyph-btn:hover {
          background: var(--hover);
        }
        .insert-btn {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }
        .insert-btn:hover {
          opacity: 0.9;
        }
        .glyphs-grid-section {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .grid-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
        }
        .grid-sub {
          font-size: 11px;
          font-weight: 400;
          color: var(--muted);
        }
        .glyphs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
          gap: 6px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .glyph-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--bg);
          color: var(--ink);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .glyph-cell:hover {
          background: var(--hover);
          transform: translateY(-1px);
        }
        .glyph-cell.selected {
          border-color: #598058;
          background: var(--hover);
          box-shadow: 0 0 0 2px rgba(89, 128, 88, 0.3);
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

/* =========================================================================
   3. PairingView
   ========================================================================= */

export function PairingView({
  font,
  fonts,
  ready,
  typography,
  onTypographyChange,
}: {
  font?: FontItem;
  fonts: FontItem[];
  ready: boolean;
  typography: TypographySettings;
  onTypographyChange: (patch: Partial<TypographySettings>) => void;
}) {
  const pairingFontId = typography.pairingFontId;
  const bodyFont =
    fonts.find((f) => f.id === pairingFontId) ||
    fonts.find((f) => f.id !== font?.id) ||
    font;

  const [bodyReady, setBodyReady] = useState(false);

  useEffect(() => {
    if (!bodyFont) return;
    let cancelled = false;
    loadFont(bodyFont)
      .then(() => {
        if (!cancelled) setBodyReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bodyFont?.id]);

  const [headlineText, setHeadlineText] = useState(
    () => font?.name || "L'armonia tra contrasto e proporzione",
  );
  const [bodyText, setBodyText] = useState(
    "La scelta tipografica per il testo continuo richiede equilibrio e leggibilità. Quando si combinano due caratteri diversi, il contrasto deve essere netto e intenzionale: accoppiare una grazia distintiva per il titolo con un sans-serif geometrico per il testo crea una gerarchia visiva immediata e confortevole per la lettura prolungata.",
  );

  return (
    <div className="specimen-pairing-view">
      {/* Barra di selezione font per il corpo */}
      <div className="pairing-selector-bar">
        <div className="pairing-font-info">
          <Layers size={16} />
          <span>Accoppia <strong>{font?.family || "Titolo"}</strong> con il font per il corpo:</span>
        </div>

        <select
          className="pairing-select"
          aria-label="Scegli font per il corpo del testo"
          value={bodyFont?.id || ""}
          onChange={(e) => onTypographyChange({ pairingFontId: e.target.value })}
        >
          {fonts.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.style})
            </option>
          ))}
        </select>
      </div>

      {/* Schede a confronto Positivo e Negativo */}
      <div className="pairing-cards-grid">
        {/* Card Positivo */}
        <div className="pairing-card positive-card">
          <div className="pairing-card-header">
            <span className="card-badge">POSITIVO</span>
            <span className="font-indicator">
              Titolo: {font?.family || "Headline"} · Corpo: {bodyFont?.family || "Body"}
            </span>
          </div>

          <div className="pairing-content">
            <textarea
              className="pairing-headline-input"
              rows={2}
              aria-label="Titolo anteprima positivo"
              placeholder="Scrivi il titolo…"
              value={headlineText}
              onChange={(e) => setHeadlineText(e.target.value)}
              style={{
                fontFamily: font && ready ? `"ef-${font.id}"` : "sans-serif",
                fontSize: `${Math.max(typography.fontSize, 32)}px`,
                letterSpacing:
                  typography.tracking !== undefined
                    ? `${typography.tracking}em`
                    : undefined,
                lineHeight: typography.lineHeight ?? 1.2,
                textAlign: typography.align || "left",
                textTransform:
                  typography.transform && typography.transform !== "none"
                    ? typography.transform
                    : undefined,
              }}
            />

            <textarea
              className="pairing-body-input"
              rows={6}
              aria-label="Paragrafo corpo anteprima positivo"
              placeholder="Scrivi il paragrafo…"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              style={{
                fontFamily:
                  bodyFont && bodyReady ? `"ef-${bodyFont.id}"` : "sans-serif",
                fontSize: "15px",
                lineHeight: 1.65,
                letterSpacing: "0.01em",
                textAlign: typography.align || "left",
              }}
            />
          </div>
          <div className="pairing-card-footer">
            <span>Clicca sul titolo o sul paragrafo per modificare il testo direttamente</span>
          </div>
        </div>

        {/* Card Negativo */}
        <div className="pairing-card negative-card">
          <div className="pairing-card-header">
            <span className="card-badge">NEGATIVO</span>
            <span className="font-indicator">
              Titolo: {font?.family || "Headline"} · Corpo: {bodyFont?.family || "Body"}
            </span>
          </div>

          <div className="pairing-content">
            <textarea
              className="pairing-headline-input"
              rows={2}
              aria-label="Titolo anteprima negativo"
              placeholder="Scrivi il titolo…"
              value={headlineText}
              onChange={(e) => setHeadlineText(e.target.value)}
              style={{
                fontFamily: font && ready ? `"ef-${font.id}"` : "sans-serif",
                fontSize: `${Math.max(typography.fontSize, 32)}px`,
                letterSpacing:
                  typography.tracking !== undefined
                    ? `${typography.tracking}em`
                    : undefined,
                lineHeight: typography.lineHeight ?? 1.2,
                textAlign: typography.align || "left",
                textTransform:
                  typography.transform && typography.transform !== "none"
                    ? typography.transform
                    : undefined,
              }}
            />

            <textarea
              className="pairing-body-input"
              rows={6}
              aria-label="Paragrafo corpo anteprima negativo"
              placeholder="Scrivi il paragrafo…"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              style={{
                fontFamily:
                  bodyFont && bodyReady ? `"ef-${bodyFont.id}"` : "sans-serif",
                fontSize: "15px",
                lineHeight: 1.65,
                letterSpacing: "0.01em",
                textAlign: typography.align || "left",
              }}
            />
          </div>
          <div className="pairing-card-footer">
            <span>Clicca sul titolo o sul paragrafo per modificare il testo direttamente</span>
          </div>
        </div>
      </div>

      <style>{`
        .specimen-pairing-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pairing-selector-bar {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pairing-font-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--muted);
        }
        .pairing-font-info strong {
          color: var(--ink);
        }
        .pairing-select {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--ink);
          font-size: 12px;
          cursor: pointer;
          min-width: 220px;
        }
        .pairing-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 860px) {
          .pairing-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .pairing-card {
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border: 1px solid var(--line);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }
        .positive-card {
          background: #ffffff;
          color: #1b1c1d;
        }
        .negative-card {
          background: #141516;
          color: #f1f1ee;
          border-color: #2e3032;
        }
        .pairing-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(128, 128, 128, 0.2);
        }
        .card-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(128, 128, 128, 0.15);
        }
        .font-indicator {
          font-size: 11px;
          opacity: 0.7;
        }
        .pairing-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .pairing-headline-input {
          width: 100%;
          border: 0;
          background: transparent;
          color: inherit;
          resize: vertical;
          outline: none;
          padding: 4px 0;
          font-weight: 700;
        }
        .pairing-body-input {
          width: 100%;
          border: 0;
          background: transparent;
          color: inherit;
          resize: vertical;
          outline: none;
          padding: 4px 0;
          opacity: 0.88;
        }
        .pairing-headline-input:focus, .pairing-body-input:focus {
          outline: 1px dashed rgba(128, 128, 128, 0.4);
          border-radius: 4px;
        }
        .pairing-card-footer {
          font-size: 10px;
          opacity: 0.5;
          text-align: right;
          margin-top: auto;
        }
      `}</style>
    </div>
  );
}
