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
        // Fallback minimale per evitare crash
        vocab = {
            soggetti: [{ word: "Dio", gender: "M", number: "S" }],
            aggettivi: [{ M_S: "rotto", F_S: "rotta", M_P: "rotti", F_P: "rotte" }],
            verbi: [{ S: "cade", P: "cadono" }],
            complementi: ["nel vuoto"],
            oggetti: ["il nulla"]
        };
    }
}

function loadStats() {
    try {
        if (fs.existsSync(STATS_PATH)) {
            const data = fs.readFileSync(STATS_PATH, 'utf8');
            stats = JSON.parse(data);
        } else {
            stats = { template_weights: {} };
        }
    } catch (err) {
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
    if (newWeight < 1) newWeight = 1;
    stats.template_weights[templateId] = newWeight;
    saveStats();
}

function getRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// === Grammar Helpers ===

function getSubject() {
    return getRandom(vocab.soggetti);
}

function getAdjective(subject) {
    const adj = getRandom(vocab.aggettivi);
    if (!adj) return "";
    
    const key = `${subject.gender}_${subject.number}`; // es. "M_S", "F_P"
    return adj[key] || adj["M_S"] || "indefinito"; // Fallback
}

function getVerb(subject) {
    const v = getRandom(vocab.verbi);
    if (!v) return "";
    
    return v[subject.number] || v["S"]; // "S" or "P"
}

function getObject() {
    return getRandom(vocab.oggetti);
}

function getComplement() {
    return getRandom(vocab.complementi);
}

// === Templates ===

const templates = [
    // 1. Semplice: S + Adj
    { 
        id: "simple_1", 
        fn: (target) => {
            const s = getSubject();
            return `${s.word} ${getAdjective(s)}`;
        }
    },
    // 2. Classico: S + Adj + che + V + Compl
    { 
        id: "classic_rel", 
        fn: (target) => {
            const s = getSubject();
            return `${s.word} ${getAdjective(s)} che ${getVerb(s)} ${getComplement()}`;
        }
    },
    // 3. Transitivo: S + V + Obj
    { 
        id: "transitive", 
        fn: (target) => {
            const s = getSubject();
            // Senza "che", è una frase principale: "Dio cane mangia una mela"
            // Ma spesso suona meglio come "Dio cane che mangia..." per le bestemmie.
            // Se vogliamo frase di senso compiuto: "Dio è cane" (ma il vocabolario è strutturato per insulti diretti)
            // Usiamo lo stile "invocazione": "Dio cane che..."
            return `${s.word} ${getAdjective(s)} che ${getVerb(s)} ${getObject()}`;
        }
    },
    // 4. Doppio Aggettivo: S + Adj + e + Adj
    { 
        id: "double_adj", 
        fn: (target) => {
            const s = getSubject();
            return `${s.word} ${getAdjective(s)} e ${getAdjective(s)}`;
        }
    },
    // 5. Complesso: S + Adj + che + V + Compl + e + V + Obj
    { 
        id: "complex_1", 
        fn: (target) => {
            const s = getSubject();
            return `${s.word} ${getAdjective(s)} che ${getVerb(s)} ${getComplement()} e ${getVerb(s)} ${getObject()}`;
        }
    },
    // 6. Targeting Diretto (Se c'è target): Caro Target, S + ...
    {
        id: "targeted_intro",
        reqTarget: true,
        fn: (target) => {
            const s = getSubject();
            return `Ascolta bene ${target}, ${s.word} ${getAdjective(s)} che ${getVerb(s)} ${getComplement()}`;
        }
    },
     // 7. Targeting Integrato: S + Adj + che + V + Target
     {
        id: "targeted_victim",
        reqTarget: true,
        fn: (target) => {
            const s = getSubject();
            // Forziamo verbi transitivi o che hanno senso con oggetto persona?
            // Per ora usiamo verbi generici, potrebbe uscire "Dio cane che esplode Target" (un po' strano)
            // Meglio: "che inseguono" o "che picchiano".
            // Dato che i verbi sono generici, usiamo "contro" o simile se necessario, ma proviamo diretto.
            return `${s.word} ${getAdjective(s)} che ${getVerb(s)} contro ${target}`;
        }
    }
];

function getWeightedRandomTemplate(hasTarget) {
    if (!stats) loadStats();

    // Filtra template in base alla presenza del target
    const availableTemplates = templates.filter(t => {
        if (hasTarget) return true; // Se c'è target, tutto va bene (quelli reqTarget saranno favoriti? No, roulette)
        return !t.reqTarget; // Se non c'è target, escludi quelli che lo richiedono
    });

    let totalWeight = 0;
    const weights = [];

    for (const t of availableTemplates) {
        let w = stats.template_weights[t.id] || 10;
        // Boost per template con target se il target è presente
        if (hasTarget && t.reqTarget) w *= 2; 
        
        weights.push({ id: t.id, weight: w, template: t });
        totalWeight += w;
    }

    let randomValue = Math.random() * totalWeight;
    for (const item of weights) {
        randomValue -= item.weight;
        if (randomValue <= 0) {
            return item.template;
        }
    }
    return availableTemplates[availableTemplates.length - 1];
}

function generateInsult(targetUser) {
    if (!vocab) loadVocab();

    const selectedTemplate = getWeightedRandomTemplate(!!targetUser);
    
    // Se il template richiede target ma non c'è (caso raro, fallback), evito crash
    let text = "";
    try {
        text = selectedTemplate.fn(targetUser || "chiunque");
    } catch (e) {
        console.error("Errore generazione template:", e);
        text = "Errore divino.";
    }

    return {
        text: text,
        templateId: selectedTemplate.id
    };
}

module.exports = { generateInsult, loadVocab, updateWeight };
