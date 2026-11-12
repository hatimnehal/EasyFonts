import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Link2, Unlink2 } from "lucide-react";
import type { FontItem } from "./types";

type SavedText = {
  editAllPreviews?: boolean;
  globalPreviewText?: string | null;
  previewTexts?: Record<string, string>;
  text?: string;
};
export class PreviewTextStore {
  private all = false;
  private shared: string | null = null;
  private drafts: Record<string, string> = {};
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    for (const listener of this.listeners) listener();
  }
  editingAll = () => this.all;
  setEditingAll = (all: boolean) => {
    this.all = all;
    this.emit();
  };
  textFor(font: FontItem | undefined, negative: boolean) {
    if (!font) return "";
    return (
      (this.all && this.shared !== null
        ? this.shared
        : this.drafts[`${font.id}:${negative ? "negative" : "positive"}`]) ??
      font.name
    );
  }
  edit(font: FontItem | undefined, negative: boolean, text: string) {
    if (!font) return;
    if (this.all) this.shared = text;
    else this.drafts[`${font.id}:${negative ? "negative" : "positive"}`] = text;
    this.emit();
  }
  applyPreset(text: string, font?: FontItem) {
    if (this.all) {
      this.shared = text;
    } else if (font) {
      if (text === font.name) {
        delete this.drafts[`${font.id}:positive`];
        delete this.drafts[`${font.id}:negative`];
      } else {
        this.drafts[`${font.id}:positive`] = text;
        this.drafts[`${font.id}:negative`] = text;
      }
    }
    this.emit();
  }
  appendGlyph(glyph: string, font?: FontItem) {
    if (!font) return;
    if (this.all) {
      this.shared = (this.shared ?? font.name) + glyph;
    } else {
      const pos = this.drafts[`${font.id}:positive`] ?? font.name;
      const neg = this.drafts[`${font.id}:negative`] ?? font.name;
      this.drafts[`${font.id}:positive`] = pos + glyph;
      this.drafts[`${font.id}:negative`] = neg + glyph;
    }
    this.emit();
  }
  hydrate(saved: SavedText) {
    this.all = saved.editAllPreviews ?? false;
    this.shared = saved.globalPreviewText ?? null;
    this.drafts = saved.previewTexts || {};
    if (
      saved.editAllPreviews === undefined &&
      saved.text &&
      saved.text !== "La forma delle parole."
    ) {
      this.shared = saved.text;
      this.all = true;
    }
    this.emit();
  }
  saved() {
    return {
      editAllPreviews: this.all,
      globalPreviewText: this.shared,
      previewTexts: this.drafts,
    };
  }
}
const Context = createContext<PreviewTextStore | null>(null);
export function PreviewTextProvider({
  store,
  children,
}: {
  store: PreviewTextStore;
  children: ReactNode;
}) {
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePreviewTextStore() {
  const store = useContext(Context);
  if (!store) throw Error("PreviewTextProvider mancante");
  return store;
}
export function useSpecimenText(font: FontItem | undefined, negative: boolean) {
  const store = usePreviewTextStore();
  const text = useSyncExternalStore(store.subscribe, () =>
    store.textFor(font, negative),
  );
  return { text, setText: (text: string) => store.edit(font, negative, text) };
}
export function PreviewTextControls() {
  const store = usePreviewTextStore(),
    all = useSyncExternalStore(store.subscribe, store.editingAll);
  return (
    <button
      className="edit-all-toggle"
      title="Applica il testo digitato a tutte le preview, oppure modifica soltanto quella in cui scrivi"
      aria-label="Modifica tutte le preview"
      aria-pressed={all}
      onClick={() => store.setEditingAll(!all)}
    >
      {all ? <Link2 size={15} /> : <Unlink2 size={15} />}
      <span>Modifica tutte</span>
    </button>
  );
}
