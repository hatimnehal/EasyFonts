# EasyFonts 1.1

Applicazione desktop Electron per provare, installare e organizzare font e licenze. React, TypeScript, Vite, Tailwind CSS, Framer Motion e backend Node/Express integrato nella finestra nativa. Nessuna funzione AI o servizio remoto nell’app.

## Avvio

**Windows:** apri `release/EasyFonts.exe` con un doppio clic. È un’app portabile: non richiede Node.js, npm, l’apertura del browser o l’avvio manuale di servizi. Il pacchetto di prova si trova anche in `release/sample-fonts-pack.zip`. Le build precedenti rimangono recuperabili in `release/previous`; i file tecnici della compilazione sono in `.desktop-build`.

Per avviare dai sorgenti, usare Node.js 24 LTS e dalla cartella del progetto:

```sh
npm ci
npm run dev
```

Il comando compila la UI e apre la finestra desktop. Dopo una build già eseguita puoi usare `npm start`. `npm run dist` genera l’eseguibile Windows nella cartella `release`. Il backend è gestito dal processo principale e si chiude con l’app; utilizza un canale loopback interno su porta assegnata automaticamente, senza indirizzi da aprire o porte fisse da configurare.

La modalità web resta disponibile per sviluppo con `npm run dev:web`, su `http://127.0.0.1:5173`; non serve per utilizzare l’eseguibile.

## Uso

- **Scegli cartella** apre il selettore nativo di Electron, associato alla finestra dell’app, e analizza ricorsivamente font, ZIP e licenze. Non utilizza PowerShell o finestre esterne per scegliere la cartella.
- **Upload** accetta ZIP, TTF, OTF, WOFF e WOFF2, anche tramite trascinamento. Trascina `sample-fonts-pack.zip` per provare quattro TTF open source reali: Lato Regular, Lato Bold, Abel e Bangers, con le rispettive licenze originali SIL OFL.
- Un clic sul nome attiva il font. Le frecce ↑/↓ navigano nella lista; i checkbox effettuano la selezione multipla.
- Il divisore tra lista e preview si trascina orizzontalmente. Supporta anche ←/→ da tastiera e doppio clic per tornare alla larghezza iniziale.
- Lista e archivio licenze offrono elenco, vista compatta e griglia. Le card mostrano una preview reale, il nome sotto e i controlli. Il pulsante con la lettera attiva i nomi scritti nel rispettivo font; i font visibili vengono caricati progressivamente tramite FontFace, senza installarli.
- **Seleziona tutti** seleziona o deseleziona tutti i font della lista, escludendo quelli protetti. La selezione parziale ha un indicatore dedicato.
- **Raggruppa famiglie** compatta Regular, Bold, Italic e altri stili in una famiglia espandibile. Le famiglie sono riconosciute dai metadati tipografici del font (con fallback sui nomi legacy), non dai nomi dei file. Puoi scegliere una variante, selezionarla singolarmente o selezionare l’intera famiglia. I file e le loro licenze rimangono distinti.
- Le preview supportano disposizione impilata, affiancata e griglia di tutti i font. Con il raggruppamento attivo la griglia mostra una card per famiglia. Il selettore di variante funziona anche nelle preview, nelle card e a schermo intero.
- Ogni preview non modificata mostra il nome del proprio font. Di base il testo è indipendente per font e tono positivo/negativo; il toggle **Modifica tutte** permette di condividere il testo digitato tra tutte le preview. Disattivandolo ritrovi i testi individuali. La scrittura aggiorna soltanto i componenti interessati.
- Le icone in basso a sinistra aprono l’anteprima a schermo intero: positivo, negativo, B/W e confronto dei font selezionati. Sono disponibili dimensione del testo ed Esc per uscire.
- **G** installa i selezionati, **V** installa tutto, **R** apre la conferma di eliminazione. Le scorciatoie non agiscono durante la scrittura o nei dialoghi.
- Il punto in alto a destra apre **Gestione licenze**, **Tema B/W**, **Tutti i font del PC**.
- Dopo il primo utilizzo l’app riapre direttamente l’ultima cartella o lista. Le cartelle vengono rilette senza riaprire il selettore; se una cartella è stata spostata o non è disponibile, mostra le copie salvate e un avviso. Vengono ripristinati anche larghezza del divisore, viste, raggruppamento, nomi tipografici, font attivo, tema e testi personalizzati. Una cartella vuota resta un workspace vuoto valido.
- L’icona dell’app e dell’eseguibile è disponibile in ICO multirisoluzione. Il logo interno conserva il PNG trasparente originale: nel tema scuro viene invertito da nero a bianco via CSS, mantenendo l’alpha.

## File e installazione

Nell’app Windows i dati vengono salvati in `%APPDATA%\EasyFonts\library`: `database.json`, copie dei font, licenze originali e `trash/`. Le licenze restano disponibili anche dopo la rimozione di un font. Per un backup copia tutta la cartella `library` ad app chiusa. I dati non escono dal computer e non sono salvati nella cartella temporanea dell’eseguibile portabile. In modalità web rimangono in `.easyfonts/`; l’avvio desktop dai sorgenti migra automaticamente un eventuale database della prima versione, conservandone l’originale.

`workspace.json` conserva separatamente preferenze e ultima cartella/lista. La persistenza non dipende dalla porta interna dell’app. I testi si salvano dopo una breve pausa nella digitazione.

Su Windows i font sono copiati in `%LOCALAPPDATA%\Microsoft\Windows\Fonts`, registrati nel registro **HKCU** e notificati alle applicazioni tramite le API GDI e WM_FONTCHANGE. Su macOS sono copiati in `~/Library/Fonts`; su Linux in `~/.local/share/fonts`, aggiornando fontconfig. Le applicazioni che mantengono una propria cache possono richiedere un riavvio. WOFF e WOFF2 vengono convertiti nel contenitore TTF/OTF prima dell’installazione; il file originale rimane nella libreria.

**Tutti i font del PC** legge anche le cartelle globali del sistema, ma la pulizia è consentita solo nella cartella font dell’utente. I file nelle directory gestite dal sistema operativo e i font essenziali della whitelist (Arial, Segoe UI, Tahoma, San Francisco e altre famiglie di sistema) hanno un lucchetto e sono protetti anche nel backend. I font in collezioni TTC/OTC non sono gestiti nella v1.1.

**Elimina** richiede conferma. Nella modalità cartella rimuove il file originale selezionato; per gli upload rimuove la copia di EasyFonts e conserva il file scaricato originale. I font estratti da ZIP vengono rimossi dalla libreria, senza riscrivere lo ZIP. In modalità PC disinstalla il font dell’utente. Prima della rimozione salva una copia nella sottocartella `trash` dei dati dell’app, con un file JSON che indica il percorso originale. Il messaggio di conferma mostra il percorso di recupero effettivo. Per recuperare un font trascina questa copia nell’app e installala; per ripristinare un file di una cartella copialo nel percorso indicato dal JSON.

## Licenze

Il backend salva i documenti TXT, MD, PDF, LICENSE, OFL e README insieme ai metadati interni del font. Associa le licenze dalla cartella del font e dai suoi antenati nello ZIP o nella cartella scelta; archivi differenti sono analizzati separatamente. I PDF originali sono consultabili, ma non vengono convertiti in testo. La categoria commerciale/personale è un’indicazione conservativa derivata dal testo; licenze non riconosciute o presenti solo in PDF risultano **Da verificare**. La consultazione della licenza originale rimane necessaria.

## Verifiche e limiti

```sh
npm run build
npm test
npm run test:desktop
```

I test verificano font reali, conversione WOFF2, whitelist e percorsi, import ZIP via API, persistenza dopo riavvio, archivio licenze, cancellazione con copia di recupero e i nuovi selettori desktop (anche annullamento). Il test Electron usa la UI reale con dati temporanei e selezioni di fixture al posto delle finestre interattive: clic Upload, clic Scegli cartella, drag & drop multipart, caricamento FontFace e modifica del testo sincronizzata. Non installano né disinstallano font del computer durante i test. Il test di installazione effettiva si esegue dall’app con il pacchetto fornito.

Il server ascolta esclusivamente su loopback, controlla host e origine e richiede un token per le modifiche. Gli archivi hanno limiti di dimensione e numero di file, non vengono estratti su percorsi arbitrari e ignorano `__MACOSX`, file nascosti e immagini. Limiti: 80 MB per file, 40 file per upload, 300 MB decompressi per ZIP, 500 MB per cartella. Non modificare manualmente il database durante l’esecuzione e non avviare più backend sulla stessa cartella dati.

Per rigenerare il pacchetto di esempio, con connessione internet: `npm run sample`. Scarica esclusivamente i quattro font e le licenze dal repository ufficiale Google Fonts; l’uso quotidiano dell’app è offline.
