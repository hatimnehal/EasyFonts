import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Minus,
  Moon,
  Plus,
  Sun,
  X,
  LoaderCircle,
  FileText,
  Monitor,
  AlertCircle,
} from "lucide-react";
import type { FontItem, ImportResult, Result } from "./types";
import { api, loadFont } from "./api";
import { Modal } from "./components/Modal";
import { Preview } from "./components/Preview";
import { Licenses } from "./components/Licenses";
import { ResizableWorkspace } from "./components/ResizableWorkspace";
import {
  FontGalleryCard,
  ListViewControls,
  NativeFontName,
  PreviewViewControls,
} from "./components/FontAppearance";
import {
  defaultViews,
  type RestoredWorkspace,
  type ViewPreferences,
} from "./preferences";
import { FontList } from "./components/FontList";
import { familyKey, groupFonts } from "./families";
import {
  PreviewTextStore,
  PreviewTextProvider,
  PreviewTextControls,
} from "./previewText";
export default function App() {
  const [previewTextStore] = useState(() => new PreviewTextStore());
  const [fonts, setFonts] = useState<FontItem[]>([]),
    [activeId, setActiveId] = useState(""),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [screen, setScreen] = useState<"ingest" | "workspace">("ingest"),
    [mode, setMode] = useState<"library" | "system">("library");
  const [theme, setTheme] = useState(
      () => localStorage.getItem("ef-theme") || "light",
    ),
    [menu, setMenu] = useState(false),
    [licenses, setLicenses] = useState(false),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [drag, setDrag] = useState(false),
    [deleteOpen, setDeleteOpen] = useState(false);
  const [full, setFull] = useState<
      "positive" | "negative" | "split" | "fonts" | null
    >(null),
    [size, setSize] = useState(88),
    [ready, setReady] = useState<Set<string>>(new Set());
  const input = useRef<HTMLInputElement>(null);
  const [views, setViews] = useState<ViewPreferences>(defaultViews);
  const [restoring, setRestoring] = useState(true);
  const [currentFolder, setCurrentFolder] = useState("");
  const initialized = useRef(false);
  const active = fonts.find((f) => f.id === activeId) || fonts[0];
  useEffect(() => {
    api<RestoredWorkspace>("/restore", {})
      .then((r) => {
        setFonts(r.fonts);
        const p = r.preferences;
        setViews({
          ...defaultViews,
          ...Object.fromEntries(
            Object.entries(p).filter(([key]) => key in defaultViews),
          ),
        });
        if (p.theme) setTheme(p.theme);
        previewTextStore.hydrate(p);
        setMode(r.mode);
        setCurrentFolder(r.folder || "");
        if (r.fonts.length) {
          setActiveId(
            r.fonts.some((f) => f.id === p.activeId)
              ? p.activeId!
              : r.fonts[0].id,
          );
          setScreen("workspace");
        } else if (r.folder) setScreen("workspace");
        if (r.warnings.length) setNotice(r.warnings.slice(0, 8).join("\n"));
        initialized.current = true;
      })
      .catch((e) => setNotice(e.message))
      .finally(() => setRestoring(false));
  }, []);
  useEffect(() => {
    if (!initialized.current) return;
    void api("/preferences", { ...views, theme, activeId }).catch((e) =>
      setNotice(e.message),
    );
  }, [views, theme, activeId, restoring]);
  useEffect(() => {
    if (restoring || !initialized.current) return;
    let timer: ReturnType<typeof setTimeout>;
    const unsubscribe = previewTextStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void api("/preferences", previewTextStore.saved()).catch((e) =>
          setNotice(e.message),
        );
      }, 200);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [previewTextStore, restoring]);
  const selectedFonts = fonts.filter((f) => selected.has(f.id));
  const families = useMemo(() => groupFonts(fonts), [fonts]);
  const familyMap = useMemo(
    () => new Map(families.map((f) => [f.key, f.fonts])),
    [families],
  );
  const activeVariants = active
    ? familyMap.get(familyKey(active)) || [active]
    : [];
  const galleryFonts = views.groupFamilies
    ? families.map(
        (f) => f.fonts.find((font) => font.id === active?.id) || f.fonts[0],
      )
    : fonts;
  const requested = full === "fonts" ? selectedFonts : active ? [active] : [];
  const requestedIds = requested.map((f) => f.id).join(",");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ef-theme", theme);
  }, [theme]);
  useEffect(() => {
    let cancelled = false;
    for (const f of requested)
      loadFont(f)
        .then(() => {
          if (!cancelled) setReady((prev) => new Set([...prev, f.id]));
        })
        .catch(() => {
          if (!cancelled)
            setNotice(
              `Impossibile visualizzare ${f.name}. Il file potrebbe non essere supportato dal browser.`,
            );
        });
    return () => {
      cancelled = true;
    };
  }, [requestedIds]);
  async function task(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Operazione non riuscita.");
    } finally {
      setBusy("");
    }
  }
  function accept(r: ImportResult, nextMode: "library" | "system") {
    if (r.cancelled) return;
    if (!r.fonts.length && !r.folder && nextMode !== "system") {
      setNotice(["Nessun font leggibile trovato.", ...r.warnings].join("\n"));
      return;
    }
    setFonts(r.fonts);
    setActiveId(r.fonts[0]?.id || "");
    setSelected(new Set());
    setMode(nextMode);
    setCurrentFolder(r.folder || "");
    setScreen("workspace");
    if (r.warnings.length)
      setNotice(
        `${r.warnings.length} avvisi\n${r.warnings.slice(0, 12).join("\n")}`,
      );
  }
  function importFiles(files: File[]) {
    if (!files.length || busy) return;
    void task("Estrazione e lettura dei font…", async () => {
      const body = new FormData();
      files.forEach((f) => body.append("files", f));
      accept(await api<ImportResult>("/import", body), "library");
    });
  }
  function folder() {
    void task("Scegli la cartella nella finestra di sistema…", async () =>
      accept(await api<ImportResult>("/folder", {}), "library"),
    );
  }
  function chooseUpload() {
    if (busy) return;
    if (window.easyfonts?.desktop) {
      void task("Scegli i file da caricare…", async () =>
        accept(await api<ImportResult>("/import-native", {}), "library"),
      );
    } else input.current?.click();
  }
  function system() {
    setMenu(false);
    void task("Lettura dei font del computer…", async () =>
      accept(await api<ImportResult>("/system", {}), "system"),
    );
  }
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function install(all = false) {
    const items = all ? fonts : selectedFonts;
    if (!items.length || busy) return;
    void task("Installazione dei font…", async () => {
      const r = await api<{ results: Result[]; fonts: FontItem[] }>(
        "/install",
        { ids: items.map((f) => f.id) },
      );
      setFonts((prev) =>
        prev.map((f) => r.fonts.find((x) => x.id === f.id) || f),
      );
      const errors = r.results.filter((x) => !x.ok);
      setNotice(
        `${r.results.length - errors.length} font installati o già presenti.${errors.length ? "\n" + errors.map((x) => `${fonts.find((f) => f.id === x.id)?.name}: ${x.message}`).join("\n") : ""}`,
      );
    });
  }
  function remove() {
    setDeleteOpen(false);
    void task("Rimozione dei font…", async () => {
      const r = await api<{ results: Result[]; recoveryDirectory: string }>(
        "/delete",
        {
          ids: selectedFonts.map((f) => f.id),
          mode,
        },
      );
      const removed = new Set(r.results.filter((x) => x.ok).map((x) => x.id));
      setFonts((prev) => prev.filter((f) => !removed.has(f.id)));
      setSelected(
        (prev) => new Set([...prev].filter((id) => !removed.has(id))),
      );
      const errors = r.results.filter((x) => !x.ok);
      setNotice(
        `${removed.size} font rimossi. Copia recuperabile in ${r.recoveryDirectory}.${errors.length ? "\n" + errors.map((x) => `${fonts.find((f) => f.id === x.id)?.name}: ${x.message}`).join("\n") : ""}`,
      );
    });
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat ||
        busy ||
        licenses ||
        deleteOpen ||
        menu ||
        screen !== "workspace"
      )
        return;
      const el = e.target as HTMLElement;
      if (
        el.closest(
          'input,textarea,select,[contenteditable="true"],[role="separator"]',
        )
      )
        return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const i = fonts.findIndex((f) => f.id === active?.id);
        const next =
          fonts[
            Math.max(
              0,
              Math.min(fonts.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)),
            )
          ];
        if (next) {
          setActiveId(next.id);
          document
            .getElementById("font-" + next.id)
            ?.scrollIntoView({ block: "nearest" });
        }
      }
      if (full) return;
      if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        install();
      }
      if (e.key.toLowerCase() === "v") {
        e.preventDefault();
        install(true);
      }
      if (e.key.toLowerCase() === "r" && selected.size) {
        e.preventDefault();
        setDeleteOpen(true);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  useEffect(() => {
    if (full === "fonts" && selectedFonts.length < 2) setFull("positive");
  }, [selectedFonts.length, full]);
  // Keep the font list stable while preview text changes, even with large libraries.
  const sidebar = useMemo(
    () => (
      <aside className="sidebar">
        <div className="sidebar-heading">
          <div>
            <p className="eyebrow">
              {mode === "system" ? "SUL COMPUTER" : "LA TUA SELEZIONE"}
            </p>
            <h2>
              Font<span>{fonts.length.toString().padStart(2, "0")}</span>
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Importa altri font"
            onClick={() => setScreen("ingest")}
            disabled={!!busy}
          >
            <Plus size={18} />
          </button>
        </div>
        <ListViewControls
          view={views.listView}
          onChange={(listView) => setViews((prev) => ({ ...prev, listView }))}
          nativeNames={views.nativeNames}
          onNativeNamesChange={() =>
            setViews((prev) => ({ ...prev, nativeNames: !prev.nativeNames }))
          }
          groupFamilies={views.groupFamilies}
          onGroupFamiliesChange={() =>
            setViews((prev) => ({
              ...prev,
              groupFamilies: !prev.groupFamilies,
            }))
          }
        />
        <FontList
          fonts={fonts}
          activeId={active?.id || ""}
          selected={selected}
          mode={mode}
          busy={!!busy}
          view={views.listView}
          nativeNames={views.nativeNames}
          groupFamilies={views.groupFamilies}
          onActivate={setActiveId}
          onToggle={toggle}
          onToggleFamily={(ids) =>
            setSelected((prev) => {
              const next = new Set(prev),
                all = ids.every((id) => next.has(id));
              for (const id of ids) all ? next.delete(id) : next.add(id);
              return next;
            })
          }
          onImport={() => setScreen("ingest")}
          onExpand={(font, negative) => {
            setActiveId(font.id);
            setSize(88);
            setFull(negative ? "negative" : "positive");
          }}
        />
        <div className="sidebar-actions">
          <p>
            {selected.size
              ? `${selected.size} selezionati`
              : "Seleziona i font da gestire"}
          </p>
          <button disabled={!selected.size || !!busy} onClick={() => install()}>
            <i className="dot yellow" />
            <span>Installa selezionati</span>
            <kbd>G</kbd>
          </button>
          <button
            disabled={!fonts.length || !!busy}
            onClick={() => install(true)}
          >
            <i className="dot green" />
            <span>Installa tutto</span>
            <kbd>V</kbd>
          </button>
          <button
            disabled={!selected.size || !!busy}
            onClick={() => setDeleteOpen(true)}
          >
            <i className="dot red" />
            <span>Elimina selezionati</span>
            <kbd>R</kbd>
          </button>
        </div>
      </aside>
    ),
    [
      fonts,
      active?.id,
      selected,
      mode,
      busy,
      views.listView,
      views.nativeNames,
      views.groupFamilies,
    ],
  );
  return (
    <PreviewTextProvider store={previewTextStore}>
      <div
        className="app"
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDrag(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          importFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept=".zip,.ttf,.otf,.woff,.woff2"
          onChange={(e) => {
            importFiles(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
        <header
          className={`app-header ${screen === "ingest" ? "ingest-header" : ""}`}
        >
          {screen === "workspace" ? (
            <button
              className="wordmark"
              onClick={() => {
                setScreen("ingest");
                setMenu(false);
              }}
              title="Torna all’ingresso"
            >
              <ArrowLeft size={14} />
              <img
                className="brand-logo"
                src="/assets/easyfonts-logo.png"
                alt="EasyFonts"
              />
              <span>1.1</span>
            </button>
          ) : (
            <div className="wordmark">
              <img
                className="brand-logo"
                src="/assets/easyfonts-logo.png"
                alt="EasyFonts"
              />
              <span>1.1</span>
            </div>
          )}
          <div className="header-right">
            {busy && (
              <span className="busy">
                <LoaderCircle size={15} className="spin" />
                {busy}
              </span>
            )}
            {screen === "workspace" && (
              <div className="menu-container">
                <button
                  aria-label="Menu impostazioni"
                  aria-expanded={menu}
                  className={`settings-button ${menu ? "open" : ""}`}
                  onClick={() => setMenu(!menu)}
                >
                  <span />
                </button>
                {menu && (
                  <>
                    <button
                      className="menu-dismiss"
                      aria-label="Chiudi menu"
                      onClick={() => setMenu(false)}
                    />
                    <motion.div
                      className="settings-menu"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p>IMPOSTAZIONI</p>
                      <button
                        onClick={() => {
                          setMenu(false);
                          setLicenses(true);
                        }}
                      >
                        <FileText size={17} />
                        Gestione licenze
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setTheme(theme === "light" ? "dark" : "light");
                          setMenu(false);
                        }}
                      >
                        {theme === "light" ? (
                          <Moon size={17} />
                        ) : (
                          <Sun size={17} />
                        )}
                        Tema B/W
                        <span className="menu-value">
                          {theme === "light" ? "Nero" : "Bianco"}
                        </span>
                      </button>
                      <button onClick={system} disabled={!!busy}>
                        <Monitor size={17} />
                        Tutti i font del PC
                        <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>
        <AnimatePresence mode="wait">
          {restoring ? (
            <motion.main
              key="restore"
              className="restore-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <LoaderCircle className="spin" size={24} />
              <p>Ripristino del workspace…</p>
            </motion.main>
          ) : screen === "ingest" ? (
            <motion.main
              key="ingest"
              className="ingest"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="ingest-tiles">
                <motion.button
                  whileTap={{ scale: 0.988 }}
                  className="ingest-tile folder-tile"
                  onClick={folder}
                  disabled={!!busy}
                >
                  <FolderOpen size={48} strokeWidth={1.15} />
                  <h2>
                    SCEGLI
                    <br />
                    CARTELLA
                  </h2>
                  <span>
                    Esplora i font sul tuo computer
                    <ArrowRight size={17} />
                  </span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.988 }}
                  className="ingest-tile upload-tile"
                  onClick={chooseUpload}
                  disabled={!!busy}
                >
                  <ArrowUp
                    className="upload-arrow"
                    size={112}
                    strokeWidth={0.9}
                  />
                  <h2>UPLOAD</h2>
                  <span>Trascina qui i file o clicca per caricarli</span>
                  <small>ZIP · TTF · OTF · WOFF · WOFF2</small>
                </motion.button>
              </div>
              <div className="ingest-footer">
                <span>Tutto in locale. Il tuo spazio, i tuoi font.</span>
                {fonts.length > 0 ? (
                  <button onClick={() => setScreen("workspace")}>
                    Torna al workspace
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button disabled={!!busy} onClick={system}>
                    Tutti i font del PC
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </motion.main>
          ) : (
            <ResizableWorkspace
              key="workspace"
              width={views.sidebarWidth}
              onWidthChange={(sidebarWidth) =>
                setViews((prev) => ({ ...prev, sidebarWidth }))
              }
              sidebar={sidebar}
            >
              <div className="preview-area">
                <div className="workspace-caption">
                  <div>
                    <h1>{active?.family || "Il tuo workspace"}</h1>
                    <span>
                      {currentFolder ||
                        (mode === "system"
                          ? "Tutti i font del PC"
                          : active?.filename) ||
                        "Carica un font per iniziare"}
                    </span>
                  </div>
                  <div className="preview-controls">
                    <PreviewTextControls />
                    <PreviewViewControls
                      view={views.previewLayout}
                      onChange={(previewLayout) =>
                        setViews((prev) => ({ ...prev, previewLayout }))
                      }
                    />
                  </div>
                </div>
                {views.previewLayout === "gallery" ? (
                  <div
                    className="preview-gallery"
                    aria-label="Griglia anteprime font"
                  >
                    {galleryFonts.map((f) => (
                      <FontGalleryCard
                        key={views.groupFamilies ? familyKey(f) : f.id}
                        font={f}
                        active={active?.id === f.id}
                        variants={familyMap.get(familyKey(f)) || [f]}
                        onActivate={(font) => setActiveId(font.id)}
                        onExpand={(font, negative) => {
                          setActiveId(font.id);
                          setSize(88);
                          setFull(negative ? "negative" : "positive");
                        }}
                      />
                    ))}
                    {!fonts.length && (
                      <p className="empty">Nessun font nella cartella.</p>
                    )}
                  </div>
                ) : (
                  <div
                    className={`preview-stack preview-layout-${views.previewLayout}`}
                  >
                    <Preview
                      font={active}
                      variants={activeVariants}
                      onVariantChange={setActiveId}
                      ready={!!active && ready.has(active.id)}
                      onExpand={() => {
                        setSize(88);
                        setFull("positive");
                      }}
                    />
                    <Preview
                      font={active}
                      variants={activeVariants}
                      onVariantChange={setActiveId}
                      ready={!!active && ready.has(active.id)}
                      negative
                      onExpand={() => {
                        setSize(88);
                        setFull("negative");
                      }}
                    />
                  </div>
                )}
                <footer className="workspace-footer">
                  <span>↑ ↓ per esplorare i font</span>
                  <span>
                    Anteprima in memoria · Nessuna installazione necessaria
                  </span>
                </footer>
              </div>
            </ResizableWorkspace>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {drag && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="drop-overlay"
            >
              <ArrowUp size={64} />
              <h2>Lascia spazio ai tuoi font.</h2>
              <p>Rilascia i file per importarli</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {notice && (
            <motion.div
              role="status"
              className="notice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <AlertCircle size={18} />
              <p>{notice}</p>
              <button
                aria-label="Chiudi messaggio"
                className="icon-button"
                onClick={() => setNotice("")}
              >
                <X size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {licenses && (
            <Licenses
              onClose={() => setLicenses(false)}
              views={views}
              onViewsChange={setViews}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {deleteOpen && (
            <Modal
              onClose={() => setDeleteOpen(false)}
              label="Conferma eliminazione"
              className="confirm-modal"
            >
              <div className="dialog-heading">
                <h2>Elimina {selectedFonts.length} font?</h2>
                <button
                  className="icon-button"
                  onClick={() => setDeleteOpen(false)}
                  aria-label="Annulla"
                >
                  <X size={20} />
                </button>
              </div>
              <p>
                {mode === "system"
                  ? "I font selezionati verranno disinstallati dal tuo account."
                  : "I font verranno rimossi dalla cartella selezionata. Per i file caricati via Upload verrà rimossa la copia locale di EasyFonts."}
              </p>
              <p className="muted">
                Una copia dei file viene conservata nella cartella dati di
                EasyFonts. Le licenze restano nell’archivio.
              </p>
              <div className="dialog-actions">
                <button onClick={() => setDeleteOpen(false)}>Annulla</button>
                <button className="danger" onClick={remove}>
                  Elimina {selectedFonts.length} font
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {full && (
            <Modal
              label="Anteprima a schermo intero"
              onClose={() => setFull(null)}
              className="fullscreen"
            >
              <div className="fullscreen-toolbar">
                <div className="full-title">
                  <img
                    className="brand-logo brand-logo-small"
                    src="/assets/easyfonts-logo.png"
                    alt="EasyFonts"
                  />
                  <strong>
                    {full === "fonts"
                      ? `${selectedFonts.length} font a confronto`
                      : active?.name}
                  </strong>
                </div>
                <div className="view-switch">
                  <button
                    className={full === "positive" ? "chosen" : ""}
                    onClick={() => setFull("positive")}
                  >
                    Positivo
                  </button>
                  <button
                    className={full === "negative" ? "chosen" : ""}
                    onClick={() => setFull("negative")}
                  >
                    Negativo
                  </button>
                  <button
                    className={full === "split" ? "chosen" : ""}
                    onClick={() => setFull("split")}
                  >
                    B/W
                  </button>
                  <button
                    disabled={selectedFonts.length < 2}
                    className={full === "fonts" ? "chosen" : ""}
                    onClick={() => setFull("fonts")}
                  >
                    Confronta font
                  </button>
                </div>
                <PreviewTextControls />
                <label className="size-control">
                  <button
                    aria-label="Riduci dimensione"
                    onClick={() => setSize((s) => Math.max(16, s - 4))}
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    aria-label="Dimensione del testo"
                    type="range"
                    min="16"
                    max="200"
                    value={size}
                    onChange={(e) => setSize(+e.target.value)}
                  />
                  <span>
                    {size}
                    <small> px</small>
                  </span>
                  <button
                    aria-label="Aumenta dimensione"
                    onClick={() => setSize((s) => Math.min(200, s + 4))}
                  >
                    <Plus size={15} />
                  </button>
                </label>
                <button
                  onClick={() => setFull(null)}
                  className="icon-button"
                  aria-label="Chiudi schermo intero"
                >
                  <X size={22} />
                </button>
              </div>
              <div
                className={`fullscreen-body ${full === "split" ? "split-view" : ""} ${full === "fonts" ? "font-comparison" : ""}`}
              >
                {full === "fonts" ? (
                  selectedFonts.map((f) => (
                    <FontGalleryCard
                      key={f.id}
                      font={f}
                      variants={familyMap.get(familyKey(f)) || [f]}
                      size={size}
                      expanded
                      active={active?.id === f.id}
                      onActivate={(font) => setActiveId(font.id)}
                    />
                  ))
                ) : (
                  <>
                    {full !== "negative" && (
                      <Preview
                        font={active}
                        variants={activeVariants}
                        onVariantChange={setActiveId}
                        ready={!!active && ready.has(active.id)}
                        size={size}
                        expanded
                      />
                    )}
                    {full !== "positive" && (
                      <Preview
                        font={active}
                        variants={activeVariants}
                        onVariantChange={setActiveId}
                        ready={!!active && ready.has(active.id)}
                        size={size}
                        negative
                        expanded
                      />
                    )}
                  </>
                )}
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </PreviewTextProvider>
  );
}
