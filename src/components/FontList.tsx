import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Lock, Minus } from "lucide-react";
import type { FontItem } from "../types";
import { familyKey, groupFonts } from "../families";
import type { ListView } from "../preferences";
import { FontGalleryCard, NativeFontName } from "./FontAppearance";

function Selection({
  label,
  checked,
  mixed = false,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  mixed?: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className="checkbox-wrap">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        ref={(node) => {
          if (node) node.indeterminate = mixed;
        }}
        onChange={onChange}
        disabled={disabled}
      />
      <span>
        {checked ? (
          <Check size={12} strokeWidth={3} />
        ) : mixed ? (
          <Minus size={12} />
        ) : null}
      </span>
    </label>
  );
}
export function FontList({
  fonts,
  activeId,
  selected,
  mode,
  busy,
  view,
  nativeNames,
  groupFamilies,
  onActivate,
  onToggle,
  onToggleFamily,
  onImport,
  onExpand,
  showSelection = true,
}: {
  fonts: FontItem[];
  activeId: string;
  selected: Set<string>;
  mode: "library" | "system";
  busy: boolean;
  view: ListView;
  nativeNames: boolean;
  groupFamilies: boolean;
  onActivate: (id: string) => void;
  onToggle: (id: string) => void;
  onToggleFamily: (ids: string[]) => void;
  onImport: () => void;
  onExpand?: (font: FontItem, negative: boolean) => void;
  showSelection?: boolean;
}) {
  const families = useMemo(() => groupFonts(fonts), [fonts]),
    familyMap = useMemo(
      () => new Map(families.map((f) => [f.key, f.fonts])),
      [families],
    );
  const root = useRef<HTMLDivElement>(null),
    [expanded, setExpanded] = useState<Set<string>>(new Set());
  const eligible = fonts.filter((f) => !(mode === "system" && f.protected)),
    count = eligible.filter((f) => selected.has(f.id)).length,
    all = !!eligible.length && count === eligible.length;
  useEffect(() => {
    const font = fonts.find((f) => f.id === activeId);
    if (groupFamilies && font) {
      const key = familyKey(font);
      setExpanded((prev) => (prev.has(key) ? prev : new Set([...prev, key])));
      const frame = requestAnimationFrame(() =>
        root.current
          ?.querySelector(`[data-font-id="${activeId}"]`)
          ?.scrollIntoView({ block: "nearest" }),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [activeId, groupFamilies, fonts]);
  function checkbox(f: FontItem) {
    return showSelection ? (
      <Selection
        label={`Seleziona ${f.name}`}
        checked={selected.has(f.id)}
        disabled={busy || (mode === "system" && f.protected)}
        onChange={() => onToggle(f.id)}
      />
    ) : null;
  }
  function toggleFamily(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function row(f: FontItem, variant = false) {
    return (
      <div
        key={f.id}
        id={(showSelection ? "font-" : "license-font-") + f.id}
        data-font-id={f.id}
        className={`font-row ${activeId === f.id ? "active" : ""} ${variant ? "variant-row" : ""}`}
      >
        {checkbox(f)}
        <button
          className="font-name"
          onClick={() => onActivate(f.id)}
          aria-pressed={activeId === f.id}
        >
          <NativeFontName
            font={f}
            enabled={nativeNames}
            label={variant ? f.style : undefined}
          />
          <small>
            {variant ? f.filename : f.style}
            {f.installed ? " · Installato" : ""}
          </small>
        </button>
        {mode === "system" && f.protected && (
          <Lock size={13} className="lock" aria-label="Font protetto" />
        )}
      </div>
    );
  }
  function card(
    f: FontItem,
    variants: FontItem[],
    controls?: (font: FontItem) => import("react").ReactNode,
  ) {
    return (
      <div
        key={f.id}
        id={(showSelection ? "font-" : "license-font-") + f.id}
        data-font-id={f.id}
        className="font-list-card"
      >
        <FontGalleryCard
          font={f}
          variants={variants}
          active={variants.some((font) => font.id === activeId)}
          onActivate={(font) => onActivate(font.id)}
          onExpand={onExpand}
          showNegative={false}
          size={29}
          nativeNames={nativeNames}
          extraControls={controls || checkbox}
        />
      </div>
    );
  }
  return (
    <>
      {showSelection && (
        <div className="select-all-row">
          <Selection
            label="Seleziona tutti"
            checked={all}
            mixed={count > 0 && !all}
            disabled={busy || !eligible.length}
            onChange={() => onToggleFamily(eligible.map((f) => f.id))}
          />
          <span>Seleziona tutti</span>
          <small>{eligible.length}</small>
        </div>
      )}
      <div
        ref={root}
        className={`font-list font-view-${view} ${groupFamilies ? "grouped-families" : ""}`}
        aria-label="Elenco font"
      >
        {groupFamilies
          ? families.map((family) => {
              if (family.fonts.length === 1)
                return view === "grid"
                  ? card(family.fonts[0], family.fonts)
                  : row(family.fonts[0]);
              const current =
                  family.fonts.find((f) => f.id === activeId) ||
                  family.fonts[0],
                available = family.fonts.filter(
                  (f) => !(mode === "system" && f.protected),
                ),
                n = available.filter((f) => selected.has(f.id)).length,
                checked = !!available.length && n === available.length,
                open = expanded.has(family.key);
              const controls = () => (
                <>
                  {showSelection && (
                    <Selection
                      label={`Seleziona famiglia ${family.name}`}
                      checked={checked}
                      mixed={n > 0 && !checked}
                      disabled={busy || !available.length}
                      onChange={() =>
                        onToggleFamily(available.map((f) => f.id))
                      }
                    />
                  )}
                  <button
                    className="family-expand"
                    aria-label={`${open ? "Comprimi" : "Espandi"} famiglia ${family.name}`}
                    aria-expanded={open}
                    onClick={() => toggleFamily(family.key)}
                  >
                    <ChevronDown size={15} />
                  </button>
                </>
              );
              return (
                <section
                  className="font-family"
                  key={family.key}
                  data-family={family.name}
                >
                  {view === "grid" ? (
                    card(current, family.fonts, controls)
                  ) : (
                    <div
                      className={`font-row family-header ${family.fonts.some((f) => f.id === activeId) ? "family-active" : ""}`}
                    >
                      {showSelection && (
                        <Selection
                          label={`Seleziona famiglia ${family.name}`}
                          checked={checked}
                          mixed={n > 0 && !checked}
                          disabled={busy || !available.length}
                          onChange={() =>
                            onToggleFamily(available.map((f) => f.id))
                          }
                        />
                      )}
                      <button
                        className="font-name"
                        onClick={() => onActivate(current.id)}
                      >
                        <NativeFontName
                          font={current}
                          enabled={nativeNames}
                          label={family.name}
                        />
                        <small>
                          {family.fonts.length} varianti · {current.style}
                        </small>
                      </button>
                      <button
                        className="family-expand"
                        aria-label={`${open ? "Comprimi" : "Espandi"} famiglia ${family.name}`}
                        aria-expanded={open}
                        onClick={() => toggleFamily(family.key)}
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  )}
                  {open && (
                    <div className="family-variants">
                      {family.fonts.map((f) => row(f, true))}
                    </div>
                  )}
                </section>
              );
            })
          : fonts.map((f) =>
              view === "grid"
                ? card(f, familyMap.get(familyKey(f)) || [f])
                : row(f),
            )}
        {!fonts.length && (
          <div className="empty">
            Nessun font nella lista.
            <button onClick={onImport}>Carica dei font →</button>
          </div>
        )}
      </div>
    </>
  );
}
