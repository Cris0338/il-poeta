const { generateInsult, updateWeight } = require('./generator');
const fs = require('fs');
const path = require('path');

const STATS_PATH = path.join(__dirname, 'stats.json');

console.log("=== TEST INTEGRAZIONE IL POETA V2 ===");

// 1. Test Generazione
console.log("\n1. Test Generazione...");
const result = generateInsult();
console.log("Output:", result);

if (typeof result !== 'object' || !result.text || !result.templateId) {
    console.error("ERRORE: Output non valido!");
    process.exit(1);
}
console.log("SUCCESS: Struttura output corretta.");

// 2. Test Aggiornamento Peso
console.log("\n2. Test Aggiornamento Peso...");
const tid = "1";
// Leggi peso attuale
let stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
const oldWeight = stats.template_weights[tid] || 10;
console.log(`Peso iniziale Template ${tid}: ${oldWeight}`);

// Simula reazione positiva
updateWeight(tid, 1);

stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
const newWeight = stats.template_weights[tid];
console.log(`Peso dopo update Template ${tid}: ${newWeight}`);

if (newWeight === oldWeight + 1) {
    console.log("SUCCESS: Peso aggiornato correttamente.");
} else {
    console.error(`ERRORE: Peso atteso ${oldWeight + 1}, ottenuto ${newWeight}`);
    process.exit(1);
}

// Reset peso per pulizia
updateWeight(tid, -1);
console.log("Reset peso effettuato.");

console.log("\n=== TUTTI I TEST PASSATI ===");
