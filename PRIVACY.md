# Privacy

EasyFonts non richiede account, chiavi API o servizi cloud. Non implementa telemetria, analytics, pubblicità o invio automatico di segnalazioni. La finestra Electron comunica con un backend sul loopback del computer, con porta assegnata a ogni avvio e token di sessione generato in memoria.

## Dati locali

L'app conserva copie dei font, documenti di licenza, metadati, percorsi originali, ultima cartella, preferenze e testi di anteprima. Queste informazioni possono identificare l'utente o i suoi progetti: rimangono sul computer e **non fanno parte del codice pubblicato**.

- Desktop Windows: `%APPDATA%\EasyFonts\library`.
- Altri sistemi: sottocartella `library` del percorso `userData` scelto da Electron.
- Modalità web di sviluppo: `.easyfonts/`, oppure la cartella indicata da `EASYFONTS_DATA`.

Il cestino `trash/` conserva copie recuperabili e il percorso originale. I dati non sono cifrati: si applicano i permessi dell'account locale. Per cancellarli definitivamente chiudi l'app e rimuovi la relativa cartella dati; questo non disinstalla i font già copiati nel sistema.

## Connessioni

L'uso ordinario non richiede internet. `npm ci` scarica dipendenze e il runtime Electron; `npm run sample` scarica font e licenze pubblici da Google Fonts su GitHub. Il controllo opzionale Gitleaks scarica soltanto il proprio eseguibile ufficiale: analizza i sorgenti in locale e non li carica online. Le GitHub Actions, dopo la pubblicazione, eseguono il codice sui runner GitHub e mostrano log di test con dati temporanei.

## Repository e segnalazioni

Non allegare database, preferenze, dump, log integrali, font commerciali, percorsi personali o screenshot con informazioni di clienti. Usa il sample pack incluso per riprodurre problemi. Le attribuzioni originali degli autori dei font e delle dipendenze sono conservate per rispettarne le licenze: non sono dati dell'utente di EasyFonts.

Il controllo `npm run check:repo` cerca identità locali, percorsi personali, credenziali note e file non pubblicabili; non costituisce una garanzia contro ogni possibile informazione identificativa. Account GitHub, messaggi, firme e metadati dei commit sono pubblici e richiedono una scelta separata dell'identità di pubblicazione. Vedi [preparazione del rilascio](docs/RELEASING.md).
