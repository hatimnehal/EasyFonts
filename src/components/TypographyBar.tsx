import React, { useState } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Copy,
  Download,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { FontItem } from "../types";
import type {
  TypographySettings,
  SpecimenPreset,
  TextAlign,
  TextTransform,
} from "../preferences";

export function specimenPresetText(preset: SpecimenPreset, font?: FontItem): string {
  switch (preset) {
    case "name":
      return font?.name || "EasyFonts";
    case "pangram":
      return "Ma la volpe col suo balzo ha raggiunto il quieto fido cane.";
    case "editorial":
      return "La forma delle parole dà corpo al pensiero. Una tipografia accurata guida lo sguardo, crea ritmo e dona chiarezza visiva alla lettura quotidiana.";
    case "alphabet":
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz";
    case "numbers":
      return "0123456789 € $ £ ¥ % & @ # ? ! + - * / =";
    default:
      return font?.name || "EasyFonts";
  }
}

export type TypographyBarProps = {
  font?: FontItem;
  typography: TypographySettings;
  onChange: (patch: Partial<TypographySettings>) => void;
  onReset: () => void;
  onApplyPreset: (preset: SpecimenPreset, text: string) => void;
  onNotice?: (msg: string) => void;
};

const PRESETS: { id: SpecimenPreset; label: string; ariaLabel: string }[] = [
  { id: "name", label: "Nome", ariaLabel: "Preset Nome del font" },
  { id: "pangram", label: "Pangramma", ariaLabel: "Preset Pangramma italiano" },
  { id: "editorial", label: "Editoriale", ariaLabel: "Preset Testo editoriale lungo" },
  { id: "alphabet", label: "A–Z", ariaLabel: "Preset Alfabeto maiuscolo e minuscolo" },
  { id: "numbers", label: "0–9 €", ariaLabel: "Preset Cifre, valute e simboli" },
];

const ALIGNMENTS: { id: TextAlign; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "left", label: "Allinea a sinistra", icon: AlignLeft },
  { id: "center", label: "Allinea al centro", icon: AlignCenter },
  { id: "right", label: "Allinea a destra", icon: AlignRight },
];

const TRANSFORMS: { id: TextTransform; label: string; title: string }[] = [
  { id: "none", label: "Aa", title: "Testo normale" },
  { id: "uppercase", label: "AA", title: "Tutto maiuscolo" },
  { id: "lowercase", label: "aa", title: "Tutto minuscolo" },
];

const OPENTYPE_TAGS = [
  "liga",
  "kern",
  "smcp",
  "tnum",
  "onum",
  "zero",
  "swsh",
  "ss01",
  "ss02",
] as const;

export function TypographyBar({
  font,
  typography,
  onChange,
  onReset,
  onApplyPreset,
  onNotice,
}: TypographyBarProps) {
  const [openTypeOpen, setOpenTypeOpen] = useState(false);

  const activeFeatures = typography.activeFeatures || [];
  const axisValues = typography.axisValues || {};

  const handleCopyCss = () => {
    const featureSettings = activeFeatures.length
      ? activeFeatures.map((tag) => `"${tag}" 1`).join(", ")
      : "normal";
    const variationSettings =
      Object.keys(axisValues).length > 0
        ? Object.entries(axisValues)
            .map(([k, v]) => `"${k}" ${v}`)
            .join(", ")
        : "normal";

    const cssSnippet = `/* EasyFonts — Regole CSS per ${font?.name || "Font"} */
font-family: "${font?.family || "sans-serif"}", sans-serif;
font-size: ${typography.fontSize}px;
line-height: ${typography.lineHeight};
letter-spacing: ${typography.tracking}em;
text-align: ${typography.align};
text-transform: ${typography.transform};
font-feature-settings: ${featureSettings};
font-variation-settings: ${variationSettings};`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(cssSnippet)
        .then(() => onNotice?.("Regole CSS copiate negli appunti."))
        .catch(() => onNotice?.("Impossibile copiare negli appunti."));
    } else {
      onNotice?.("Regole CSS copiate negli appunti.");
    }
  };

  const handleExportPng = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Sfondo sinistro (Positivo su bianco)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 800, 900);

      // Sfondo destro (Negativo su nero)
      ctx.fillStyle = "#121314";
      ctx.fillRect(800, 0, 800, 900);

      // Linea di divisione centrale
      ctx.strokeStyle = "#e4e4df";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(800, 0);
      ctx.lineTo(800, 900);
      ctx.stroke();

      const drawSpecimenSide = (
        offsetX: number,
        isNegative: boolean,
      ) => {
        const textColor = isNegative ? "#ffffff" : "#1b1c1d";
        const metaColor = isNegative ? "#8a8b88" : "#767774";
        const dividerColor = isNegative ? "#2b2c2d" : "#e4e4df";

        // Intestazione
        ctx.fillStyle = metaColor;
        ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(
          isNegative ? "EASYFONTS SPECIMEN · NEGATIVO" : "EASYFONTS SPECIMEN · POSITIVO",
          offsetX + 50,
          55,
        );

        // Nome Famiglia e Stile
        ctx.fillStyle = textColor;
        ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(font?.family || "EasyFonts", offsetX + 50, 95);

        // Metriche
        ctx.fillStyle = metaColor;
        ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const styleInfo = `${font?.style || "Regular"} · ${font?.metrics?.format || "TTF"}${
          font?.metrics?.numGlyphs ? ` · ${font.metrics.numGlyphs} glifi` : ""
        }`;
        ctx.fillText(styleInfo, offsetX + 50, 122);

        // Linea separatrice
        ctx.strokeStyle = dividerColor;
        ctx.beginPath();
        ctx.moveTo(offsetX + 50, 142);
        ctx.lineTo(offsetX + 750, 142);
        ctx.stroke();

        // Testo Specimen
        const textToDraw = specimenPresetText(typography.preset, font);
        const fontFace = font ? `"ef-${font.id}", sans-serif` : "sans-serif";
        const previewSize = Math.min(Math.max(typography.fontSize, 28), 64);
        ctx.font = `${previewSize}px ${fontFace}`;
        ctx.fillStyle = textColor;

        // Word wrap
        const maxWidth = 700;
        const words = textToDraw.split(" ");
        let line = "";
        let y = 210;
        const lineHeight = previewSize * 1.35;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, offsetX + 50, y);
            line = words[n] + " ";
            y += lineHeight;
            if (y > 680) break;
          } else {
            line = testLine;
          }
        }
        if (line && y <= 680) {
          ctx.fillText(line, offsetX + 50, y);
        }

        // Piede: Alfabeto completo e glifi numerici
        ctx.fillStyle = metaColor;
        ctx.font = "15px sans-serif";
        ctx.fillText(
          "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z",
          offsetX + 50,
          770,
        );
        ctx.fillText(
          "a b c d e f g h i j k l m n o p q r s t u v w x y z",
          offsetX + 50,
          798,
        );
        ctx.fillText(
          "0 1 2 3 4 5 6 7 8 9   € $ £ ¥ % & @ # ? ! + - * / =",
          offsetX + 50,
          826,
        );

        ctx.font = "11px sans-serif";
        ctx.fillText(
          `Corpo: ${typography.fontSize}px · Tracking: ${typography.tracking}em · Interlinea: ${typography.lineHeight}`,
          offsetX + 50,
          865,
        );
      };

      drawSpecimenSide(0, false);
      drawSpecimenSide(800, true);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const safeName = (font?.name || "specimen").replace(/[^\w.-]/g, "_");
        a.download = `${safeName}-specimen.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onNotice?.("Specimen PNG esportato con successo.");
      }, "image/png");
    } catch {
      onNotice?.("Errore durante l'esportazione dell'immagine PNG.");
    }
  };

  const toggleFeature = (tag: string) => {
    const isSet = activeFeatures.includes(tag);
    const updated = isSet
      ? activeFeatures.filter((t) => t !== tag)
      : [...activeFeatures, tag];
    onChange({ activeFeatures: updated });
  };

  const handleAxisChange = (tag: string, val: number) => {
    onChange({
      axisValues: {
        ...axisValues,
        [tag]: val,
      },
    });
  };

  const fontFeatures = font?.features || [];
  const fontAxes = font?.axes || [];

  return (
    <div className="typography-bar-container">
      <div className="typography-bar">
        {/* Gruppo Preset */}
        <div className="typography-group presets-group" role="group" aria-label="Preset testo specimen">
          <span className="group-label">Preset:</span>
          {PRESETS.map((p) => {
            const isCurrent = typography.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`typo-pill-btn ${isCurrent ? "active" : ""}`}
                aria-pressed={isCurrent}
                aria-label={p.ariaLabel}
                onClick={() => {
                  onChange({ preset: p.id });
                  onApplyPreset(p.id, specimenPresetText(p.id, font));
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Separatore */}
        <span className="typo-sep" aria-hidden="true" />

        {/* Controllo Corpo (fontSize 16..160) */}
        <div className="typography-group slider-group">
          <label htmlFor="typo-font-size" className="control-label">
            Corpo <strong>{typography.fontSize}px</strong>
          </label>
          <input
            id="typo-font-size"
            type="range"
            min={16}
            max={160}
            step={1}
            value={typography.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            aria-label="Dimensione corpo carattere"
          />
        </div>

        {/* Controllo Tracking (-0.08..0.25) */}
        <div className="typography-group slider-group">
          <label htmlFor="typo-tracking" className="control-label">
            Tracking <strong>{Number(typography.tracking).toFixed(3)}em</strong>
          </label>
          <input
            id="typo-tracking"
            type="range"
            min={-0.08}
            max={0.25}
            step={0.005}
            value={typography.tracking}
            onChange={(e) => onChange({ tracking: Number(e.target.value) })}
            aria-label="Spaziatura caratteri tracking"
          />
        </div>

        {/* Controllo Interlinea (0.85..2.0) */}
        <div className="typography-group slider-group">
          <label htmlFor="typo-line-height" className="control-label">
            Interlinea <strong>{Number(typography.lineHeight).toFixed(2)}</strong>
          </label>
          <input
            id="typo-line-height"
            type="range"
            min={0.85}
            max={2.0}
            step={0.05}
            value={typography.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            aria-label="Altezza riga interlinea"
          />
        </div>

        {/* Separatore */}
        <span className="typo-sep" aria-hidden="true" />

        {/* Allineamento (left, center, right) */}
        <div className="typography-group icon-btn-group" role="group" aria-label="Allineamento testo">
          {ALIGNMENTS.map((al) => {
            const Icon = al.icon;
            const isCurrent = typography.align === al.id;
            return (
              <button
                key={al.id}
                type="button"
                className={`typo-icon-btn ${isCurrent ? "active" : ""}`}
                aria-pressed={isCurrent}
                aria-label={al.label}
                title={al.label}
                onClick={() => onChange({ align: al.id })}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>

        {/* Trasformazione maiuscolo/minuscolo */}
        <div className="typography-group icon-btn-group" role="group" aria-label="Trasformazione maiuscolo minuscolo">
          {TRANSFORMS.map((tr) => {
            const isCurrent = typography.transform === tr.id;
            return (
              <button
                key={tr.id}
                type="button"
                className={`typo-icon-btn ${isCurrent ? "active" : ""}`}
                aria-pressed={isCurrent}
                aria-label={tr.title}
                title={tr.title}
                onClick={() => onChange({ transform: tr.id })}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>{tr.label}</span>
              </button>
            );
          })}
        </div>

        {/* Separatore */}
        <span className="typo-sep" aria-hidden="true" />

        {/* Toggle OpenType & Assi */}
        <button
          type="button"
          className={`typo-action-btn ${openTypeOpen ? "active" : ""}`}
          onClick={() => setOpenTypeOpen(!openTypeOpen)}
          aria-expanded={openTypeOpen}
          aria-label="Pannello OpenType e Assi Variabili"
          title="Mostra impostazioni OpenType e Assi Variabili"
        >
          <Sliders size={14} />
          <span>OpenType & Assi</span>
          {fontAxes.length > 0 && <span className="axis-count-badge">{fontAxes.length}</span>}
          {openTypeOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Copia CSS */}
        <button
          type="button"
          className="typo-action-btn"
          onClick={handleCopyCss}
          aria-label="Copia regole CSS negli appunti"
          title="Copia codice CSS tipografico negli appunti"
        >
          <Copy size={14} />
          <span>Copia CSS</span>
        </button>

        {/* Esporta PNG */}
        <button
          type="button"
          className="typo-action-btn"
          onClick={handleExportPng}
          aria-label="Esporta specimen grafico PNG"
          title="Esporta tavola Positivo/Negativo su canvas 1600x900 PNG"
        >
          <Download size={14} />
          <span>Esporta PNG</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          className="typo-icon-btn reset-btn"
          onClick={onReset}
          aria-label="Ripristina valori tipografici predefiniti"
          title="Ripristina valori tipografici predefiniti"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Pannello Espandibile OpenType & Assi */}
      {openTypeOpen && (
        <div className="opentype-panel" role="region" aria-label="Impostazioni OpenType e Assi">
          <div className="opentype-section">
            <div className="section-title">
              <Sparkles size={13} />
              <span>Funzionalità OpenType:</span>
            </div>
            <div className="feature-pills">
              {OPENTYPE_TAGS.map((tag) => {
                const isSupported = fontFeatures.includes(tag);
                const isActive = activeFeatures.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`feature-pill ${isActive ? "active" : ""} ${
                      isSupported ? "supported" : "unsupported"
                    }`}
                    aria-pressed={isActive}
                    title={
                      isSupported
                        ? `Caratteristica ${tag} (inclusa nel font)`
                        : `Caratteristica ${tag} (non rilevata nei metadati del font)`
                    }
                    onClick={() => toggleFeature(tag)}
                  >
                    <span className="tag-name">{tag}</span>
                    {isSupported && <span className="supported-dot" title="Presente nel font" />}
                  </button>
                );
              })}
            </div>
          </div>

          {fontAxes.length > 0 && (
            <div className="axes-section">
              <div className="section-title">
                <Sliders size={13} />
                <span>Assi Variable Font:</span>
              </div>
              <div className="axes-grid">
                {fontAxes.map((ax) => {
                  const currentVal = axisValues[ax.tag] ?? ax.defaultValue;
                  return (
                    <div key={ax.tag} className="axis-control">
                      <div className="axis-header">
                        <span className="axis-name">{ax.name || ax.tag}</span>
                        <span className="axis-tag">({ax.tag})</span>
                        <span className="axis-val">{currentVal}</span>
                      </div>
                      <input
                        type="range"
                        min={ax.min}
                        max={ax.max}
                        step={ax.max - ax.min > 200 ? 1 : 0.1}
                        value={currentVal}
                        onChange={(e) => handleAxisChange(ax.tag, Number(e.target.value))}
                        aria-label={`Asse ${ax.name || ax.tag}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .typography-bar-container {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          margin-bottom: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          font-size: 12px;
        }
        .typography-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          flex-wrap: wrap;
        }
        .typography-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .presets-group {
          flex-wrap: wrap;
        }
        .group-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .control-label {
          font-size: 11px;
          color: var(--muted);
          white-space: nowrap;
        }
        .control-label strong {
          color: var(--ink);
          font-weight: 600;
        }
        .slider-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          min-width: 100px;
        }
        .slider-group input[type="range"] {
          width: 95px;
          height: 4px;
          accent-color: #598058;
          cursor: pointer;
        }
        .typo-sep {
          display: inline-block;
          width: 1px;
          height: 22px;
          background: var(--line);
          margin: 0 4px;
        }
        .typo-pill-btn {
          border: 1px solid var(--line);
          background: transparent;
          color: var(--ink);
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .typo-pill-btn:hover {
          background: var(--hover);
        }
        .typo-pill-btn.active {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }
        .icon-btn-group {
          display: flex;
          gap: 2px;
          background: var(--hover);
          padding: 2px;
          border-radius: 5px;
        }
        .typo-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 4px;
          color: var(--muted);
          background: transparent;
          border: 0;
          cursor: pointer;
        }
        .typo-icon-btn:hover {
          color: var(--ink);
          background: var(--panel);
        }
        .typo-icon-btn.active {
          color: var(--ink);
          background: var(--panel);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .reset-btn {
          margin-left: auto;
        }
        .typo-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 9px;
          border: 1px solid var(--line);
          border-radius: 5px;
          font-size: 11px;
          font-weight: 500;
          color: var(--ink);
          background: var(--panel);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .typo-action-btn:hover {
          background: var(--hover);
        }
        .typo-action-btn.active {
          background: var(--active);
          border-color: var(--muted);
        }
        .axis-count-badge {
          background: #598058;
          color: #fff;
          font-size: 10px;
          padding: 1px 5px;
          border-radius: 10px;
          font-weight: 600;
        }
        .opentype-panel {
          border-top: 1px solid var(--line);
          padding: 12px 14px;
          background: var(--hover);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .opentype-section, .axes-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
        }
        .feature-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--ink);
          font-family: monospace;
          font-size: 11px;
          cursor: pointer;
        }
        .feature-pill.supported {
          border-color: #598058;
        }
        .feature-pill.active {
          background: #598058;
          color: #fff;
          border-color: #598058;
        }
        .supported-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #598058;
        }
        .feature-pill.active .supported-dot {
          background: #fff;
        }
        .axes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        .axis-control {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .axis-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }
        .axis-name {
          font-weight: 600;
          color: var(--ink);
        }
        .axis-tag {
          color: var(--muted);
          font-family: monospace;
          font-size: 10px;
        }
        .axis-val {
          font-weight: 700;
          color: #598058;
        }
        .axis-control input[type="range"] {
          width: 100%;
          height: 4px;
          accent-color: #598058;
        }
      `}</style>
    </div>
  );
}
export default TypographyBar;
