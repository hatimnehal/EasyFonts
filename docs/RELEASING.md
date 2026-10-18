# Preparazione e pubblicazione

I sorgenti sono preparati per GitHub. Questi script non creano repository remote, non eseguono push e non pubblicano release.

## Identità pubblica

Usare un account GitHub scelto consapevolmente. Il profilo, il proprietario della repository e le attività possono collegare il progetto ad altre identità anche quando il codice non contiene dati personali. Nei commit iniziali è prevista l'attribuzione neutra `EasyFonts contributors` con indirizzo non recapitabile `contributors@easyfonts.invalid`. Non viene usato il nome globale di Git. Non attribuisce commit a un account GitHub verificato.

Prima di ogni commit controllare l'identità effettiva con `git var GIT_AUTHOR_IDENT` e `git var GIT_COMMITTER_IDENT`, anche in presenza di variabili d'ambiente che possono prevalere sulla configurazione locale. Non copiare l'output in una issue. Evitare firme con identità personali se non desiderate. La licenza usa soltanto il nome collettivo del progetto.

## Verifica locale

```sh
npm ci
npm run notices
npm run check:repo
npm run check:secrets
npm run build
npm test
npm run test:desktop
npm audit --omit=dev --audit-level=moderate
```

`check:repo` richiede Git inizializzato e controlla file tracciati e nuovi non ignorati. Blocca dati applicativi, font privati, eseguibili, archivi inattesi, credenziali note, percorsi home, identità della macchina corrente e metadati testuali PNG. Le immagini ammesse sono una lista esplicita: controllare anche visivamente che non mostrino dati privati. Il sample ZIP accetta soltanto quattro font noti e i loro documenti di licenza. Gitleaks integra la ricerca con le sue regole per segreti e archivi; `npm run check:secrets -- --history` controlla anche la cronologia dopo il primo commit. Nessuno dei controlli certifica l'assenza assoluta di dati identificativi.

Controllare anche `git diff --cached --stat` e il contenuto staged prima del commit. La CI verifica build, API, UI desktop e controlli sicurezza su Windows; il primo risultato GitHub sarà disponibile solo dopo il push.

## File da distribuire

```sh
npm run dist
node scripts/verify-package.mjs
```

La distribuzione Windows x64 è `release/EasyFonts.exe`. Il codice e i font utente vengono tenuti separati tramite una lista esplicita dei file di packaging. La cartella `release/` è ignorata da Git: l'eseguibile va eventualmente allegato a una GitHub Release, insieme a `sample-fonts-pack.zip`, ai documenti di licenza generati e a un checksum SHA-256, mai al normale commit dei sorgenti. Non includere `release/previous/`.

La build Windows attuale non è firmata digitalmente. Non descriverla come firmata o verificata da Microsoft. macOS e Linux hanno codice dedicato alle directory dei font, ma questa versione non è stata certificata o impacchettata su quei sistemi. Per il rilascio controllare anche l'audit completo delle dipendenze di sviluppo, oltre a quello di produzione, e valutare gli avvisi rimasti.

Al controllo del 18 ottobre 2026: zero vulnerabilità segnalate nelle dipendenze di produzione; otto avvisi moderati nella catena di sviluppo/packaging Electron (`sprintf-js`, `roarr`, `global-agent` e dipendenze a monte). Nessun avviso alto o critico. Non è stata forzata una retrocessione del builder per rimuovere gli avvisi. L'audit è uno stato puntuale, da ripetere prima di ogni release.

## Impostazioni GitHub da completare dopo la creazione

- Descrizione proposta: “A local desktop font manager for graphic designers and creatives: preview, compare, install and keep font licenses together.”
- Topic proposti: `fonts`, `font-manager`, `graphic-design`, `typography`, `electron`, `react`, `typescript`, `open-source`.
- Abilitare private vulnerability reporting, secret scanning e push protection dove disponibili.
- Proteggere `main` e richiedere il job Windows checks quando il piano GitHub lo consente.
- Pubblicare la versione 1.1.0 solo dopo il controllo finale di eseguibile, licenze e checksum.

Il README presenta il prodotto e le sue funzioni. L'eventuale racconto del processo di sviluppo e del portfolio appartiene al profilo o a un case study separato.
