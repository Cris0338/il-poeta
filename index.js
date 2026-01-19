require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { generateInsult, updateWeight } = require('./generator');

// Inizializza il client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction] // Necessario per leggere reazioni su vecchi messaggi se serve, ma buona pratica
});

// Cache per mappare MessageID -> TemplateID
// In produzione si userebbe Redis, qui basta una Map in memoria con cleanup
const messageTemplateMap = new Map();

// Pulisci la mappa ogni ora per evitare memory leak
setInterval(() => {
    messageTemplateMap.clear();
    console.log("Cache messaggi pulita.");
}, 3600000);

client.once('ready', () => {
    console.log(`Bot online come ${client.user.tag}!`);
    console.log(`Pronto a diffondere il verbo (e ad imparare).`);
});

client.on('messageCreate', async message => {
    // Ignora i messaggi inviati dai bot
    if (message.author.bot) return;

    // Trigger: Menzioni al bot, oppure comandi specifici
    const isMentioned = message.mentions.has(client.user);
    const content = message.content.toLowerCase();
    const triggers = ['!poesia', '!bestemmia', '!insulto', '!verbo', '!amen'];

    if (isMentioned || triggers.some(t => content.includes(t))) {
        // Genera la frase
        const insultData = generateInsult(); // Ritorna { text, templateId }

        try {
            const sentMessage = await message.reply(insultData.text);

            // Salva l'associazione
            messageTemplateMap.set(sentMessage.id, insultData.templateId);

            console.log(`[${new Date().toLocaleTimeString()}] Risposto a ${message.author.tag}: ${insultData.text} [TID: ${insultData.templateId}]`);
        } catch (error) {
            console.error("Errore nell'invio del messaggio:", error);
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    // Ignora le reazioni del bot stesso
    if (user.id === client.user.id) return;

    // Se la reazione è parziale (su messaggi vecchi), fetchala
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    const messageId = reaction.message.id;
    const templateId = messageTemplateMap.get(messageId);

    // Se non sappiamo quale template ha generato questo messaggio, ignoriamo
    if (!templateId) return;

    const emoji = reaction.emoji.name;
    let delta = 0;

    // Reazioni positive
    if (['😂', '🤣', '🔥', '⭐', '👍'].includes(emoji)) {
        delta = 1;
    }
    // Reazioni negative
    else if (['👎', '💩', '😐', '😠'].includes(emoji)) {
        delta = -1;
    }

    if (delta !== 0) {
        updateWeight(templateId, delta);
        console.log(`Reazione ${emoji} da ${user.tag} -> Template ${templateId} aggiornato di ${delta}`);
    }
});

// Gestione errori globale per evitare crash
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login
if (!process.env.DISCORD_TOKEN) {
    console.error("ERRORE: Token Discord mancante. Crea un file .env con DISCORD_TOKEN=vostro_token");
} else {
    client.login(process.env.DISCORD_TOKEN);
}
