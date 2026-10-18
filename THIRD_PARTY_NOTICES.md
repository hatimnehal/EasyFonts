# Componenti e risorse di terze parti

La licenza MIT di EasyFonts copre il codice originale e le risorse grafiche del progetto. Non sostituisce le licenze di font, runtime e dipendenze. I nomi dei rispettivi autori negli avvisi originali devono essere conservati.

## Font di esempio

`sample-fonts-pack.zip` contiene Lato Regular, Lato Bold, Abel Regular e Bangers Regular, provenienti dal [repository Google Fonts](https://github.com/google/fonts). Ogni cartella contiene `LICENSE.txt` con l'avviso di copyright e il testo SIL Open Font License originale; `SOURCES.md` indica le sorgenti. `docs/SAMPLE_FONTS.json` registra dimensioni e SHA-256 dei singoli file pubblici approvati: il controllo repository blocca sostituzioni inattese. Se si rigenera il pack con versioni nuove, verificare prima provenienza e licenze e poi aggiornare il manifest. Sono dati pubblici di prova, non font provenienti da una libreria personale. La OFL, compresi eventuali Reserved Font Names, continua ad applicarsi ai font e alle loro modifiche.

## Dipendenze

Le versioni esatte e le integrità dei pacchetti sono in `package-lock.json`. Gli avvisi originali sono distribuiti nei rispettivi pacchetti npm installati con `npm ci`.

| Componente diretto                                  | Licenza dichiarata dal pacchetto                  |
| --------------------------------------------------- | ------------------------------------------------- |
| React, React DOM, Express, Multer                   | MIT                                               |
| Framer Motion, opentype.js, wawoff2                 | MIT                                               |
| adm-zip                                             | MIT                                               |
| lucide-react                                        | ISC                                               |
| Electron                                            | MIT e avvisi Chromium/Node.js inclusi nel runtime |
| Vite, TypeScript, Tailwind CSS e strumenti di build | Vedere i singoli pacchetti e gli avvisi generati  |

`npm run notices` genera l'inventario e i testi di licenza delle dipendenze npm di produzione in `build/THIRD_PARTY_LICENSES.txt`. La distribuzione li include insieme a `LICENSE` e a questo documento. Il runtime Electron include inoltre `LICENSE.electron.txt` e `LICENSES.chromium.html`; non rimuoverli dai pacchetti. L'inventario generato deve essere aggiornato quando cambia il lockfile. Le dipendenze di sviluppo non sono tutte distribuite nell'eseguibile.
