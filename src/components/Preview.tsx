import { Maximize2 } from "lucide-react";
import type { FontItem } from "../types";
import type { TypographySettings } from "../preferences";
import { useSpecimenText } from "../previewText";

export function Preview({
  font,
  negative = false,
  size = 64,
  onExpand,
  expanded = false,
  ready,
  variants = [],
  onVariantChange,
  typography,
}: {
  font?: FontItem;
  negative?: boolean;
  size?: number;
  onExpand?: () => void;
  expanded?: boolean;
  ready: boolean;
  variants?: FontItem[];
  onVariantChange?: (id: string) => void;
  typography?: TypographySettings;
}) {
  const { text, setText } = useSpecimenText(font, negative);
  const featureSettings =
    typography?.activeFeatures && typography.activeFeatures.length > 0
      ? typography.activeFeatures.map((tag) => `"${tag}" 1`).join(", ")
      : undefined;
  const variationSettings =
    typography?.axisValues && Object.keys(typography.axisValues).length > 0
      ? Object.entries(typography.axisValues)
          .map(([tag, val]) => `"${tag}" ${val}`)
          .join(", ")
      : undefined;

  return (
    <section
      className={`preview ${negative ? "negative" : "positive"} ${expanded ? "expanded-preview" : ""}`}
    >
      <div className="preview-top">
        <span>
          {negative ? "p. neg." : "p. posit."}
          {font?.axes && font.axes.length > 0 ? " · VAR" : ""}
        </span>
        {font && variants.length > 1 && onVariantChange ? (
          <select
            className="preview-variant"
            aria-label={`Variante font — ${negative ? "negativo" : "positivo"} — ${font.family}`}
            value={font.id}
            onChange={(e) => onVariantChange(e.target.value)}
          >
            {variants.map((f) => (
              <option key={f.id} value={f.id}>
                {f.style}
                {variants.filter((other) => other.style === f.style).length > 1
                  ? ` · ${f.filename}`
                  : ""}
              </option>
            ))}
          </select>
        ) : (
          <span>{font?.style || "Anteprima"}</span>
        )}
      </div>
      <textarea
        aria-label={`Testo anteprima ${negative ? "negativa" : "positiva"}${font ? " — " + font.name : ""}`}
        spellCheck={false}
        maxLength={20000}
        disabled={!font}
        value={text}
        placeholder="Scrivi qualcosa…"
        onChange={(e) => setText(e.target.value)}
        style={{
          fontFamily: font && ready ? `"ef-${font.id}"` : "sans-serif",
          fontSize: size,
          letterSpacing:
            typography?.tracking !== undefined
              ? `${typography.tracking}em`
              : undefined,
          lineHeight: typography?.lineHeight ?? undefined,
          textAlign: typography?.align || undefined,
          textTransform:
            typography?.transform && typography.transform !== "none"
              ? typography.transform
              : undefined,
          fontFeatureSettings: featureSettings,
          fontVariationSettings: variationSettings,
          opacity: ready ? 1 : 0.4,
        }}
      />
      <div className="preview-bottom">
        {onExpand ? (
          <button
            className="expand-button"
            aria-label={`Espandi anteprima ${negative ? "negativa" : "positiva"}`}
            onClick={onExpand}
          >
            <Maximize2 size={18} />
          </button>
        ) : (
          <span className="preview-font">{font?.name}</span>
        )}
        <span>
          {font && !ready
            ? "Caricamento font…"
            : "Clicca sul testo per modificarlo"}
        </span>
      </div>
    </section>
  );
}
