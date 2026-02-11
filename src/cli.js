const { readGames, getTopMatches, normalizeSet } = require('./sorter');

function printTopMatches(games, count) {
    console.log(`\nTop ${count} matches:`);
    for (let i = 0; i < Math.min(count, games.length); i++) {
        const game = games[i];
        const affinity = game.affinity || 0;
        const name = game.nome.padEnd(40);
        console.log(`${String(i + 1).padStart(2)}. ${name} (${affinity}%)`);
    }
}

try {
    const games = readGames("../resources/games.json");
    
    const preferences = normalizeSet(['RPG', 'PC', 'Adventure']);
    
    const topMatches = getTopMatches(games, preferences, 10);
    printTopMatches(topMatches, 10);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}