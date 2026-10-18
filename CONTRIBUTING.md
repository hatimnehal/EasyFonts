# Contribuire a EasyFonts

L'obiettivo è rendere più semplice il lavoro quotidiano con i font per designer e creativi. Prima di ampliare lo scope, discutere il problema in una issue. Per le vulnerabilità seguire [SECURITY.md](SECURITY.md).

## Sviluppo

Usare Node.js 24 LTS, Git e Windows per i test desktop completi.

```sh
npm ci
npm run dev
```

Prima di una pull request:

```sh
npm run check:repo
npm run build
npm test
npm run test:desktop
npm run check:secrets
```

L'ultimo comando scarica Gitleaks verificando SHA-256 ed esegue una scansione locale dei soli file candidati alla repository. I test usano directory temporanee e non installano né disinstallano font reali. Per modifiche a installazione/rimozione documentare anche il test manuale con font OFL non essenziali.

## Dati, licenze e commit

- Usare `sample-fonts-pack.zip` come fixture; non aggiungere font personali o commerciali.
- Non includere `.easyfonts/`, database, `.env`, chiavi, log o dati di clienti.
- Negli esempi usare percorsi relativi o variabili standard, senza nomi utente o del computer.
- I commit conservano nome ed email dell'autore. Configurare consapevolmente l'identità locale e, se desiderato, l'indirizzo noreply associato al proprio account GitHub prima di creare commit.
- Le modifiche al progetto sono rilasciate sotto la [licenza MIT](LICENSE). Conservare gli avvisi delle dipendenze e le licenze dei font.

Le pull request devono spiegare il problema, il comportamento risultante e le verifiche eseguite. Screenshot e log devono contenere soltanto dati pubblici di esempio.
