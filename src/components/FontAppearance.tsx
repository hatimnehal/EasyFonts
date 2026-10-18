import { memo, useEffect, useRef, useState } from "react";
import {
  AlignJustify,
  Columns2,
  LayoutGrid,
  List,
  Rows2,
  Type,
  Layers,
} from "lucide-react";
import { loadFont } from "../api";
import type { FontItem } from "../types";
import type { ListView, PreviewLayout } from "../preferences";
import { Preview } from "./Preview";

function useVisibleFont<T extends HTMLElement>(font: FontItem, enabled = true) {
  const ref = useRef<T>(null),
    [loadedId, setLoadedId] = useState(""),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    let disposed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        setVisible(isVisible);
        if (isVisible)
          loadFont(font)
            .then(() => {
              if (!disposed) setLoadedId(font.id);
            })
            .catch(() => {});
      },
      { rootMargin: "160px" },
    );
    observer.observe(ref.current);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [font.id, font.url, enabled]);
  return { ref, ready: enabled && loadedId === font.id, visible };
}
export const NativeFontName = memo(function NativeFontName({
  font,
  enabled,
  label,
}: {
  font: FontItem;
  enabled: boolean;
  label?: string;
}) {
  const { ref, ready } = useVisibleFont<HTMLSpanElement>(font, enabled);
  return (
    <span
      ref={ref}
      className={enabled ? "native-font-name" : undefined}
      style={ready ? { fontFamily: `"ef-${font.id}"` } : undefined}
      title={font.name}
    >
      {label || font.name}
    </span>
  );
});
export function ListViewControls({
  view,
  onChange,
  nativeNames,
  onNativeNamesChange,
  groupFamilies = false,
  onGroupFamiliesChange,
}: {
  view: ListView;
  onChange: (view: ListView) => void;
  nativeNames: boolean;
  onNativeNamesChange: () => void;
  groupFamilies?: boolean;
  onGroupFamiliesChange?: () => void;
}) {
  return (
    <div className="list-view-toolbar">
      <div className="segmented" role="group" aria-label="Vista lista font">
        {(
          [
            { value: "list", label: "Vista elenco", Icon: List },
            { value: "compact", label: "Vista compatta", Icon: AlignJustify },
            { value: "grid", label: "Vista griglia", Icon: LayoutGrid },
          ] as const
        ).map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={view === value}
            onClick={() => onChange(value)}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <button
        className="native-names-toggle"
        type="button"
        title="Mostra i nomi con il rispettivo font"
        aria-label="Nomi nel proprio font"
        aria-pressed={nativeNames}
        onClick={onNativeNamesChange}
      >
        <Type size={16} />
      </button>
      {onGroupFamiliesChange && (
        <button
          className="group-families-toggle"
          type="button"
          title="Raggruppa famiglie"
          aria-label="Raggruppa famiglie"
          aria-pressed={groupFamilies}
          onClick={onGroupFamiliesChange}
        >
          <Layers size={16} />
        </button>
      )}
    </div>
  );
}
export function PreviewViewControls({
  view,
  onChange,
}: {
  view: PreviewLayout;
  onChange: (view: PreviewLayout) => void;
}) {
  return (
    <div
      className="segmented preview-view-controls"
      role="group"
      aria-label="Vista anteprime"
    >
      {(
        [
          { value: "stacked", label: "Anteprime impilate", Icon: Rows2 },
          { value: "columns", label: "Anteprime affiancate", Icon: Columns2 },
          {
            value: "gallery",
            label: "Griglia di tutti i font",
            Icon: LayoutGrid,
          },
        ] as const
      ).map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={view === value}
          onClick={() => onChange(value)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
export const FontGalleryCard = memo(function FontGalleryCard({
  font,
  active,
  onActivate,
  onExpand,
  variants = [],
  size = 34,
  expanded = false,
  showNegative = true,
  extraControls,
  nativeNames = false,
}: {
  font: FontItem;
  active: boolean;
  onActivate: (font: FontItem) => void;
  onExpand?: (font: FontItem, negative: boolean) => void;
  variants?: FontItem[];
  size?: number;
  expanded?: boolean;
  showNegative?: boolean;
  extraControls?:
    import("react").ReactNode | ((font: FontItem) => import("react").ReactNode);
  nativeNames?: boolean;
}) {
  const [variantId, setVariantId] = useState(font.id);
  useEffect(() => setVariantId(font.id), [font.id]);
  const current = variants.find((f) => f.id === variantId) || font;
  const { ref, ready, visible } = useVisibleFont<HTMLElement>(current);
  function change(id: string) {
    const next = variants.find((f) => f.id === id);
    if (next) {
      setVariantId(id);
      onActivate(next);
    }
  }
  return (
    <article
      ref={ref}
      className={`gallery-card ${active ? "active" : ""} ${expanded ? "expanded-card" : ""} ${showNegative ? "" : "single-specimen-card"}`}
    >
      <div className="gallery-specimens">
        {visible ? (
          <>
            <Preview
              font={current}
              ready={ready}
              size={size}
              expanded={expanded}
              onExpand={onExpand ? () => onExpand(current, false) : undefined}
            />
            {showNegative && (
              <Preview
                font={current}
                ready={ready}
                size={size}
                negative
                expanded={expanded}
                onExpand={onExpand ? () => onExpand(current, true) : undefined}
              />
            )}
          </>
        ) : (
          <>
            <div className="gallery-placeholder positive" />
            {showNegative && <div className="gallery-placeholder negative" />}
          </>
        )}
      </div>
      <div className="gallery-caption">
        <button
          className="gallery-heading"
          onClick={() => onActivate(current)}
          aria-pressed={active}
        >
          <NativeFontName
            font={current}
            label={current.family}
            enabled={nativeNames}
          />
          <small>{current.name}</small>
        </button>
        <div className="gallery-card-controls">
          {typeof extraControls === "function"
            ? extraControls(current)
            : extraControls}
          {variants.length > 1 ? (
            <select
              className="card-variant"
              aria-label={`Variante card — ${current.family}`}
              value={current.id}
              onChange={(e) => change(e.target.value)}
            >
              {variants.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.style}
                  {variants.filter((other) => other.style === f.style).length >
                  1
                    ? ` · ${f.filename}`
                    : ""}
                </option>
              ))}
            </select>
          ) : (
            <span className="card-style">{current.style}</span>
          )}
        </div>
      </div>
    </article>
  );
});
