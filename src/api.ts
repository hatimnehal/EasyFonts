import type { FontItem } from "./types";
let sessionToken = "";
export async function api<T>(
  route: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  try {
    if (!sessionToken) {
      const r = await fetch("/api/session");
      if (!r.ok)
        throw Error(
          "Il servizio locale non è disponibile. Chiudi e riapri EasyFonts.",
        );
      sessionToken = (await r.json()).token;
    }
    const response = await fetch("/api" + route, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "X-EasyFonts-Token": sessionToken,
        ...(body instanceof FormData
          ? {}
          : body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
    if (response.status === 403 && retry) {
      sessionToken = "";
      return api<T>(route, body, false);
    }
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw Error(
        "Risposta del servizio locale non valida. Chiudi e riapri EasyFonts.",
      );
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "Operazione non riuscita");
    return result;
  } catch (error) {
    if (error instanceof TypeError)
      throw Error(
        "Impossibile raggiungere il servizio locale di EasyFonts. Chiudi e riapri l’app.",
      );
    throw error;
  }
}
const loaded = new Map<string, Promise<void>>();
export function loadFont(font: FontItem) {
  if (!loaded.has(font.id))
    loaded.set(
      font.id,
      (async () => {
        const face = new FontFace(`ef-${font.id}`, `url("${font.url}")`);
        await face.load();
        document.fonts.add(face);
      })().catch((e) => {
        loaded.delete(font.id);
        throw e;
      }),
    );
  return loaded.get(font.id)!;
}
