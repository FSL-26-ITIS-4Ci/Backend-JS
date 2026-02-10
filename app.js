const fs = require('fs');
const path = require('path');

function normalizeSet(arr) {
    return new Set(
        Array.from(arr || []).map(item => 
            String(item).toLowerCase().trim()
        )
    );
}

function jaccard(setA, setB) {
    const a = setA || new Set();
    const b = setB || new Set();

    if (a.size === 0 && b.size === 0) return 0.0;

    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);

    if (union.size === 0) return 0.0;

    return intersection.size / union.size;
}

function calculateSimilarity(game, referenceSet) {
    if (!game) return 0;

    const gameSet = new Set([
        ...(game.piattaforme || []),
        ...(game.tag || [])
    ]);

    const jaccardScore = jaccard(gameSet, referenceSet);
    return Math.round(jaccardScore * 100);
}

function sortBySimilarity(games, referenceSet) {
    if (!games || games.length === 0) return games;

    const copy = [...games];

    for (const game of copy) {
        game.affinity = calculateSimilarity(game, referenceSet);
    }

    copy.sort((a, b) => {
        const affinityA = a.affinity || 0;
        const affinityB = b.affinity || 0;
        return affinityB - affinityA;
    });

    return copy;
}

function readGames(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    return data.map(game => ({
        ...game,
        tag: normalizeSet(game.tag),
        piattaforme: normalizeSet(game.piattaforme)
    }));
}

function writeGames(filePath, games) {
    const data = games.map(game => ({
        ...game,
        tag: Array.from(game.tag || []),
        piattaforme: Array.from(game.piattaforme || [])
    }));
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function printTopMatches(games, count) {
    console.log(`\nTop ${count} matches:`);
    for (let i = 0; i < Math.min(count, games.length); i++) {
        const game = games[i];
        const affinity = game.affinity || 0;
        const name = game.nome.padEnd(40);
        console.log(`${String(i + 1).padStart(2)}. ${name} (${affinity}%)`);
    }
}

const args = process.argv.slice(2);

if (args.length !== 2) {
    console.log('Sintassi:\n    node app.js <tag> <fileout>');
    process.exit(1);
}

const preferencesStr = args[0].toLowerCase().trim();
const preferences = new Set(preferencesStr.split(/,\s*/));
const outputFile = args[1];

try {
    const gamesPath = path.join(__dirname, 'games.json');
    const games = readGames(gamesPath);

    const sorted = sortBySimilarity(games, preferences);

    const outputPath = path.join(__dirname, `${outputFile}.json`);
    writeGames(outputPath, sorted);

    printTopMatches(sorted, 10);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}