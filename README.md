# Spirito

Ovviamente AI slop, una prova per vedere cosa mi faceva al volo.
Il risultato lo trovate qua: https://uran10.altervista.org/spirito

Webapp in PHP con ricettario, selezione della dispensa e amministrazione. Interfaccia in italiano, responsive, stile cartoon con illustrazioni CSS. Nessuna dipendenza Composer o JavaScript da installare.

## Avvio

Richiede PHP 8.1 o successivo con estensioni **PDO SQLite** e **mbstring**.

Da questa cartella:

```sh
php -S 127.0.0.1:8080 -t .
```

Apri http://127.0.0.1:8080. L'ambiente in cui è stato creato il progetto non ha PHP installato: installalo prima di eseguire questo comando.

Al primo avvio vengono inserite otto ricette e quindici ingredienti. Nella sezione **Amministrazione** scegli una password di almeno 12 caratteri. Effettua questa configurazione in locale prima di esporre il sito online: il primo visitatore dell'area amministrativa può configurare l'accesso finché non esiste una password.

## Dati e hosting

SQLite viene creato automaticamente in `../drinks-private/drinks.sqlite`, fuori dalla cartella pubblica. Il processo PHP deve poter scrivere in quella directory. Puoi impostare `DRINKS_DATA_DIR` per scegliere un'altra cartella privata, sempre esterna alla document root. Per il backup copia questo database a sito fermo.

Su hosting PHP carica i file dell'app nella document root, configura la directory dati privata scrivibile e abilita HTTPS. Il server integrato PHP è destinato allo sviluppo. Sites non supporta il runtime PHP: questa applicazione richiede un hosting PHP, per esempio Apache o Nginx con PHP-FPM.

L'amministratore può aggiungere alcolici, liquori, mixer, altri ingredienti e ricette con quantità, bicchiere e preparazione; può eliminare ricette. Password con hash, query parametrizzate, token CSRF e sessione amministrativa proteggono le operazioni di scrittura. Per ripristinare l'accesso dimenticato, il proprietario del server può rimuovere la riga `password` dalla tabella `settings` del database e riconfigurare immediatamente l'accesso in locale.

La selezione della dispensa è salvata nel browser. Un drink è preparabile quando tutti i suoi ingredienti sono selezionati. “Manca poco” mostra ricette con uno o due ingredienti mancanti; ghiaccio e guarnizioni facoltative non bloccano il risultato. Le quantità sono per una persona, senza gestione delle scorte.

I font Google sono facoltativi: in assenza di rete il browser usa i font di sistema.
