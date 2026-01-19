# Il Poeta - Bot Discord

Un bot Discord estremamente colto che genera frasi articolate e colorite per deliziare il tuo server.

## Requisiti
- Node.js installato
- Un account Discord

## Installazione

1. **Sposta la cartella**: Se non l'hai già fatto, sposta questa cartella `il_poeta` sul tuo Desktop (o dove preferisci).
2. **Apri il terminale**: Entra nella cartella del progetto.
3. **Installa le dipendenze**:
   ```bash
   npm install
   ```

## Configurazione Discord

1. Vai sul [Discord Developer Portal](https://discord.com/developers/applications).
2. Clicca su **New Application** e dagli un nome (es. "Il Poeta").
3. Vai nella sezione **Bot** (menu a sinistra) e clicca **Add Bot**.
4. **IMPORTANTE**: Scorri giù fino a **Privileged Gateway Intents** e ATTIVA:
   - **Message Content Intent** (Fondamentale per leggere i comandi!)
   - **Server Members Intent** (Opzionale, ma consigliato)
5. Clicca **Reset Token** per generare il token segreto. COPIALO.
6. Torna nella cartella del progetto:
   - Rinomina il file `.env.example` in `.env`
   - Apri `.env` con un editor di testo
   - Incolla il token: `DISCORD_TOKEN=il_tuo_token_segreto_qui`

## Invita il Bot

1. Nel Developer Portal, vai su **Oauth2** -> **URL Generator**.
2. Spunta **bot**.
3. Sotto **Bot Permissions**, spunta:
   - Send Messages
   - Read Message History
4. Copia l'URL generato in basso e incollalo nel browser per invitare il bot nel tuo server.

## Avvio

Per avviare il bot:
```bash
node index.js
```

## Uso

Il bot risponde se:
- Viene menzionato (es. `@Il Poeta`)
- Scrivi `!poesia`
- Scrivi `!bestemmia`

## Personalizzazione

Vuoi aggiungere nuove perle?
Apri il file `vocab.json` e aggiungi parole alle liste.
