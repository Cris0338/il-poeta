const { generateInsult } = require('./generator');

console.log("--- TEST GENERATORE DI POESIA ---\n");

for (let i = 0; i < 10; i++) {
    console.log(`[${i + 1}] ${generateInsult()}`);
}

console.log("\n--- FINE TEST ---");
