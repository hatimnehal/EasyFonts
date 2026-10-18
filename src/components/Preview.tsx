import { Maximize2 } from "lucide-react";
import type { FontItem } from "../types";
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
}: {
  font?: FontItem;
  negative?: boolean;
  size?: number;
  onExpand?: () => void;
  expanded?: boolean;
  ready: boolean;
  variants?: FontItem[];
  onVariantChange?: (id: string) => void;
}) {
  const { text, setText } = useSpecimenText(font, negative);
  return (
    <section
      className={`preview ${negative ? "negative" : "positive"} ${expanded ? "expanded-preview" : ""}`}
    >
      <div className="preview-top">
        <span>{negative ? "p. neg." : "p. posit."}</span>
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
