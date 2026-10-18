# Security policy

La versione attualmente mantenuta è la serie 1.1.x. EasyFonts modifica file di font locali: usare una copia di recupero prima di provare modifiche alla logica di installazione o rimozione.

## Segnalare una vulnerabilità

Nella repository pubblicata usare **Security → Report a vulnerability**, quando abilitato. Non pubblicare in una issue token, dati della libreria, percorsi personali, font di clienti o dettagli che consentano di sfruttare una vulnerabilità ancora aperta. Se il canale privato non è disponibile, aprire soltanto una richiesta generica di attivazione del canale, senza dettagli tecnici sensibili. Non è previsto un programma di ricompense.

## Confini di sicurezza

- Backend solo su loopback, verifica di host e origine e token richiesto per le mutazioni.
- Renderer Electron con sandbox, context isolation e Node integration disattivata.
- Limiti sugli upload e sugli ZIP, controllo dei percorsi e file spazzatura ignorati.
- Font essenziali protetti nel backend; rimozione dei font installati limitata alla cartella utente.
- Copie recuperabili prima delle rimozioni. La whitelist non sostituisce un backup.

I file font e gli archivi sono input non fidati; mantenere aggiornate le dipendenze. Non esporre il server su rete pubblica. I documenti di licenza sono consultabili, ma la classificazione automatica del testo non stabilisce i diritti di utilizzo.
