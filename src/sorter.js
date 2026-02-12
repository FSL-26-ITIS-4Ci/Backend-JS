const fs = require("fs");
const path = require("path");

function normalizeSet(arr) {
  const normalized = Array.from(arr || [])
    .map((item) => String(item).toLowerCase().trim())
    .filter((item) => item.length > 0);
  return normalized;
}

function jaccard(setA, setB) {
  const a = setA || new Set();
  const b = setB || new Set();
  if (a.size === 0 && b.size === 0) return 0.0;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

function calculateSimilarity(game, referenceSet) {
  if (!game) return 0;
  const gameSet = new Set([
    ...normalizeSet(game.piattaforme || []),
    ...normalizeSet(game.tag || []),
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
  copy.sort((a, b) => b.affinity - a.affinity);
  return copy;
}

function readGames(file) {
  const data = require(file);
  return data.map((game) => ({
    ...game,
    tag: normalizeSet(game.tag),
    piattaforme: normalizeSet(game.piattaforme),
  }));
}

function getTopMatches(games, referenceSet, count = 10) {
  const sorted = sortBySimilarity(games, referenceSet);
  return sorted.slice(0, count);
}

module.exports = {
  normalizeSet,
  readGames,
  sortBySimilarity,
  getTopMatches,
  calculateSimilarity,
};
