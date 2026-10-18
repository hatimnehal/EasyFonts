import { useEffect, useState } from "react";
import { Search, FileText, X } from "lucide-react";
import { Modal } from "./Modal";
import { api } from "../api";
import { categories } from "../types";
import type { FontItem } from "../types";
import type { ViewPreferences } from "../preferences";
import { ListViewControls } from "./FontAppearance";
import { FontList } from "./FontList";
export function Licenses({
  onClose,
  views,
  onViewsChange,
}: {
  onClose: () => void;
  views: ViewPreferences;
  onViewsChange: (views: ViewPreferences) => void;
}) {
  const [fonts, setFonts] = useState<FontItem[]>([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [active, setActive] = useState<FontItem>(),
    [error, setError] = useState(""),
    [pending, setPending] = useState(true);
  useEffect(() => {
    api<{ fonts: FontItem[] }>("/licenses")
      .then((r) => {
        setFonts(r.fonts);
        setActive(r.fonts[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setPending(false));
  }, []);
  const filtered = fonts.filter(
    (f) =>
      (f.name + " " + f.filename).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" || f.category === filter),
  );
  return (
    <Modal onClose={onClose} label="Gestione licenze" className="license-modal">
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">IL TUO ARCHIVIO</p>
          <h2>Gestione licenze</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Chiudi licenze"
        >
          <X size={21} />
        </button>
      </div>
      <div className="license-tools">
        <label className="search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtra i font…"
            aria-label="Filtra i font"
          />
        </label>
        <select
          aria-label="Filtra per licenza"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tutte le licenze</option>
          {Object.entries(categories).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <ListViewControls
        view={views.listView}
        onChange={(listView) => onViewsChange({ ...views, listView })}
        nativeNames={views.nativeNames}
        onNativeNamesChange={() =>
          onViewsChange({ ...views, nativeNames: !views.nativeNames })
        }
        groupFamilies={views.groupFamilies}
        onGroupFamiliesChange={() =>
          onViewsChange({ ...views, groupFamilies: !views.groupFamilies })
        }
      />
      <div className="license-layout">
        <div className="license-list">
          {pending ? (
            <p className="empty">Caricamento…</p>
          ) : (
            <FontList
              fonts={filtered}
              activeId={active?.id || ""}
              selected={new Set()}
              mode="library"
              busy={false}
              view={views.listView}
              nativeNames={views.nativeNames}
              groupFamilies={views.groupFamilies}
              onActivate={(id) => setActive(fonts.find((f) => f.id === id))}
              onToggle={() => {}}
              onToggleFamily={() => {}}
              onImport={() => {}}
              showSelection={false}
            />
          )}
          {!pending && !filtered.length && (
            <p className="empty">{error || "Nessun font trovato."}</p>
          )}
        </div>
        <div className="license-content">
          {active ? (
            <>
              <h3>{active.name}</h3>
              <span className={`license-badge ${active.category}`}>
                {categories[active.category]}
              </span>
              <p className="license-note">
                Classificazione automatica basata sul testo. Consulta sempre la
                licenza originale e le sue condizioni.
              </p>
              {active.licenses.map((l) => (
                <article key={l.id}>
                  <h4>
                    <FileText size={15} />
                    {l.name}
                  </h4>
                  {l.pdf ? (
                    <>
                      <a href={l.url} target="_blank" rel="noreferrer">
                        Apri il documento PDF ↗
                      </a>
                      <iframe title={l.name} src={l.url} />
                    </>
                  ) : (
                    <pre>{l.text}</pre>
                  )}
                </article>
              ))}
              {active.metadata && (
                <article>
                  <h4>Metadati del font</h4>
                  <pre>{active.metadata}</pre>
                </article>
              )}
              {!active.metadata && !active.licenses.length && (
                <p className="empty">
                  Nessuna licenza trovata. L’assenza di licenza non autorizza
                  l’uso commerciale.
                </p>
              )}
            </>
          ) : (
            <p className="empty">Le licenze importate rimangono salvate qui.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
