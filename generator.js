const fs = require('fs');
const path = require('path');

let vocab = null;
let stats = null;
const STATS_PATH = path.join(__dirname, 'stats.json');

function loadVocab() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'vocab.json'), 'utf8');
        vocab = JSON.parse(data);
    } catch (err) {
        console.error("Errore caricamento vocabolario:", err);
        vocab = {
            soggetti: ["Dio"],
            aggettivi: ["scordato"],
            verbi: ["che tace"],
            complementi: ["nel vuoto"],
            oggetti: ["nulla"]
        };
    }
}

function loadStats() {
    try {
        if (fs.existsSync(STATS_PATH)) {
            const data = fs.readFileSync(STATS_PATH, 'utf8');
            stats = JSON.parse(data);
        } else {
            console.log("Stats file non trovato, uso default.");
            stats = { template_weights: {} };
        }
    } catch (err) {
        console.error("Errore caricamento stats:", err);
        stats = { template_weights: {} };
    }
}

function saveStats() {
    try {
        fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 4), 'utf8');
    } catch (err) {
        console.error("Errore salvataggio stats:", err);
    }
}

function updateWeight(templateId, delta) {
    if (!stats) loadStats();

    const currentWeight = stats.template_weights[templateId] || 10;
    let newWeight = currentWeight + delta;
    if (newWeight < 1) newWeight = 1; // Minimo peso 1

    stats.template_weights[templateId] = newWeight;
    console.log(`Aggiornato peso template ${templateId}: ${currentWeight} -> ${newWeight}`);
    saveStats();
}

function getRandom(arr) {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

// Struttura dati template con ID
const templates = [
    { id: "1", fn: () => `${getRandom(vocab.soggetti)} ${getRandom(vocab.aggettivi)}` },
    { id: "2", fn: () => `${getRandom(vocab.soggetti)} ${getRandom(vocab.aggettivi)} ${getRandom(vocab.verbi)} ${getRandom(vocab.complementi)}` },
    { id: "3", fn: () => `${getRandom(vocab.soggetti)} ${getRandom(vocab.aggettivi)} con ${getRandom(vocab.oggetti)}` },
    { id: "4", fn: () => `${getRandom(vocab.soggetti)} ${getRandom(vocab.aggettivi)} ${getRandom(vocab.aggettivi)}` },
    { id: "5", fn: () => `${getRandom(vocab.soggetti)} ${getRandom(vocab.verbi)} ${getRandom(vocab.oggetti)}` },
    { id: "6", fn: () => `${getRandom(vocab.soggetti)} ${getRandom(vocab.aggettivi)} ${getRandom(vocab.complementi)}` }
];

function getWeightedRandomTemplate() {
    if (!stats) loadStats();

    // Calcola il peso totale
    let totalWeight = 0;
    const weights = [];

    for (const t of templates) {
        const w = stats.template_weights[t.id] || 10; // Default peso 10
        weights.push({ id: t.id, weight: w, template: t });
        totalWeight += w;
    }

    // Roulette selection
    let randomValue = Math.random() * totalWeight;
    for (const item of weights) {
        randomValue -= item.weight;
        if (randomValue <= 0) {
            return item.template;
        }
    }
    return templates[templates.length - 1]; // Fallback
}

function generateInsult() {
    if (!vocab) loadVocab();

    const selectedTemplate = getWeightedRandomTemplate();
    const text = selectedTemplate.fn();

    return {
        text: text,
        templateId: selectedTemplate.id
    };
}

module.exports = { generateInsult, loadVocab, updateWeight };
